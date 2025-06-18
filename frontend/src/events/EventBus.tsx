// eventBus.ts
import mitt from 'mitt'

type Events = {
  'renderer-mode:toggle': void
  'item:update': { id: string, props: any }
  'item:add' : { type: string }
  'item:focus': string
  'undo': void
  'redo': void

}

const emitter = mitt<Events>()
export default emitter
