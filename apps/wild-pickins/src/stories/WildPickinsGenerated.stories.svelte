<script lang="ts" module>
 import { defineMeta } from '@storybook/addon-svelte-csf';
 const { Story }=defineMeta({title:'WILD_PICKINS/Generated playtest'});
</script>
<script lang="ts">
 import { setContext } from '../game/context';
 import GeneratedPlaytest from '../components/GeneratedPlaytest.svelte';
 setContext();
</script>
<Story name="Play improved base game">
 <GeneratedPlaytest profile="multiplier-wilds" />
</Story>
<Story name="Unweighted control">
 <GeneratedPlaytest profile="natural" />
</Story>
<Story name="Multiplier Wilds rework">
 <GeneratedPlaytest profile="multiplier-wilds" />
</Story>
<Story name="Optimized reference">
 <GeneratedPlaytest profile="reference" />
</Story>
<Story name="Optimized quieter base">
 <GeneratedPlaytest profile="quieter-base" />
</Story>

<Story name="Candidate 1 weighted">
 <GeneratedPlaytest profile="candidate-1" />
</Story>
<Story name="Candidate 3 weighted">
 <GeneratedPlaytest profile="candidate-3" />
</Story>

<Story name="500k Candidate 1 weighted" exportName="Candidate500k1Weighted">
 <GeneratedPlaytest profile="candidate-500k-1" />
</Story>
