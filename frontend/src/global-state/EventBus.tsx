// eventBus.ts
import mitt from 'mitt'

type Events = {
  'confirm-edit': { id: string },
  'cancel-edit': void,
  'toggle:bold': { id: string },
  'toggle:italic': { id: string },
  'toggle:underline': { id: string },
}

const emitter = mitt<Events>()

export default emitter
