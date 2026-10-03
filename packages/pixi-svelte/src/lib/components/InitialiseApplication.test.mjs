import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

function setup(preloadTemplateFont = false) {
	const lifecycle = { mount: [], destroy: [] },
		appended = [],
		instances = [];
	let resolveInit, resolveFont;
	const init = new Promise((resolve) => (resolveInit = resolve));
	const font = new Promise((resolve) => (resolveFont = resolve));
	let fontCalls = 0;
	const context = {
		stateApp: {
			pixiApplication: undefined,
			reset() {
				this.pixiApplication = undefined;
			},
		},
	};
	const ports = {
		context,
		PIXI: {
			Assets: { reset() {} },
			Application: class {
				constructor() {
					this.canvas = {};
					this.renderer = { events: {}, canvas: { style: {} } };
					this.destroyed = 0;
					instances.push(this);
				}
				init() {
					return init;
				}
				destroy() {
					this.destroyed++;
				}
			},
		},
		devicePixelRatio: { current: 1 },
		window: {},
		getContextApp: () => context,
		preloadFont: () => {
			fontCalls++;
			return font;
		},
		onMount: (fn) => lifecycle.mount.push(fn),
		onDestroy: (fn) => lifecycle.destroy.push(fn),
		$props: () => ({ preloadTemplateFont }),
		$state: (value) => value,
		console,
	};
	vm.createContext(ports);
	function run(file, extra = '') {
		const source = readFileSync(new URL(file, import.meta.url), 'utf8');
		const script = source
			.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]
			.replace(/^\s*import\s+.*?;\s*$/gm, '');
		return vm.runInContext(stripTypeScriptTypes(`{${script}\n${extra}}`), ports);
	}
	// Parent setup precedes child setup, then child onMount precedes parent onMount.
	run('./App.svelte');
	ports.wrapPort = { appendChild: (canvas) => appended.push(canvas) };
	run('./InitialiseApplication.svelte', 'wrap = wrapPort;');
	return {
		context,
		lifecycle,
		appended,
		instances,
		resolveInit,
		resolveFont,
		get fontCalls() {
			return fontCalls;
		},
	};
}

test('startup with template font disabled survives parent mount and an async renderer init', async () => {
	const app = setup(false);
	const pending = app.lifecycle.mount.toReversed().map((fn) => fn());
	app.resolveInit();
	await Promise.all(pending);
	assert.equal(app.fontCalls, 0);
	assert.equal(app.instances.length, 1);
	assert.equal(app.context.stateApp.pixiApplication, app.instances[0]);
	assert.equal(app.appended[0], app.instances[0].canvas);
});

test('unmount during renderer initialization disposes the owned renderer without attaching a stale canvas', async () => {
	const app = setup(false),
		pending = app.lifecycle.mount.toReversed().map((fn) => fn());
	app.lifecycle.destroy.forEach((fn) => fn());
	app.resolveInit();
	await Promise.all(pending);
	assert.equal(app.appended.length, 0);
	assert.equal(app.instances[0].destroyed, 1);
	assert.equal(app.context.stateApp.pixiApplication, undefined);
});

test('unmount during the optional font wait never creates a renderer', async () => {
	const app = setup(true),
		pending = app.lifecycle.mount.toReversed().map((fn) => fn());
	app.lifecycle.destroy.forEach((fn) => fn());
	app.resolveFont();
	await Promise.all(pending);
	assert.equal(app.fontCalls, 1);
	assert.equal(app.instances.length, 0);
});

test('a mounted renderer is destroyed exactly once after the parent resets shared state', async () => {
	const app = setup(false),
		pending = app.lifecycle.mount.toReversed().map((fn) => fn());
	app.resolveInit();
	await Promise.all(pending);
	app.lifecycle.destroy.forEach((fn) => fn());
	assert.equal(app.instances[0].destroyed, 1);
	assert.equal(app.context.stateApp.pixiApplication, undefined);
});
