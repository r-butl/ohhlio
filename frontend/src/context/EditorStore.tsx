// HistoryStore.ts
import { create } from 'zustand'
import { produce, enablePatches, applyPatches, Patch } from 'immer'
import { getAssetById, uploadAsset, deleteAsset } from '../services/assetService'
import { updateProject, getProjects } from '../services/projectService'
import { toast } from 'sonner'

import {
  TextProps,
  ImageProps,
  ItemLayoutProps,
  ItemProps,
  ProjectHeader,
  ProjectProps
} from '@/interfaces/ProjectItemsInterfaces'

enablePatches()


// State information for the Editor page
type ViewState = 'PublicView' | 'OwnerEdit' | 'OwnerPreview'

type State = {

  currentProject: ProjectProps

  viewState: ViewState            // Source of truth for view mode
  activeEditor: string | null     // ID of the current item being edited
  fileUploadSelected: boolean;

  history: {                      // History of all actions in the editor
    past: { patches: Patch[]; inversePatches: Patch[] }[]
    future: { patches: Patch[]; inversePatches: Patch[] }[]
  }
  
  editorMaxWidth: number          // Width of the renderer content on the portfolio
  gridRowHeight: number           // Height in pixels of each row of the grid
  gridColumnCount: number         // Number of columns that will fit within the renderer

  // History interaction
  undo: () => void
  redo: () => void
  clearHistory: () => void

  // Editor interaction
  // State machine events
  viewerChanged: (isOwner: boolean) => void
  togglePreview: () => void
  enterEdit: () => void
  exitEdit: () => void
  setActiveEditor: (id: string | null) => void
  setActiveOptionsPanel: (id: string | null) => void;
  setFileUploadSelected: (state: boolean) => void;
  setProjectId: (id: string | null) => void;
  setProjectHeader: (header: ProjectHeader) => void;
  buttonHovered: boolean  // Used for controlling the resize and draggability of the grid items
                          //   when certain buttons on the component are hovered over them
  setButtonHoveredState: (state: boolean) => void;

  // Grid item interaction (text/image/ect content) 
  setItemsWithHistory: (fn: (draft: Record<string, ItemProps>) => void) => void
  setItemsWithoutHistory: (fn: (draft: Record<string, ItemProps>) => void) => void
  
  addTextBox: () => void
  addImage: (image: string) => void
  deleteItem: (id: string) => void
  updateLayout: (layout: any[]) => void
  
  // Asset loading
  assetCache: Record<string, any> // Cache for loaded assets
  addAssetToCache: (assetId: string, asset: any) => void
  clearAssetCache: () => void
  getAssetFromCacheOrBackend: (assetId: string) => Promise<any>
  loadProjectAssets: () => Promise<void>
  setIsLoadingAssets: (loading: boolean) => void
  setLoadingProject: (loading: boolean) => void
  setProjectError: (message: string | null) => void
  setLoadingAssets: (loading: boolean) => void
  setAssetError: (assetId: string, message: string) => void

  // Project management
  updateProjectDescription: (description: string) => Promise<void>
  updateProjectHeaderImage: (file: File) => Promise<void>
  
  // Project list management
  projects: any[]
  loadingProjects: boolean
  projectsError: any
  fetchProjects: () => Promise<void>
}

export const useEditorStore = create<State>((set, get) => ({
  
  // Grid layout parameters
  editorMaxWidth: 800,
  gridRowHeight: 1,
  gridColumnCount: 4,

  // UI State
  activeEditor: null,
  viewState: 'PublicView',
  buttonHovered: false,
  activeOptionsPanel: null,
  fileUploadSelected: false,
  isLoadingAssets: false,
  loadingProject: false,
  projectError: null,
  loadingAssets: false,
  assetErrorsById: {},

  // Items management
  assetCache: {},
  history: { past: [], future: [] },

  // Project list state  
  projectId: null,                // Current loaded project
  currentProject: {               // Current loaded project
    projectHeader: {},
    items: {}
  }, 
  projects: [],                   // All projects
  loadingProjects: false,
  projectsError: null,

  ///////////////// INTERACTION STATE /////////////////
  
  // Toggle the fileUploadSelected booleam
  setFileUploadSelected: (state: boolean) => {
    set(({ fileUploadSelected: state}));
  },

  // Toggle the button hovered state
  setButtonHoveredState: (state: boolean) => {
    set(({ buttonHovered: state}))
  },

  setProjectId: (id: string | null) => {

    set({ projectId: id });
  },

  // Toggle the option panel opened 
  setActiveOptionsPanel: (id: string | null ) => {
    set(({ activeOptionsPanel: id }))
  },

  ///////////////// VIEW STATE MACHINE /////////////////
  viewerChanged: (isOwner: boolean) => {
    const current = get();
    const nextView: ViewState = isOwner
      ? (current.viewState === 'OwnerEdit' ? 'OwnerEdit' : 'OwnerPreview')
      : 'PublicView';
    set({ viewState: nextView });
    try { localStorage.setItem('viewState', nextView); } catch {}
  },
  togglePreview: () => {
    const { viewState } = get();
    if (viewState === 'PublicView') return; // no-op for non-owners
    const next: ViewState = viewState === 'OwnerEdit' ? 'OwnerPreview' : 'OwnerEdit';
    set({ viewState: next });
    try { localStorage.setItem('viewState', next); } catch {}
  },
  enterEdit: () => {
    const { viewState } = get();
    if (viewState === 'PublicView') return;
    set({ viewState: 'OwnerEdit' });
    try { localStorage.setItem('viewState', 'OwnerEdit'); } catch {}
  },
  exitEdit: () => {
    const { viewState } = get();
    const next: ViewState = viewState !== 'PublicView' ? 'OwnerPreview' : 'PublicView';
    set({ viewState: next });
    try { localStorage.setItem('viewState', next); } catch {}
  },

  // Sets which grid item is actively editing
  setActiveEditor: (id: string | null ) => {
    const { currentProject, setItemsWithoutHistory } = get();
    const items = currentProject.items;
    if (id && items[id]) {
      setItemsWithoutHistory(draft => {
        if (draft[id]) {
          draft[id].props._backup = { ...draft[id].props };
        }
      });
    }
    set({ activeEditor: id });
  },

  // Set loading state for assets
  setIsLoadingAssets: (loading: boolean) => {
    set({ isLoadingAssets: loading });
  },
  setLoadingProject: (loading: boolean) => {
    set({ loadingProject: loading });
  },
  setProjectError: (message: string | null) => {
    set({ projectError: message });
  },
  setLoadingAssets: (loading: boolean) => {
    set({ loadingAssets: loading });
  },
  setAssetError: (assetId: string, message: string) => {
    set(state => ({ assetErrorsById: { ...state.assetErrorsById, [assetId]: message } }));
  },

  ///////////////// HISTORY /////////////////

  // Actions that should be tracked in history (undo/redo)
  setItemsWithHistory: (fn) => {
    const { currentProject, history } = get()
    const items = currentProject.items;
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
      const newPast = [...history.past, { patches, inversePatches }];
      // Limit history to 20 items, pop oldest if exceeded
      const limitedPast = newPast.length > 20 ? newPast.slice(-20) : newPast;
      set(state => ({
        currentProject: {
          ...state.currentProject,
          items: nextItems
        },
        history: {
          past: limitedPast,
          future: []
        }
      }))
    }
  },

  // Actions that should NOT be tracked in history
  setItemsWithoutHistory: (fn) => {
    const { currentProject } = get()
    const items = currentProject.items;
    const nextItems = produce(items, (draft) => fn(draft))
    set(state => ({
      currentProject: {
        ...state.currentProject,
        items: nextItems 
      }}
  ))
  },

  // Undoes changes made to the grid items
  undo: () => {
    const { history, currentProject } = get()
    const items = currentProject.items;
    if (history.past.length === 0) return

    const lastAction = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)
    
    set(state => ({
      currentProject: {
        ...state.currentProject,
        items: applyPatches(items, lastAction.inversePatches),
      },
      history: {
        past: newPast,
        future: [lastAction, ...history.future]
      }
    }))
  },

  // Redoes changes made to the grid items
  redo: () => {
    const { history, currentProject } = get()
    const items = currentProject.items;
    if (history.future.length === 0) return

    const actionToRedo = history.future[0]
    const newFuture = history.future.slice(1)
    set(state => ({
      currentProject: {
        ...state.currentProject,
        items: applyPatches(items, actionToRedo.patches),
      },
      history: {
        past: [...history.past, actionToRedo],
        future: newFuture
      }
    }))
  },

  // Clears history to mark project as saved
  clearHistory: () => {
    set({ history: { past: [], future: [] } });
  },

  ///////////////// EDITING ITEMS /////////////////

  addTextBox: () => {
    const { currentProject } = get()
    const id = String(Date.now())
    const items = currentProject.items;
    
    const maxY = Object.values(items).reduce(
      (max, item) => Math.max(max, item.layout.y + item.layout.h), 
      0
    )

    let defaultProps = {
      content: "Select Options &gt; Edit to add text.",
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

    let layout_config ={
      x: 0,
      y: maxY,
      w: get().gridColumnCount,
      h: 10,
      i: id,
      minW: get().gridColumnCount,  
      minH: 10,
      maxW: get().gridColumnCount,
      maxH: 40,
    };

    const newItem: ItemProps = {
      id,
      type: 'text',
      props: defaultProps,
      layout: layout_config
    }

    get().setItemsWithHistory(draft => {
      draft[id] = newItem
    })

  },

  addImage: (image) => {
    const { currentProject, gridColumnCount } = get()
    const items = currentProject.items;
    const id = String(Date.now())
    
    // Find the next available position in a grid pattern
    const findNextPosition = () => {
      const existingItems = Object.values(items);
      
      if (existingItems.length === 0) {
        return { x: 0, y: 0 };
      }
      
      // Find the highest Y coordinate
      const maxY = Math.max(...existingItems.map(item => item.layout.y + item.layout.h));
      
      // Find items at the current row (maxY)
      const itemsAtCurrentRow = existingItems.filter(item => 
        item.layout.y < maxY && item.layout.y + item.layout.h >= maxY
      );
      
      // Check if there's space in the current row
      const usedXPositions = itemsAtCurrentRow.map(item => item.layout.x);
      let nextX = 0;
      
      while (usedXPositions.includes(nextX)) {
        nextX++;
      }
      
      // If we can fit in current row, use it
      if (nextX < gridColumnCount) {
        return { x: nextX, y: maxY };
      }
      
      // Otherwise, start a new row
      return { x: 0, y: maxY };
    };
    
    const position = findNextPosition();
    
    // Create default props based on item type
    let defaultProps: any = {};
    let layout_config: any = {};

    defaultProps = {
      assetId: null,
      originalImage: image,
      zoom: 1,
      aspectRatio: 4 / 3,
      isUploading: false
    };

    layout_config ={
      x: position.x,
      y: position.y,
      w: 1,
      h: 30,
      i: id,
      minW: 1,  
      minH: 30,
      maxW: gridColumnCount,
      maxH: 200,
    };
    
    
    const newItem: ItemProps = {
      id,
      type: 'image',
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
  }),


  setProjectHeader: (header: ProjectHeader) => {
    set( state => ({
      currentProject: {
        ...state.currentProject,
        projectHeader: header 
      }}));
  },

  // Update project description
  updateProjectDescription: async (description: string) => {
    const { projectId, currentProject, setProjectHeader } = get();
    
    if (!projectId) {
      throw new Error('No project selected');
    }

    try {
      await updateProject(projectId, {
        description: description.trim() || undefined,
      });

      // Update local store
      setProjectHeader({
        ...currentProject.projectHeader,
        description: description.trim() || undefined,
      });

      toast.success('Project description updated successfully!');

      // Refresh project list to sync with UserContext
      await get().fetchProjects();
    } catch (error) {
      console.error('Failed to update project description:', error);
      toast.error('Failed to update project description');
      throw error;
    }
  },

  // Update project header image
  updateProjectHeaderImage: async (file: File) => {
    const { projectId, currentProject, setProjectHeader } = get();
    
    if (!projectId) {
      throw new Error('No project selected');
    }

    try {
      toast.success('Uploading header image...');

      // Store the old header photo ID for cleanup
      const oldHeaderPhotoId = currentProject.projectHeader.headerPhotoId;

      // Upload the header image
      const uploadedAsset = await uploadAsset(file, projectId);

      // Update project with new header photo ID
      await updateProject(projectId, {
        headerPhotoId: uploadedAsset.id,
      });

      // Update local store
      setProjectHeader({
        ...currentProject.projectHeader,
        headerPhotoId: uploadedAsset.id,
      });

      // Clean up the old header photo if it exists
      if (oldHeaderPhotoId) {
        try {
          await deleteAsset(oldHeaderPhotoId);
        } catch (cleanupError) {
          console.error('Failed to delete old header photo:', cleanupError);
          // Don't fail the upload if cleanup fails
        }
      }

      toast.success('Header image updated successfully!');

      // Refresh project list to sync with UserContext
      await get().fetchProjects();
    } catch (error) {
      console.error('Failed to upload header image:', error);
      toast.error('Failed to upload header image');
      throw error;
    }
  },

  ///////////////// LOADING ITEMS /////////////////

  // Add asset to cache
  addAssetToCache: (assetId: string, asset: any) => {
    set(state => ({
      assetCache: {
        ...state.assetCache,
        [assetId]: asset
      }
    }));
  },

  // Clear the asset cache
  clearAssetCache: () => {
    set({ assetCache: {} });
  },

  getAssetFromCacheOrBackend: async (assetId) => {

    if (assetId) {
      const { assetCache } = get()
      let asset = assetCache[assetId] || null;
               
      // Load the asset
      if (!asset) {

        // If not in cache, fetch from API
        asset = await getAssetById(assetId);
        
        if (asset) {
          // Add to cache
          get().addAssetToCache(assetId, asset);
        }
      }

      return asset

    }

    return "";
  },

  // Loads the assets using their id that is found in the project map
  loadProjectAssets: async () => {
    const { currentProject } = get();
    const items = currentProject.items;
    
    // Set loading state
    get().setIsLoadingAssets(true);
    
    try {

      // Load in project Items
      for (const itemId in items) {
        const item = items[itemId];
        
        // Skip if item doesn't have props or no assetId
        if (!item.props || !item.props.assetId) {
          continue;
        }
        
        try {
          const assetId = item.props.assetId;
          let asset = await get().getAssetFromCacheOrBackend(assetId);
          
          if (asset) {
            get().setItemsWithoutHistory(draft => {
              if (item.type === 'image') {
                draft[itemId].props.originalImage = asset;
              } else {
                draft[itemId].props.assetUrl = asset;
              }
            });
          }
        } catch (error) {
          console.error(`Failed to load asset for item ${itemId}:`, error);
        }
      }

    } finally {
      // Clear loading state
      get().setIsLoadingAssets(false);
    }
  },

  // Fetch all projects for the user
  fetchProjects: async () => {
    try {
      set({ loadingProjects: true, projectsError: null });
      const projectData = await getProjects();
      set({ projects: projectData, loadingProjects: false });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      set({ projectsError: error, loadingProjects: false });
    }
  },

}))