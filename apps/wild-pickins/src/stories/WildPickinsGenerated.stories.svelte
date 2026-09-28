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

<Story name="Historical 500k Candidate 1 tuned pays" exportName="Candidate500k1Weighted">
 <GeneratedPlaytest profile="candidate-500k-1" />
</Story>
<Story name="Historical 1m Candidate 2 tuned pays" exportName="Candidate1m2Weighted">
 <GeneratedPlaytest profile="candidate-1m-2" />
</Story>
<Story name="Corrected paytable 500k Candidate 3 feel matched" exportName="Corrected500kCandidate3Feel">
 <GeneratedPlaytest profile="candidate-corrected-500k-3-feel" />
</Story>
<Story name="Corrected paytable 1m Candidate 1 with session stats" exportName="Corrected1mCandidate1">
 <GeneratedPlaytest profile="candidate-corrected-1m-1" />
</Story>
<Story name="Standard Bonus Buy High · 500× · 20 spins" exportName="StandardBonusBuyHigh">
 <GeneratedPlaytest profile="candidate-corrected-1m-1" buyTier="high" />
</Story>
<Story name="Standard Bonus Buy Medium · 200× · 15 spins" exportName="StandardBonusBuyMedium">
 <GeneratedPlaytest profile="candidate-corrected-1m-1" buyTier="medium" />
</Story>
