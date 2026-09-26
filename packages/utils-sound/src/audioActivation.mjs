// Browsers may suspend audio before the first gesture or after a tab interruption.
// Read the current context each time: Howler can replace it during initialization.
export function installAudioActivation({ getContext, target, onActivate = () => {} }) {
 const activate = () => {
  onActivate();
  const context = getContext();
  if (context && context.state !== 'running' && context.state !== 'closed') {
   return context.resume().catch(() => {}); // Retry on the next real gesture.
  }
 };
 const events = ['pointerdown', 'touchend', 'keydown'];
 for (const event of events) target.addEventListener(event, activate, true);
 return () => { for (const event of events) target.removeEventListener(event, activate, true); };
}
