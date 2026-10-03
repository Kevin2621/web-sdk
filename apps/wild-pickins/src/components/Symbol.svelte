<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import WildSpine from './WildSpine.svelte';
	import ArtSymbol from './ArtSymbol.svelte';
	import { symbolArtwork } from '../game/symbolAppearance';
	import { getSymbolInfo, getArtworkName } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { BitmapText, Container } from 'pixi-svelte';
	import { seedCelebration } from '../game/seedCelebration.svelte';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const artworkName = $derived(getArtworkName(props.rawSymbol.name));
	const holdScatterOpen = $derived(
		seedCelebration.openTriggerBags.includes(props.rawSymbol) &&
			['static', 'postWinStatic', 'spin'].includes(props.state),
	);
</script>

{#if props.rawSymbol.name === 'W'}
	<WildSpine
		x={props.x}
		y={props.y}
		state={props.state}
		multiplier={props.rawSymbol.multiplier}
		oncomplete={props.oncomplete}
	/>
{:else if artworkName === 'S'}
	<Container alpha={seedCelebration.active && seedCelebration.exitProgress < 0 ? 0 : 1}>
		<SymbolSpine
			loop={holdScatterOpen ? false : (props.loop ?? false)}
			symbolInfo={holdScatterOpen ? { ...symbolInfo, animationName: 'open_hold' } : symbolInfo}
			x={props.x}
			y={props.y}
			showWinFrame={false}
			listener={{ complete: props.oncomplete }}
		/>
	</Container>
{:else if symbolArtwork[artworkName]}
	<ArtSymbol
		x={props.x}
		y={props.y}
		state={props.state}
		name={artworkName}
		oncomplete={props.oncomplete}
	/>
{:else if isSprite}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		x={props.x}
		y={props.y}
		showWinFrame={props.state === 'win' && !['S', 'M'].includes(props.rawSymbol.name)}
		listener={{
			complete: props.oncomplete,
			event: (_, event) => {
				if (event.data?.name === 'wildExplode') {
					context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				}
			},
		}}
	/>
{/if}

{#if props.rawSymbol.multiplier && props.rawSymbol.name !== 'W'}
	<BitmapText
		anchor={0.5}
		x={props.x}
		y={props.y}
		text={`${props.rawSymbol.multiplier}X`}
		style={{
			fontFamily: 'gold',
			fontSize: 50,
		}}
	/>
{/if}
