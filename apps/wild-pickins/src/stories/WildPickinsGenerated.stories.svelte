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
 <GeneratedPlaytest profile="quieter-base" />
</Story>
<Story name="Unweighted control">
 <GeneratedPlaytest profile="natural" />
</Story>
<Story name="Optimized reference">
 <GeneratedPlaytest profile="reference" />
</Story>
<Story name="Optimized quieter base">
 <GeneratedPlaytest profile="quieter-base" />
</Story>
