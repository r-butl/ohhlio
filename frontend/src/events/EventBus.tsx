// eventBus.ts
import mitt from 'mitt'

type Events = {
  'confirm-edit': { id: string },
  'cancel-edit': void,
  'global-event': string
}

const emitter = mitt<Events>()

// Example of a persistent event listener that's always active
// This listener will never be removed and will always respond to events
emitter.on('global-event', (data) => {
  console.log('Persistent listener received:', data);
  // Handle the event here - this will always run
});

export default emitter
