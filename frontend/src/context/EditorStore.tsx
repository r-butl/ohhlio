import { create } from 'zustand'
import { produce, enablePatches, applyPatches, Patch } from 'immer'
import { getAssetById, uploadAsset, deleteAsset } from '../services/assetService'
import { updateProject, getProjects } from '../services/projectService'
import { toast } from 'sonner'

import {
  ItemProps,
  ProjectItems,
  ProjectHeader,
  ProjectProps,
  TextProps,
  ImageProps,
} from '@/interfaces/ProjectItemsInterfaces'

enablePatches()

type ViewState = 'PublicView' | 'OwnerEdit' | 'OwnerPreview'

// Searches sections for an item by id; returns the item or null.
function findItem(items: ProjectItems, id: string): ItemProps | null {
  for (const section of items.sections) {
    const found = section.items.find(i => i.id === id)
    if (found) return found
  }
  return null
}

type State = {
  currentProject: ProjectProps
  projectId: string | null

  viewState: ViewState
  activeEditor: string | null
  activeOptionsPanel: string | null
  fileUploadSelected: boolean
  isLoadingAssets: boolean
  buttonHovered: boolean

  history: {
    past: { patches: Patch[]; inversePatches: Patch[] }[]
    future: { patches: Patch[]; inversePatches: Patch[] }[]
  }

  // History
  undo: () => void
  redo: () => void
  clearHistory: () => void

  // View state machine
  viewerChanged: (isOwner: boolean) => void
  togglePreview: () => void
  enterEdit: () => void
  exitEdit: () => void
  setActiveEditor: (id: string | null) => void
  setActiveOptionsPanel: (id: string | null) => void
  setFileUploadSelected: (state: boolean) => void
  setProjectId: (id: string | null) => void
  setProjectHeader: (header: ProjectHeader) => void
  setButtonHoveredState: (state: boolean) => void

  // Items mutation (goes through history or not)
  setItemsWithHistory: (fn: (draft: ProjectItems) => void) => void
  setItemsWithoutHistory: (fn: (draft: ProjectItems) => void) => void

  // Item CRUD
  addTextBox: (sectionId?: string) => void
  addImage: (image: string, sectionId?: string) => void
  deleteItem: (id: string) => void
  updateItemColSpan: (id: string, colSpan: number) => void

  // Sorting / moving
  reorderItemWithinSection: (sectionId: string, fromIndex: number, toIndex: number) => void
  moveItem: (itemId: string, toSectionId: string, toIndex: number) => void
  reorderSections: (fromIndex: number, toIndex: number) => void

  // Section CRUD
  addSection: () => void
  deleteSection: (sectionId: string) => void
  updateSectionTitle: (sectionId: string, title: string) => void

  // Asset loading
  assetCache: Record<string, unknown>
  addAssetToCache: (assetId: string, asset: unknown) => void
  clearAssetCache: () => void
  getAssetFromCacheOrBackend: (assetId: string) => Promise<unknown>
  loadProjectAssets: () => Promise<void>
  setIsLoadingAssets: (loading: boolean) => void

  // Project management
  updateProjectDescription: (description: string) => Promise<void>
  updateProjectHeaderImage: (file: File) => Promise<void>

  // Project list
  projects: unknown[]
  loadingProjects: boolean
  projectsError: unknown
  fetchProjects: () => Promise<void>
}

export const useEditorStore = create<State>((set, get) => ({

  // UI state
  activeEditor: null,
  viewState: (() => {
    try {
      const saved = localStorage.getItem('viewState') as ViewState | null
      if (saved === 'OwnerEdit' || saved === 'OwnerPreview') return saved
    } catch {}
    return 'PublicView'
  })(),
  buttonHovered: false,
  activeOptionsPanel: null,
  fileUploadSelected: false,
  isLoadingAssets: false,

  assetCache: {},
  history: { past: [], future: [] },

  projectId: null,
  currentProject: {
    projectHeader: {},
    items: { sections: [] },
  },
  projects: [],
  loadingProjects: false,
  projectsError: null,

  ///////////////// INTERACTION STATE /////////////////

  setFileUploadSelected: (state) => set({ fileUploadSelected: state }),
  setButtonHoveredState: (state) => set({ buttonHovered: state }),
  setProjectId: (id) => set({ projectId: id }),
  setActiveOptionsPanel: (id) => set({ activeOptionsPanel: id }),
  setIsLoadingAssets: (loading) => set({ isLoadingAssets: loading }),

  ///////////////// VIEW STATE MACHINE /////////////////

  viewerChanged: (isOwner) => {
    const current = get()
    const nextView: ViewState = isOwner
      ? (current.viewState === 'OwnerEdit' ? 'OwnerEdit' : 'OwnerPreview')
      : 'PublicView'
    set({ viewState: nextView })
    try { localStorage.setItem('viewState', nextView) } catch {}
  },
  togglePreview: () => {
    const { viewState } = get()
    if (viewState === 'PublicView') return
    const next: ViewState = viewState === 'OwnerEdit' ? 'OwnerPreview' : 'OwnerEdit'
    set({ viewState: next })
    try { localStorage.setItem('viewState', next) } catch {}
  },
  enterEdit: () => {
    const { viewState } = get()
    if (viewState === 'PublicView') return
    set({ viewState: 'OwnerEdit' })
    try { localStorage.setItem('viewState', 'OwnerEdit') } catch {}
  },
  exitEdit: () => {
    const { viewState } = get()
    const next: ViewState = viewState !== 'PublicView' ? 'OwnerPreview' : 'PublicView'
    set({ viewState: next })
    try { localStorage.setItem('viewState', next) } catch {}
  },

  setActiveEditor: (id) => {
    const { currentProject, setItemsWithoutHistory } = get()
    if (id) {
      const item = findItem(currentProject.items, id)
      if (item) {
        setItemsWithoutHistory(draft => {
          const target = findItem(draft, id)
          if (target) target.props._backup = { ...target.props } as typeof target.props
        })
      }
    }
    set({ activeEditor: id })
  },

  setProjectHeader: (header) => {
    set(state => ({
      currentProject: { ...state.currentProject, projectHeader: header },
    }))
  },

  ///////////////// HISTORY /////////////////

  setItemsWithHistory: (fn) => {
    const { currentProject, history } = get()
    let patches: Patch[] = []
    let inversePatches: Patch[] = []
    const nextItems = produce(
      currentProject.items,
      fn,
      (p, ip) => { patches = p; inversePatches = ip }
    )
    if (patches.length > 0) {
      const newPast = [...history.past, { patches, inversePatches }]
      set(state => ({
        currentProject: { ...state.currentProject, items: nextItems },
        history: {
          past: newPast.length > 20 ? newPast.slice(-20) : newPast,
          future: [],
        },
      }))
    }
  },

  setItemsWithoutHistory: (fn) => {
    const { currentProject } = get()
    const nextItems = produce(currentProject.items, fn)
    set(state => ({
      currentProject: { ...state.currentProject, items: nextItems },
    }))
  },

  undo: () => {
    const { history, currentProject } = get()
    if (history.past.length === 0) return
    const lastAction = history.past[history.past.length - 1]
    set(state => ({
      currentProject: {
        ...state.currentProject,
        items: applyPatches(currentProject.items, lastAction.inversePatches),
      },
      history: {
        past: history.past.slice(0, -1),
        future: [lastAction, ...history.future],
      },
    }))
  },

  redo: () => {
    const { history, currentProject } = get()
    if (history.future.length === 0) return
    const actionToRedo = history.future[0]
    set(state => ({
      currentProject: {
        ...state.currentProject,
        items: applyPatches(currentProject.items, actionToRedo.patches),
      },
      history: {
        past: [...history.past, actionToRedo],
        future: history.future.slice(1),
      },
    }))
  },

  clearHistory: () => set({ history: { past: [], future: [] } }),

  ///////////////// EDITING ITEMS /////////////////

  addTextBox: (sectionId) => {
    const { currentProject } = get()
    const sections = currentProject.items.sections
    if (sections.length === 0) return

    const targetSection = sectionId
      ? sections.find(s => s.id === sectionId)
      : sections[sections.length - 1]
    if (!targetSection) return

    const id = crypto.randomUUID()
    const defaultProps: TextProps = {
      content: 'Select Options › Edit to add text.',
      fontSize: 16,
      fontFamily: 'Arial',
      textAlignVertical: 'center',
      textAlignHorizontal: 'left',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      maxChars: 1000,
      charCount: 0,
      textStyle: 'paragraph',
    }

    get().setItemsWithHistory(draft => {
      const section = draft.sections.find(s => s.id === targetSection.id)
      section?.items.push({ id, type: 'text', colSpan: 4, props: defaultProps })
    })
  },

  addImage: (image, sectionId) => {
    const { currentProject } = get()
    const sections = currentProject.items.sections
    if (sections.length === 0) return

    const targetSection = sectionId
      ? sections.find(s => s.id === sectionId)
      : sections[sections.length - 1]
    if (!targetSection) return

    const id = crypto.randomUUID()
    const defaultProps: ImageProps = {
      assetId: null,
      originalImage: image,
      zoom: 1,
      aspectRatio: 4 / 3,
      isUploading: false,
    }

    get().setItemsWithHistory(draft => {
      const section = draft.sections.find(s => s.id === targetSection.id)
      section?.items.push({ id, type: 'image', colSpan: 2, props: defaultProps })
    })
  },

  deleteItem: (id) => {
    get().setItemsWithHistory(draft => {
      for (const section of draft.sections) {
        const idx = section.items.findIndex(i => i.id === id)
        if (idx !== -1) { section.items.splice(idx, 1); break }
      }
    })
  },

  updateItemColSpan: (id, colSpan) => {
    get().setItemsWithHistory(draft => {
      const item = findItem(draft, id)
      if (item) item.colSpan = Math.min(4, Math.max(1, colSpan))
    })
  },

  reorderItemWithinSection: (sectionId, fromIndex, toIndex) => {
    get().setItemsWithHistory(draft => {
      const section = draft.sections.find(s => s.id === sectionId)
      if (!section) return
      if (fromIndex < 0 || fromIndex >= section.items.length) return
      const [item] = section.items.splice(fromIndex, 1)
      section.items.splice(toIndex, 0, item)
    })
  },

  moveItem: (itemId, toSectionId, toIndex) => {
    get().setItemsWithHistory(draft => {
      let moved: ItemProps | undefined
      let sourceSection: typeof draft.sections[number] | undefined
      let sourceIdx = -1
      for (const section of draft.sections) {
        const idx = section.items.findIndex(i => i.id === itemId)
        if (idx !== -1) {
          sourceSection = section
          sourceIdx = idx
          moved = section.items.splice(idx, 1)[0]
          break
        }
      }
      if (!moved) return
      const target = draft.sections.find(s => s.id === toSectionId)
      if (!target) {
        // Target section vanished — put item back where it came from
        sourceSection?.items.splice(sourceIdx, 0, moved)
        return
      }
      target.items.splice(toIndex, 0, moved)
    })
  },

  reorderSections: (fromIndex, toIndex) => {
    get().setItemsWithHistory(draft => {
      if (fromIndex < 0 || fromIndex >= draft.sections.length) return
      const [section] = draft.sections.splice(fromIndex, 1)
      draft.sections.splice(toIndex, 0, section)
    })
  },

  addSection: () => {
    get().setItemsWithHistory(draft => {
      draft.sections.push({ id: crypto.randomUUID(), title: 'New Section', items: [] })
    })
  },

  deleteSection: (sectionId) => {
    get().setItemsWithHistory(draft => {
      const idx = draft.sections.findIndex(s => s.id === sectionId)
      if (idx !== -1) draft.sections.splice(idx, 1)
    })
  },

  updateSectionTitle: (sectionId, title) => {
    get().setItemsWithoutHistory(draft => {
      const section = draft.sections.find(s => s.id === sectionId)
      if (section) section.title = title
    })
  },

  ///////////////// LOADING ITEMS /////////////////

  addAssetToCache: (assetId, asset) => {
    set(state => ({ assetCache: { ...state.assetCache, [assetId]: asset } }))
  },

  clearAssetCache: () => set({ assetCache: {} }),

  getAssetFromCacheOrBackend: async (assetId) => {
    if (!assetId) return ''
    const { assetCache } = get()
    let asset = assetCache[assetId] || null
    if (!asset) {
      asset = await getAssetById(assetId)
      if (asset) get().addAssetToCache(assetId, asset)
    }
    return asset
  },

  loadProjectAssets: async () => {
    const { currentProject } = get()
    get().setIsLoadingAssets(true)
    try {
      for (const section of currentProject.items.sections) {
        for (const item of section.items) {
          if (item.type !== 'image' || !item.props.assetId) continue
          try {
            const asset = await get().getAssetFromCacheOrBackend(item.props.assetId)
            if (asset) {
              get().setItemsWithoutHistory(draft => {
                for (const s of draft.sections) {
                  const target = s.items.find(i => i.id === item.id)
                  if (target && target.type === 'image') {
                    target.props.originalImage = asset as string
                    break
                  }
                }
              })
            }
          } catch (err) {
            console.error(`Failed to load asset for item ${item.id}:`, err)
          }
        }
      }
    } finally {
      get().setIsLoadingAssets(false)
    }
  },

  ///////////////// PROJECT MANAGEMENT /////////////////

  updateProjectDescription: async (description) => {
    const { projectId, currentProject, setProjectHeader } = get()
    if (!projectId) throw new Error('No project selected')
    try {
      await updateProject(projectId, { description: description.trim() || undefined })
      setProjectHeader({ ...currentProject.projectHeader, description: description.trim() || undefined })
      toast.success('Project description updated successfully!')
      await get().fetchProjects()
    } catch (error) {
      console.error('Failed to update project description:', error)
      toast.error('Failed to update project description')
      throw error
    }
  },

  updateProjectHeaderImage: async (file) => {
    const { projectId, currentProject, setProjectHeader } = get()
    if (!projectId) throw new Error('No project selected')
    try {
      toast.success('Uploading header image...')
      const oldHeaderPhotoId = currentProject.projectHeader.headerPhotoId
      const uploadedAsset = await uploadAsset(file, projectId)
      await updateProject(projectId, { headerPhotoId: uploadedAsset.id })
      setProjectHeader({ ...currentProject.projectHeader, headerPhotoId: uploadedAsset.id })
      if (oldHeaderPhotoId) {
        try { await deleteAsset(oldHeaderPhotoId) } catch {}
      }
      toast.success('Header image updated successfully!')
      await get().fetchProjects()
    } catch (error) {
      console.error('Failed to upload header image:', error)
      toast.error('Failed to upload header image')
      throw error
    }
  },

  fetchProjects: async () => {
    try {
      set({ loadingProjects: true, projectsError: null })
      const projectData = await getProjects()
      set({ projects: projectData, loadingProjects: false })
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      set({ projectsError: error, loadingProjects: false })
    }
  },
}))
