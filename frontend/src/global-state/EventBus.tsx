// eventBus.ts
import mitt from 'mitt'

type Events = {
  'confirm-edit': { id: string },
  'cancel-edit': void,
  'toggle:bold': { id: string },
  'toggle:italic': { id: string },
  'toggle:underline': { id: string },
  'set:heading': { id: string; level: 1 | 2 | 3 | 4 | 5 | 6 },
  'set:paragraph': { id: string },
}

const emitter = mitt<Events>()

export default emitter
