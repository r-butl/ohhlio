// HistoryStore.ts
import { create } from 'zustand'
import { produce, enablePatches, applyPatches, Patch } from 'immer'

enablePatches()

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
  originalImage: string | null;
  croppedImage: string | null;
  crop: { x: number; y: number };
  zoom: number;
  aspectRatio: number;
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

// State information for the Editor page
type State = {
  items: Record<string, Item>     // Items in the layout
  mode: 'edit' | 'display'        // Mode of the editor
  activeEditor: string | null     // ID of the current item being edited
  activeOptionsPanel: string | null // ID of the current option panel that is open

  history: {                      // History of all actions in the editor
    past: { patches: Patch[]; inversePatches: Patch[] }[]
    future: { patches: Patch[]; inversePatches: Patch[] }[]
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
  setActiveOptionsPanel: (id: string | null) => void;
  buttonHovered: boolean  // Used for controlling the resize and draggability of the grid items
                          //   when certain buttons on the component are hovered over them
  setButtonHoveredState: (state: boolean) => void;

  // Grid item interaction (text/image/ect content) 
  setItemsWithHistory: (fn: (draft: Record<string, Item>) => void) => void
  setItemsWithoutHistory: (fn: (draft: Record<string, Item>) => void) => void
  
  addItem: (type: 'text' | 'image') => void
  deleteItem: (id: string) => void
  updateLayout: (layout: any[]) => void
}

export const useEditorStore = create<State>((set, get) => ({
  items: {},
  mode: 'edit',
  history: { past: [], future: [] },
  activeEditor: null,
  editorMaxWidth: 800,
  gridRowHeight: 1600 / 32,
  gridColumnCount: 4,

  defaultItemWidth: 1,
  defaultItemHeight: 4,
  buttonHovered: false,
  activeOptionsPanel: null,

  // Toggle the button hovered state
  setButtonHoveredState: (state: boolean) => {
    set(({ buttonHovered: state}))
  },

  // Toggle the option panel opened 
  setActiveOptionsPanel: (id: string | null ) => {
    set(({ activeOptionsPanel: id }))
  },

  // Toggles the state of the editor
  toggleEditorMode: () => {
    const { mode } = get();
    console.log(`Toggling editor mode: ${mode}`);
    set(state => ({ mode: state.mode === 'edit' ? 'display' : 'edit' }))
  },

  // Sets which grid item is actively editing
  setActiveEditor: (id: string | null ) => {
    console.log(`Setting active editor to: ${id}.`)

    const { items, setItemsWithoutHistory } = get();
    if (id && items[id]) {
      setItemsWithoutHistory(draft => {
        if (draft[id]) {
          draft[id].props._backup = { ...draft[id].props };
        }
      });
    }
    set({ activeEditor: id });
  },

  // Actions that should be tracked in history (undo/redo)
  setItemsWithHistory: (fn) => {
    const { items, history } = get()
    let patches: Patch[] = []
    let inversePatches: Patch[] = []
    const nextItems = produce(
      items,
      fn,
      (p, ip) => {
        patches = p
        inversePatches = ip
      }
    )

    if (patches.length > 0) {
      console.log("Setting items. (history)", nextItems);
      set({
        items: nextItems,
        history: {
          past: [...history.past, { patches, inversePatches }],
          future: []
        }
      })
    }
    console.log(`Past: ${history.past.length} Future: ${history.future.length}`)
  },

  // Actions that should NOT be tracked in history
  setItemsWithoutHistory: (fn) => {
    const { items } = get()
    const nextItems = produce(items, (draft) => fn(draft))
    console.log("Setting items. (no history)", nextItems);
    set({ items: nextItems })
  },

  // Undoes changes made to the grid items
  undo: () => {
    const { history, items } = get()
    console.log(`Past: ${history.past.length} Future: ${history.future.length}`)
    if (history.past.length === 0) return

    const lastAction = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)
    
    set({
      items: applyPatches(items, lastAction.inversePatches),
      history: {
        past: newPast,
        future: [lastAction, ...history.future]
      }
    })
  },

  // Redoes changes made to the grid items
  redo: () => {
    const { history, items } = get()

    console.log(`Past: ${history.past.length} Future: ${history.future.length}`)

    if (history.future.length === 0) return

    const actionToRedo = history.future[0]
    const newFuture = history.future.slice(1)
    set({
      items: applyPatches(items, actionToRedo.patches),
      history: {
        past: [...history.past, actionToRedo],
        future: newFuture
      }
    })
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
    
    // Create default props based on item type
    let defaultProps: any = {};
    let layout_config: any = {};

    if (type === 'text') {
      defaultProps = {
        content: "Select <strong>Options &gt; Edit</strong> to add text.",
        fontSize: 16,
        fontFamily: 'Arial',
        textAlignVertical: 'center' as const,
        textAlignHorizontal: 'left' as const,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        maxChars: 1000,
        charCount: 0
      };
      layout_config ={
        x: 0,
        y: maxY,
        w: get().gridColumnCount,
        h: 1,
        i: id,
        minW: get().gridColumnCount,  
        minH: 1,
        maxW: get().gridColumnCount,
        maxH: 40,
      };
      
    } else if (type === 'image') {
      defaultProps = {
        originalImage: null,
        croppedImage: null,
        crop: { x: 0, y: 0 },
        zoom: 1,
        aspectRatio: 4 / 3
      };
      layout_config ={
        x: 0,
        y: maxY,
        w: 1,
        h: 4,
        i: id,
        minW: 1,  
        minH: 4,
        maxW: get().gridColumnCount,
        maxH: 40,
      };
    }
    
    const newItem: Item = {
      id,
      type,
      props: defaultProps,
      layout: layout_config
    }

    get().setItemsWithHistory(draft => {
      draft[id] = newItem
    })
  },

  // Removes an item from the items list
  deleteItem: (id) => 
    get().setItemsWithHistory(draft => {
      delete draft[id]
    }),

  // Updates the layout when a change is made
  updateLayout: (layout) => 
    get().setItemsWithHistory(draft => {
      layout.forEach(layoutItem => {
        if (draft[layoutItem.i]) {
          draft[layoutItem.i].layout = layoutItem
        }
      })
    })
}))
