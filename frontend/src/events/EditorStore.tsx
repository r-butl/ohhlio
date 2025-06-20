// HistoryStore.ts
import { create } from 'zustand'
import { produce } from 'immer'
import emitter from './EventBus'

export type TextItemProps = {
  content: string;
  fontSize: number;
  fontFamily: string;
  textAlignVertical: 'top' | 'center' | 'bottom';
  textAlignHorizontal: 'left' | 'center' | 'right';
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  maxChars: number;
  charCount: number;
}

export type ImageItemProps = {
  
}

// Layout configuration for 1 item
type Layout = {
  x: number
  y: number
  w: number
  h: number
  i: string
}

// Type definition for 1 item
type Item = {
  id: string
  type: 'text' | 'image'
  layout: Layout
  props: any
}

// Layout configuration for renderer
const LAYOUT_CONFIG = {
  maxWidth: 1600,
  rowHeight: 1600 / 25,
  columnCount: 12,
  defaultItemSize: {
    w: 3,
    h: 3
  }
} as const

// State information for the Editor page
type State = {
  items: Record<string, Item>     // Items in the layout
  mode: 'edit' | 'display'        // Mode of the editor
  activeEditor: string | null     // ID of the current item being edited

  history: {                      // History of all actions in the editor
    past: Record<string, Item>[]
    present: Record<string, Item>
    future: Record<string, Item>[]
  }
  
  editorMaxWidth: number          // Width of the renderer content on the portfolio
  gridRowHeight: number           // Height in pixels of each row of the grid
  gridColumnCount: number         // Number of columns that will fit within the renderer
  defaultItemWidth: number
  defaultItemHeight: number

  // History interaction
  undo: () => void
  redo: () => void

  // Editor interaction
  toggleEditorMode: () => void
  setActiveEditor: (id: string | null) => void
  buttonHovered: boolean
  setButtonHoveredState: (state: boolean) => void;

  // Grid item interaction (text/image/ect content) 
  setItems: (fn: (draft: Record<string, Item>) => void) => void // immer function for setting items, useful for protective state updates
  addItem: (type: 'text' | 'image') => void
  deleteItem: (id: string) => void
  updateLayout: (layout: any[]) => void
}

export const useEditorStore = create<State>((set, get) => ({
  items: {},
  mode: 'edit',
  history: { past: [], present: {}, future: [] },
  activeEditor: null,
  editorMaxWidth: 1600,
  gridRowHeight: 1600 / 25,
  gridColumnCount: 12,
  defaultItemWidth: 3,
  defaultItemHeight: 3,
  buttonHovered: false,

  // Toggle the button hovered state
  setButtonHoveredState: (state: boolean) => {
    set(({ buttonHovered: state}))
  },

  // Use this function to make changes the grid items
  setItems: (fn) => {
    console.log('Setting items.')
    const { items, history } = get()
    const nextItems = produce(items, (draft) => fn(draft))
    set({
      items: nextItems,
      history: {
        past: [...history.past, items],
        present: nextItems,
        future: []
      }
    })
  },

  // Undoes changes made to the grid items
  undo: () => {
    console.log("Undo triggered.")
    const { history } = get()
    if (history.past.length === 0) return

    const previous = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)

    set({
      items: previous,
      history: {
        past: newPast,
        present: previous,
        future: [history.present, ...history.future]
      }
    })
  },

  // Redoes changes made to the grid items
  redo: () => {
    console.log("Redo triggered.")
    const { history } = get()
    if (history.future.length === 0) return

    const next = history.future[0]
    const newFuture = history.future.slice(1)

    set({
      items: next,
      history: {
        past: [...history.past, history.present],
        present: next,
        future: newFuture
      }
    })
  },

  // Toggles the state of the editor
  toggleEditorMode: () => {
    const { mode } = get();
    console.log(`Toggling editor mode: ${mode}`);
    set(state => ({ mode: state.mode === 'edit' ? 'display' : 'edit' }))
  },

  // Sets which grid item is actively editing
  // Creates a backup of the items contents
  setActiveEditor: (id: string | null ) => {
    console.log(`Setting active editor to: ${id}.`)

    const { items, setItems } = get();
    if (id && items[id]) {
      setItems(draft => {
        if (draft[id]) {
          draft[id].props._backup = { ...draft[id].props };
        }
      });
    }
    set({ activeEditor: id });
  },

  // Adds an item to the grid
  addItem: (type) => {
    console.log(`Adding item: ${type}`);

    const { items } = get()
    const id = String(Date.now())
    
    const maxY = Object.values(items).reduce(
      (max, item) => Math.max(max, item.layout.y + item.layout.h), 
      0
    )
    
    const newItem: Item = {
      id,
      type,                   // Type will be checked automatically
      props: {},
      layout: {
        x: 0,
        y: maxY,
        w: get().defaultItemWidth,     // Inital width and height of the new grid item
        h: get().defaultItemHeight,
        i: id
      }
    }

    get().setItems(draft => {
      draft[id] = newItem
    })
  },

  // Removes an item from the items list
  deleteItem: (id) => 
    get().setItems(draft => {
      delete draft[id]
    }),

  // Updates the layout when a change is made
  updateLayout: (layout) => 
    get().setItems(draft => {
      layout.forEach(layoutItem => {
        if (draft[layoutItem.i]) {
          draft[layoutItem.i].layout = layoutItem
        }
      })
    })
}))
