<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const smallest = $derived(stateConfig.betAmountOptions[0]);
	const disabled = $derived(
		!context.stateXstateDerived.isIdle() || stateBet.betAmount === smallest,
	);

	const onpress = () => {
		const nextSmaller = [...stateConfig.betAmountOptions]
			.sort((a, b) => b - a)
			.find((option) => option < stateBet.betAmount);

		const previous = stateBet.betAmount;
		stateBetDerived.setBetAmount(nextSmaller || smallest);
		if (stateBet.betAmount !== previous)
			context.eventEmitter.broadcast({ type: 'soundPressGeneral', action: 'playAmount' });
	};
</script>

<UiButton {...props} {sizes} {onpress} {disabled} icon="decrease" />
