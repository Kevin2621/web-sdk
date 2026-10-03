<script lang="ts">
    import { base } from '$app/paths';
    type Paytable = {
        paths: number[][];
        paytable: Record<string, Record<string, number>>;
        bonusPaytable: Record<string, Record<string, number>>;
    };
    let {
        open,
        onclose,
        bet,
        levels,
        simulated,
        bonusAvailable,
        bonusCost,
        autoplayDisabled,
        turboDisabled,
        math,
        multiplierRules,
        goldenPicksEnabled,
    }: {
        open: boolean;
        onclose: () => void;
        bet: number;
        levels: number[];
        simulated: boolean;
        bonusAvailable: boolean;
        bonusCost: number;
        autoplayDisabled: boolean;
        turboDisabled: boolean;
        math: Paytable;
        multiplierRules: boolean;
        goldenPicksEnabled: boolean;
    } = $props();
    let dialog = $state<HTMLDialogElement>(undefined!);
    $effect(() => {
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    });
    // Release follow-ups from the original: keyboard shortcuts, interrupted-round
    // recovery, round history, and operator terms still need implementation/content.
    // Keep development placeholders out of the player-facing catalog.
    const symbols = [
        ['C01', 'H1'],
        ['C02', 'H2'],
        ['C03', 'H3'],
        ['C04', 'L1'],
        ['C05', 'L2'],
        ['C06', 'L3'],
        ['C07', 'L4'],
        ['C08', 'L5'],
    ];
    const sharedPayouts = $derived(
        symbols.every(([id]) =>
            [3, 4, 5].every((count) => math.paytable[id][count] === math.bonusPaytable[id][count]),
        ),
    );
    const payout = (value: number) =>
        `${(value / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}×`;
    const amount = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
</script>

<dialog class="catalog" bind:this={dialog} {onclose} aria-labelledby="catalog-title">
    <div class="catalog-shell">
        <button class="catalog-dismiss" type="button" tabindex="-1" onclick={() => dialog.close()} aria-label="Close information"></button>
        <div class="catalog-panel">
            <header class="catalog-header">
                <div><h1 id="catalog-title">Wild Harvest</h1><p>Game rules &amp; payouts</p></div>
                <button class="close" type="button" onclick={() => dialog.close()} aria-label="Close information">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18" /></svg>
                </button>
            </header>
            <nav aria-label="Game information sections">
                <a href="#catalog-prizes">Payouts &amp; lines</a>
                <a href="#catalog-wilds">Wilds</a>
                <a href="#catalog-bonus">Free spins</a>
                <a href="#catalog-controls">Controls</a>
            </nav>
            <div class="catalog-scroll">
                <div class="catalog-body">
                    <section id="catalog-prizes" aria-labelledby="prizes-title" tabindex="-1">
                        <h2 id="prizes-title">Payouts &amp; paylines</h2>
                        <p>The game has <strong>5 reels and 3 rows</strong>. All <strong>{math.paths.length} paylines</strong> are active on every spin.</p>
                        <ul>
                            <li>Match at least <strong>3 symbols on consecutive reels</strong>, starting on the <strong>leftmost reel</strong> and following a payline.</li>
                            <li>Only the highest winning combination pays on each line. Wins on different lines are added together.</li>
                        </ul>
                        <p>Prizes below are multiples of your bet for a single winning line. <strong>2× means twice your bet.</strong>
                            {sharedPayouts ? 'The same prizes apply in base play and free spins.' : 'Base play and free spins have different prizes, shown below.'}
                        </p>
                        {#each (sharedPayouts ? ['shared'] : ['base', 'bonus']) as mode}
                            <div class="table-scroll" tabindex="0" role="region" aria-label={mode === 'bonus' ? 'Free-spin symbol payouts' : 'Symbol payouts'}>
                                <table>
                                    <caption>{mode === 'shared' ? 'Symbol payouts' : mode === 'base' ? 'Base-game payouts' : 'Free-spin payouts'}</caption>
                                    <thead><tr><th scope="col">Symbol</th>{#each [3, 4, 5] as count}<th scope="col">{count} matches</th>{/each}</tr></thead>
                                    <tbody>
                                        {#each symbols as [id, art], index}
                                            <tr>
                                                <th scope="row"><img class="pay-symbol" src={`${base}/assets/art-refresh/${art}.png`} alt={`${index < 3 ? 'High' : 'Low'} symbol ${index < 3 ? index + 1 : index - 2}`} draggable="false" /></th>
                                                {#each [3, 4, 5] as count}<td>{payout((mode === 'bonus' ? math.bonusPaytable : math.paytable)[id][count])}</td>{/each}
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {/each}
                        <p class="callout"><strong>Maximum round win: 5,000× your bet.</strong> This limit includes the base spin and any free spins combined. The round ends when the limit is reached.</p>
                        <details>
                            <summary>View all {math.paths.length} paylines</summary>
                            <p class="note">Highlighted cells show the symbol positions on each payline, from left to right.</p>
                            <div class="line-grid">
                                {#each math.paths as rows, index}
                                    <div class="line-card"><span>{index + 1}</span>
                                        <div class="line-cells" role="img" aria-label={`Payline ${index + 1}: ${rows.map(row => ['top', 'middle', 'bottom'][row]).join(', ')}`}>
                                            {#each [0, 1, 2] as row}{#each [0, 1, 2, 3, 4] as reel}<i class:active={rows[reel] === row}></i>{/each}{/each}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </details>
                    </section>

                    <section id="catalog-wilds" aria-labelledby="wilds-title" tabindex="-1">
                        <h2 id="wilds-title">{multiplierRules ? 'Wilds & multipliers' : 'Wilds'}</h2>
                        <div class="symbol-rule">
                            <img src={`${base}/assets/art-refresh/W.png`} alt="Wild symbol" draggable="false" />
                            <div><p>Wilds replace any paying symbol to help form a winning combination. <strong>They do not replace Seed Packet scatters.</strong></p>
                                {#if multiplierRules}
                                    <p>Wilds have a value of <strong>1×, 2×, or 3×</strong>. Add the values of the Wilds in a winning combination, then multiply that line’s prize by the total.</p>
                                    <p class="callout"><strong>Example:</strong> a 2× Wild and a 3× Wild in the same winning combination multiply that line’s prize by <strong>5</strong>. A winning combination with no Wilds pays its normal prize.</p>
                                {/if}
                            </div>
                        </div>
                        {#if goldenPicksEnabled}
                            <h3>Golden Pick</h3>
                            <p>On a spin, Golden Pick can turn <strong>one ordinary paying symbol into a Wild</strong> before wins are calculated. A pick does not guarantee a win.</p>
                        {/if}
                    </section>

                    <section id="catalog-bonus" aria-labelledby="bonus-title" tabindex="-1">
                        <h2 id="bonus-title">Free spins</h2>
                        <div class="symbol-rule">
                            <img src={`${base}/assets/art-refresh/S.png`} alt="Seed Packet scatter symbol" draggable="false" />
                            <div><p>Land Seed Packet scatters <strong>anywhere on the base-game reels</strong> to trigger free spins. Scatters do not pay on paylines or award a separate base-game cash prize.</p></div>
                        </div>
                        <table class="scatter-table">
                            <caption>Free-spin awards</caption>
                            <thead><tr><th scope="col">Scatters</th><th scope="col">Free spins</th></tr></thead>
                            <tbody>{#each [[3, 10], [4, 15], [5, 20]] as [scatters, spins]}<tr><th scope="row">{scatters}</th><td>{spins}</td></tr>{/each}</tbody>
                        </table>
                        <h3>What happens during free spins</h3>
                        <ul>
                            <li><strong>Your bet stays the same</strong> as the bet that triggered the feature. Base-game Wilds do not carry into free spins.</li>
                            <li><strong>New Wilds stay in place</strong> for the rest of the feature. These are called sticky Wilds.</li>
                            <li><strong>A Wild landing on an existing sticky Wild adds 1 free spin.</strong>{#if multiplierRules} This does not increase the sticky Wild’s multiplier.{/if}</li>
                            <li><strong>At most 30 free spins can be awarded in total</strong>, including the initial award and all extra spins. This is a limit on spins awarded, not spins remaining.</li>
                            <li>A full board of Wilds continues to pay on any remaining spins, subject to the maximum round win.</li>
                        </ul>
                        <p>The game displays your remaining spins and accumulated bonus win. The feature ends when no spins remain or the maximum round win is reached.</p>
                        <h3>Bonus purchase</h3>
                        {#if bonusAvailable}
                            <p>Select <strong>Bonus</strong> to open the purchase confirmation. Choose Low (50×, 10 spins), Medium (200×, 15 spins), or High (500×, 20 spins). The selected price is <strong>{amount(bonusCost)}× your bet</strong>. Availability depends on the session and game mode.</p>
                        {:else}<p class="note">Bonus purchase is unavailable in this session.</p>{/if}
                    </section>

                    <section id="catalog-controls" aria-labelledby="controls-title" tabindex="-1">
                        <h2 id="controls-title">Controls &amp; balance</h2>
                        {#if simulated}<p class="callout">This is an event preview. No money is charged.</p>{/if}
                        <dl class="controls">
                            <div><dt>Bet</dt><dd>Use the arrows or bet selector to choose your bet. Current bet: <strong>{amount(bet)}</strong>.{#if levels.length > 0} Available range: {amount(Math.min(...levels))}–{amount(Math.max(...levels))}.{/if}</dd></div>
                            <div><dt>Spin / Stop</dt><dd>Press <strong>Spin</strong> to play one round. During play, press <strong>Stop</strong> to finish the presentation more quickly.</dd></div>
                            <div><dt>Speed</dt><dd>{turboDisabled ? 'Speed controls are unavailable in this session.' : 'Use the speed control to switch between Normal, Quick, and Ultra presentation speeds.'}</dd></div>
                            <div><dt>Autoplay</dt><dd>
                                {#if autoplayDisabled}Autoplay is unavailable in this session.
                                {:else}<p><strong>Auto Spin</strong> plays a selected number of rounds. Use Stop to end autoplay after the current round and any awarded bonus finish.</p>
                                    <p>The menu offers a round count, an optional stop on bonus, a session loss limit, and a single win limit. Limits take effect after the current round; that round can take losses past your chosen limit.</p>
                                {/if}
                            </dd></div>
                            <div><dt>Balance &amp; win</dt><dd>Your wager is deducted when the round begins. Any prize is added when the round finishes. The control bar shows your balance and latest win.</dd></div>
                            <div><dt>Settings</dt><dd>Open Settings for sound and motion controls. Available options can vary by session.</dd></div>
                        </dl>
                    </section>
                </div>
            </div>
        </div>
    </div>
</dialog>

<style>
    .catalog {
        --info-text: var(--control-text, #eef0f3);
        --info-muted: #c3cad2;
        --info-accent: var(--control-accent, #dfc58d);
        position: fixed; inset: 0; margin: 0; width: 100%; max-width: none;
        height: 100dvh; max-height: none; padding: 0; border: 0;
        background: transparent; color: var(--info-text); overflow: hidden;
        font: 15px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .catalog::backdrop { background: #080b10b8; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
    .catalog-shell { position: relative; display: flex; justify-content: center; height: 100%; padding: clamp(8px, 3vh, 28px) clamp(8px, 3vw, 40px); box-sizing: border-box; }
    .catalog-dismiss { position: absolute; inset: 0; width: 100%; border: 0; background: transparent; }
    .catalog-panel {
        position: relative; display: flex; flex-direction: column; width: min(100%, 920px); min-width: 0; min-height: 0;
        border: 1px solid #ffffff30; border-radius: 18px; overflow: hidden;
        background: linear-gradient(145deg, #414851ed, #252a32f2 45%, #1c2027f5);
        backdrop-filter: blur(28px) saturate(1.1); -webkit-backdrop-filter: blur(28px) saturate(1.1);
        box-shadow: inset 0 1px #ffffff30, 0 24px 72px #0009; user-select: text;
    }
    .catalog-header { display: flex; align-items: center; gap: 16px; padding: 18px 28px 14px; flex: none; }
    h1 { font-size: 23px; line-height: 1.2; margin: 0; }
    .catalog-header p { color: var(--info-muted); margin: 3px 0 0; font-size: 14px; }
    .close { display: grid; place-items: center; flex: none; margin-left: auto; width: 44px; height: 44px; border: 1px solid #ffffff38; border-radius: 12px; background: #ffffff10; color: inherit; cursor: pointer; }
    .close svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
    nav { display: flex; flex-wrap: wrap; gap: 4px 8px; flex: none; padding: 0 22px 12px; border-bottom: 1px solid #ffffff24; }
    nav a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 10px; color: var(--info-text); text-decoration: underline; text-underline-offset: 4px; font-size: 14px; border-radius: 7px; }
    nav a:hover, .close:hover { background: #ffffff1a; }
    :is(a, button, summary, .table-scroll):focus-visible { outline: 2px solid var(--info-accent); outline-offset: -2px; }
    section:focus { outline: none; }
    .catalog-scroll { overflow-y: auto; min-height: 0; flex: 1; overscroll-behavior: contain; scrollbar-gutter: stable; scrollbar-color: #8e98a5 #ffffff0a; }
    .catalog-body { padding: 0 28px 28px; }
    section { padding: 26px 0; border-bottom: 1px solid #ffffff24; scroll-margin-top: 16px; }
    section:last-child { border: 0; padding-bottom: 0; }
    h2 { font-size: 21px; line-height: 1.3; margin: 0 0 14px; color: var(--info-accent); }
    h3 { font-size: 16px; line-height: 1.4; margin: 22px 0 8px; }
    p { margin: 0 0 12px; }
    ul { margin: 12px 0 18px; padding-left: 22px; }
    li { padding-left: 3px; margin: 7px 0; }
    strong { font-weight: 650; }
    .note { color: var(--info-muted); }
    .callout { border-left: 3px solid var(--info-accent); background: #ffffff07; padding: 12px 16px; margin: 18px 0 0; }
    .table-scroll { overflow-x: auto; margin: 18px 0; border: 1px solid #ffffff24; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
    caption { padding: 10px 14px; text-align: left; font-size: 14px; font-weight: 600; color: var(--info-muted); background: #00000018; }
    th, td { padding: 8px 12px; text-align: center; border-bottom: 1px solid #ffffff16; }
    thead th { background: #10151d55; font-size: 14px; font-weight: 600; white-space: nowrap; }
    tbody tr:nth-child(even) { background: #ffffff04; }
    tbody tr:last-child :is(th, td) { border-bottom: 0; }
    td { font-weight: 650; }
    .pay-symbol { display: block; width: 50px; height: 50px; object-fit: contain; margin: auto; }
    .symbol-rule { display: flex; align-items: flex-start; gap: 18px; }
    .symbol-rule > img { width: 76px; height: 86px; object-fit: contain; flex: none; }
    .symbol-rule > div { min-width: 0; }
    .symbol-rule p:last-child { margin-bottom: 0; }
    .scatter-table { margin: 18px 0; max-width: 440px; background: #ffffff05; }
    details { margin-top: 20px; }
    summary { cursor: pointer; padding: 12px 0; color: var(--info-accent); font-weight: 600; }
    .line-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 10px; margin-top: 12px; }
    .line-card { display: flex; align-items: center; gap: 9px; padding: 9px; border: 1px solid #ffffff24; border-radius: 6px; }
    .line-card > span { font-size: 12px; min-width: 17px; color: var(--info-muted); }
    .line-cells { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; flex: 1; }
    .line-cells i { aspect-ratio: 1.15; border-radius: 2px; background: #ffffff12; }
    .line-cells i.active { background: var(--info-accent); box-shadow: inset 0 0 0 1px #ffffff60; }
    .controls { margin: 0; }
    .controls > div { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 18px; padding: 15px 0; border-bottom: 1px solid #ffffff16; }
    .controls > div:last-child { border: 0; }
    dt { font-weight: 650; }
    dd { margin: 0; }
    dd p:last-child { margin-bottom: 0; }
    @media (max-width: 540px) {
        .catalog-header { padding: 16px; }
        nav { padding: 0 8px 8px; gap: 0; }
        nav a { font-size: 13px; padding: 0 8px; }
        .catalog-body { padding: 0 16px 20px; }
        h1 { font-size: 21px; }
        h2 { font-size: 19px; }
        th, td { padding: 7px; }
        .pay-symbol { width: 44px; height: 44px; }
        .symbol-rule { gap: 12px; }
        .symbol-rule > img { width: 52px; height: 66px; }
        .controls > div { grid-template-columns: 1fr; gap: 4px; }
    }
</style>