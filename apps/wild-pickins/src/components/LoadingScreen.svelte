<script lang="ts">
 import { getContext } from '../game/context';
 const { onloaded } = $props<{ onloaded: () => void }>();
 const context = getContext();
 function proceed() {
  if (context.stateApp.loaded) onloaded();
 }
</script>

<div class="intro-screen" aria-label="Wild Pickins test loading screen">
 <div class="intro-content">
  <h1>TEST</h1>
  <p>Wild Pickins</p>

   <button class="continue-button" onclick={proceed} disabled={!context.stateApp.loaded}>
    {context.stateApp.loaded ? 'Continue' : 'Loading…'}
   </button>

 </div>
</div>

<style>
 .intro-screen { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; background:#18201b; color:#f5ebd4; font-family:Georgia,serif; }
 .intro-content { text-align:center; padding:24px; }
 h1 { font-size:clamp(48px,10vw,88px); letter-spacing:.15em; margin:0; }
 p { font-size:20px; margin:18px 0 28px; }
 button { display:block; margin:14px auto; padding:13px 36px; border:1px solid #9e927b; border-radius:6px; color:inherit; background:transparent; font:inherit; cursor:pointer; }
 .continue-button { background:#ebd4a4; color:#18201b; min-width:180px; }
 button:disabled { opacity:.5; cursor:wait; }
 button:focus-visible { outline:3px solid #fff; outline-offset:4px; }
</style>
