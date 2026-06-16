# Sectioned Bento Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace react-grid-layout with a CSS Grid + dnd-kit bento layout that organises project items into ordered sections, eliminates all aspect-ratio math, and provides a clean data model for future LLM layout suggestions.

**Architecture:** `ProjectItems` changes from a flat `Record<string, ItemProps>` to `{ sections: Section[] }`. Each `Section` is a CSS Grid (4 equal columns); items carry only a `colSpan` (1–4) — no x/y/h. Image aspect ratio is handled by the CSS `aspect-ratio` property, so there is zero JS height math. dnd-kit sorts items within/between sections and reorders sections; a pointer-event `ResizeHandle` snaps `colSpan` to column boundaries on drag. Legacy projects are migrated on load by `migrateLegacyItems`.

**Tech Stack:** React 19, TypeScript, Zustand/Immer (`EditorStore`), `@dnd-kit/core ^6`, `@dnd-kit/sortable ^10`, Tailwind CSS, Vitest

---

## File Map

**New files**
- `frontend/src/lib/migrateLegacyItems.ts` — converts old flat dict to `ProjectItems`
- `frontend/src/lib/migrateLegacyItems.test.ts` — Vitest tests (TDD)
- `frontend/src/components/creator-dashboard/grid/SortableSection.tsx` — section header + CSS Grid + dnd-kit `SortableContext` for its items
- `frontend/src/components/creator-dashboard/grid/SortableGridItem.tsx` — dnd-kit `useSortable` wrapper around `GridItem`
- `frontend/src/components/creator-dashboard/grid/ResizeHandle.tsx` — right-edge pointer-event handle that commits a new `colSpan`
- `frontend/src/components/creator-dashboard/grid/BentoGrid.css` — mobile media query (all items → full width)

**Modified files**
- `frontend/src/interfaces/ProjectItemsInterfaces.tsx` — add `Section`, `ProjectItems`; update `ProjectProps.items`; remove `ItemLayoutProps`
- `frontend/src/context/EditorStore.tsx` — new state shape, updated/new mutators, remove RGL-specific fields
- `frontend/src/pages/private-views/CreatorDashboard.tsx` — call migration on load; update `hasNoItems` check
- `frontend/src/components/creator-dashboard/grid/EditorGrid.tsx` — full rewrite: `DndContext`, section list, Add Section button
- `frontend/src/components/creator-dashboard/grid/grid-item/GridItem.tsx` — apply `colSpan` via inline style; update item lookup to search sections
- `frontend/src/components/creator-dashboard/grid/options-panel/ToolbarOverlay.tsx` — update item lookup; add colSpan toolbar buttons
- `frontend/src/components/buttons/AddContentItem.tsx` — wire the existing "Add Section" menu item

**Deleted files**
- `frontend/src/lib/gridUnits.ts`
- `frontend/src/lib/gridUnits.test.ts`

---

## Task 1: Update interfaces

**Files:**
- Modify: `frontend/src/interfaces/ProjectItemsInterfaces.tsx`

- [ ] **Step 1: Replace the file contents**

Replace the entire file with:

```ts
export interface TextProps {
  content: string;
  fontFamily: string;
  fontSize: number;
  textAlignVertical: 'top' | 'center' | 'bottom';
  textAlignHorizontal: 'left' | 'center' | 'right';
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  maxChars: number;
  charCount: number;
  textStyle?: 'heading' | 'paragraph';
  _backup?: TextProps;
}

export interface ImageProps {
  assetId: string | null;
  originalImage: string | null;
  aspectRatio: number;
  zoom: number;
  isUploading?: boolean;
  isUploaded?: boolean;
  _backup?: ImageProps;
}

export interface TextItem {
  id: string;
  type: 'text';
  colSpan: number;  // 1–4
  props: TextProps;
}

export interface ImageItem {
  id: string;
  type: 'image';
  colSpan: number;  // 1–4
  props: ImageProps;
}

export type ItemProps = TextItem | ImageItem;

export interface Section {
  id: string;
  title: string;
  items: ItemProps[];
}

export interface ProjectItems {
  sections: Section[];
}

export interface ProjectHeader {
  title?: string;
  description?: string;
  headerPhotoId?: string;
}

export interface ProjectProps {
  projectHeader: ProjectHeader;
  items: ProjectItems;
}
```

- [ ] **Step 2: Verify TypeScript compiles (expect many errors — that's expected at this stage)**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -40`
Expected: errors from EditorStore and components that still use the old types — confirming the cascade to fix in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/interfaces/ProjectItemsInterfaces.tsx
git commit -m "refactor: update ProjectItems interfaces for section-based bento grid"
```

---

## Task 2: Migration utility (TDD)

**Files:**
- Create: `frontend/src/lib/migrateLegacyItems.ts`
- Create: `frontend/src/lib/migrateLegacyItems.test.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/lib/migrateLegacyItems.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { migrateLegacyItems } from './migrateLegacyItems';

describe('migrateLegacyItems', () => {
  it('returns input unchanged when already in new format', () => {
    const input = {
      sections: [
        {
          id: 's1',
          title: 'Work',
          items: [{ id: 'i1', type: 'text', colSpan: 2, props: {} }],
        },
      ],
    };
    const result = migrateLegacyItems(input);
    expect(result).toEqual(input);
    expect(result.sections).toHaveLength(1);
  });

  it('converts a legacy flat dict to a single section', () => {
    const legacy = {
      abc: {
        id: 'abc',
        type: 'text',
        layout: { x: 0, y: 0, w: 4, h: 10, i: 'abc' },
        props: { content: 'Hello' },
      },
      xyz: {
        id: 'xyz',
        type: 'image',
        layout: { x: 0, y: 10, w: 2, h: 45, i: 'xyz' },
        props: { assetId: null, originalImage: null, aspectRatio: 1.333, zoom: 1 },
      },
    };
    const result = migrateLegacyItems(legacy);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].title).toBe('My Work');
    expect(result.sections[0].items).toHaveLength(2);

    const text = result.sections[0].items.find(i => i.id === 'abc');
    expect(text?.colSpan).toBe(4);

    const image = result.sections[0].items.find(i => i.id === 'xyz');
    expect(image?.colSpan).toBe(2);
  });

  it('clamps legacy w values to 1–4', () => {
    const legacy = {
      a: { id: 'a', type: 'text', layout: { x: 0, y: 0, w: 99, h: 10, i: 'a' }, props: {} },
      b: { id: 'b', type: 'text', layout: { x: 0, y: 10, w: 0, h: 10, i: 'b' }, props: {} },
    };
    const result = migrateLegacyItems(legacy);
    const items = result.sections[0].items;
    expect(items.find(i => i.id === 'a')?.colSpan).toBe(4);
    expect(items.find(i => i.id === 'b')?.colSpan).toBe(1);
  });

  it('returns an empty section list for null/undefined input', () => {
    expect(migrateLegacyItems(null).sections).toHaveLength(0);
    expect(migrateLegacyItems(undefined).sections).toHaveLength(0);
  });

  it('returns an empty section list for an empty legacy dict', () => {
    const result = migrateLegacyItems({});
    expect(result.sections).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `cd frontend && npx vitest run src/lib/migrateLegacyItems.test.ts`
Expected: FAIL — `migrateLegacyItems` not found.

- [ ] **Step 3: Implement the migration utility**

Create `frontend/src/lib/migrateLegacyItems.ts`:

```ts
import type { ProjectItems, ItemProps } from '@/interfaces/ProjectItemsInterfaces';

interface LegacyItem {
  id: string;
  type: string;
  layout: { w: number; y: number; [key: string]: unknown };
  props: Record<string, unknown>;
}

export function migrateLegacyItems(raw: unknown): ProjectItems {
  if (raw == null) return { sections: [] };

  const obj = raw as Record<string, unknown>;

  // Already in new format
  if (Array.isArray(obj.sections)) {
    return raw as ProjectItems;
  }

  // Empty dict
  const entries = Object.values(obj) as LegacyItem[];
  if (entries.length === 0) return { sections: [] };

  // Sort by y position to preserve visual order
  const sorted = [...entries].sort((a, b) => (a.layout?.y ?? 0) - (b.layout?.y ?? 0));

  const items: ItemProps[] = sorted.map(item => ({
    id: item.id,
    type: item.type as 'text' | 'image',
    colSpan: Math.min(4, Math.max(1, item.layout?.w ?? 2)),
    props: item.props as ItemProps['props'],
  }));

  return {
    sections: [
      {
        id: String(Date.now()),
        title: 'My Work',
        items,
      },
    ],
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd frontend && npx vitest run src/lib/migrateLegacyItems.test.ts`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/migrateLegacyItems.ts frontend/src/lib/migrateLegacyItems.test.ts
git commit -m "feat: add migrateLegacyItems utility to convert flat dict to section format"
```

---

## Task 3: Update EditorStore

**Files:**
- Modify: `frontend/src/context/EditorStore.tsx`

The store's `currentProject.items` changes from `Record<string, ItemProps>` to `ProjectItems`. All item-level mutations navigate `sections[].items[]` instead of `dict[id]`. Three RGL-specific state fields are removed (`gridRowHeight`, `gridColumnCount`, `editorMaxWidth`). New section CRUD actions and `updateItemColSpan` are added.

- [ ] **Step 1: Replace EditorStore.tsx**

Replace the entire file with:

```ts
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

    const id = String(Date.now())
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

    const id = String(Date.now())
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
      const [item] = section.items.splice(fromIndex, 1)
      section.items.splice(toIndex, 0, item)
    })
  },

  moveItem: (itemId, toSectionId, toIndex) => {
    get().setItemsWithHistory(draft => {
      let moved: ItemProps | undefined
      for (const section of draft.sections) {
        const idx = section.items.findIndex(i => i.id === itemId)
        if (idx !== -1) { moved = section.items.splice(idx, 1)[0]; break }
      }
      if (!moved) return
      const target = draft.sections.find(s => s.id === toSectionId)
      target?.items.splice(toIndex, 0, moved)
    })
  },

  reorderSections: (fromIndex, toIndex) => {
    get().setItemsWithHistory(draft => {
      const [section] = draft.sections.splice(fromIndex, 1)
      draft.sections.splice(toIndex, 0, section)
    })
  },

  addSection: () => {
    get().setItemsWithHistory(draft => {
      draft.sections.push({ id: String(Date.now()), title: 'New Section', items: [] })
    })
  },

  deleteSection: (sectionId) => {
    get().setItemsWithHistory(draft => {
      const idx = draft.sections.findIndex(s => s.id === sectionId)
      if (idx !== -1) draft.sections.splice(idx, 1)
    })
  },

  updateSectionTitle: (sectionId, title) => {
    get().setItemsWithHistory(draft => {
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
```

- [ ] **Step 2: Verify TypeScript compiles (errors should now be limited to components not yet updated)**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -60`
Expected: Errors only in `EditorGrid.tsx`, `GridItem.tsx`, `ToolbarOverlay.tsx`, `CreatorDashboard.tsx`, `AddContentItem.tsx` — not in `EditorStore.tsx` itself.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/EditorStore.tsx
git commit -m "refactor: update EditorStore for section-based ProjectItems"
```

---

## Task 4: Update CreatorDashboard

**Files:**
- Modify: `frontend/src/pages/private-views/CreatorDashboard.tsx:16,27,51`

- [ ] **Step 1: Update the three load-related lines**

At the top of the file add the import after line 9 (after the existing imports):

```ts
import { migrateLegacyItems } from '@/lib/migrateLegacyItems';
```

Replace line 27 (`hasNoItems` selector):

```ts
  const hasNoItems = useEditorStore(
    state =>
      state.currentProject.items.sections.length === 0 ||
      state.currentProject.items.sections.every(s => s.items.length === 0)
  );
```

Replace line 51 (`setItemsWithoutHistory` call inside the `load` function):

```ts
          setItemsWithoutHistory(draft => {
            const migrated = migrateLegacyItems(project.items)
            draft.sections = migrated.sections
          });
```

- [ ] **Step 2: Verify TypeScript compiles for this file**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep "CreatorDashboard"`
Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/private-views/CreatorDashboard.tsx
git commit -m "feat: migrate legacy project items to section format on load"
```

---

## Task 5: ResizeHandle component

**Files:**
- Create: `frontend/src/components/creator-dashboard/grid/ResizeHandle.tsx`

The handle lives on the right edge of an item. On drag it computes `colSpan` from the item's own current pixel width (so no ref to the parent grid is needed) and commits on `mouseup`.

- [ ] **Step 1: Create the component**

Create `frontend/src/components/creator-dashboard/grid/ResizeHandle.tsx`:

```tsx
import React from 'react';
import { useEditorStore } from '@/context/EditorStore';

interface ResizeHandleProps {
  itemId: string;
  currentColSpan: number;
  itemRef: React.RefObject<HTMLDivElement>;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ itemId, currentColSpan, itemRef }) => {
  const updateItemColSpan = useEditorStore(state => state.updateItemColSpan);
  const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startSpan = currentColSpan;
    setButtonHoveredState(true);

    const onMouseUp = (ev: MouseEvent) => {
      if (itemRef.current) {
        // Approximate one column width from the item's current rendered width
        const colWidth = itemRef.current.offsetWidth / currentColSpan;
        const delta = ev.clientX - startX;
        const newSpan = Math.min(4, Math.max(1, Math.round(startSpan + delta / colWidth)));
        updateItemColSpan(itemId, newSpan);
      }
      setButtonHoveredState(false);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '8px',
        height: '40px',
        cursor: 'ew-resize',
        background: 'rgba(0,0,0,0.15)',
        borderRadius: '4px',
        zIndex: 10,
      }}
      aria-label="Resize item"
    />
  );
};

export default ResizeHandle;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/ResizeHandle.tsx
git commit -m "feat: add ResizeHandle for colSpan drag-resize"
```

---

## Task 6: SortableGridItem component

**Files:**
- Create: `frontend/src/components/creator-dashboard/grid/SortableGridItem.tsx`

Wraps `GridItem` with dnd-kit's `useSortable`. Applies `colSpan` via inline style on the outer div. Shows `ResizeHandle` in edit mode.

- [ ] **Step 1: Create the component**

Create `frontend/src/components/creator-dashboard/grid/SortableGridItem.tsx`:

```tsx
import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GridItem from './grid-item/GridItem';
import ResizeHandle from './ResizeHandle';
import TextEditor from './text-editor/TextEditor';
import ImageEditor from './image-editor/ImageEditor';
import { useEditorStore } from '@/context/EditorStore';
import type { ItemProps } from '@/interfaces/ProjectItemsInterfaces';

interface SortableGridItemProps {
  item: ItemProps;
  sectionId: string;
}

const SortableGridItem: React.FC<SortableGridItemProps> = ({ item, sectionId }) => {
  const viewState = useEditorStore(state => state.viewState);
  const isOwnerEdit = viewState === 'OwnerEdit';
  const loadingAssets = useEditorStore(state => state.isLoadingAssets);
  const buttonHovered = useEditorStore(state => state.buttonHovered);
  const itemRef = useRef<HTMLDivElement>(null!);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: 'item', sectionId },
    disabled: !isOwnerEdit || loadingAssets || buttonHovered,
  });

  const style: React.CSSProperties = {
    gridColumn: `span ${item.colSpan}`,
    // CSS aspect-ratio keeps image cells proportional without any JS height math.
    // Text items have no aspect-ratio so they grow with their content.
    ...(item.type === 'image' ? { aspectRatio: String(item.props.aspectRatio) } : {}),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    touchAction: 'none',
  };

  return (
    <div ref={el => { setNodeRef(el); (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }} style={style} {...attributes} {...listeners}>
      <GridItem id={item.id}>
        {item.type === 'text' ? (
          <TextEditor id={item.id} {...item.props} />
        ) : (
          <ImageEditor id={item.id} {...item.props} />
        )}
      </GridItem>
      {isOwnerEdit && !loadingAssets && (
        <ResizeHandle itemId={item.id} currentColSpan={item.colSpan} itemRef={itemRef} />
      )}
    </div>
  );
};

export default SortableGridItem;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/SortableGridItem.tsx
git commit -m "feat: add SortableGridItem with dnd-kit sortable and resize handle"
```

---

## Task 7: SortableSection component

**Files:**
- Create: `frontend/src/components/creator-dashboard/grid/SortableSection.tsx`
- Create: `frontend/src/components/creator-dashboard/grid/BentoGrid.css`

Each section uses `useSortable` (for section-level drag) and contains a `SortableContext` for its items in a CSS Grid.

- [ ] **Step 1: Create BentoGrid.css**

Create `frontend/src/components/creator-dashboard/grid/BentoGrid.css`:

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

@media (max-width: 640px) {
  .bento-grid > * {
    grid-column: 1 / -1 !important;
  }
}
```

- [ ] **Step 2: Create SortableSection.tsx**

Create `frontend/src/components/creator-dashboard/grid/SortableSection.tsx`:

```tsx
import React, { useState } from 'react';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { useEditorStore } from '@/context/EditorStore';
import SortableGridItem from './SortableGridItem';
import type { Section } from '@/interfaces/ProjectItemsInterfaces';
import './BentoGrid.css';

interface SortableSectionProps {
  section: Section;
}

const SortableSection: React.FC<SortableSectionProps> = ({ section }) => {
  const viewState = useEditorStore(state => state.viewState);
  const isOwnerEdit = viewState === 'OwnerEdit';
  const deleteSection = useEditorStore(state => state.deleteSection);
  const updateSectionTitle = useEditorStore(state => state.updateSectionTitle);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: { type: 'section' },
    disabled: !isOwnerEdit,
  });

  const sectionStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginBottom: '24px',
  };

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== section.title) {
      updateSectionTitle(section.id, titleDraft.trim());
    } else {
      setTitleDraft(section.title);
    }
  };

  const handleDelete = () => {
    if (section.items.length === 0 || window.confirm(`Delete "${section.title}" and all its items?`)) {
      deleteSection(section.id);
    }
  };

  return (
    <div ref={setNodeRef} style={sectionStyle}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {isOwnerEdit && (
          <button
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: '#999', background: 'none', border: 'none', padding: 0 }}
            aria-label="Drag section"
          >
            <GripVertical size={16} />
          </button>
        )}

        {editingTitle && isOwnerEdit ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleDraft(section.title); setEditingTitle(false); } }}
            style={{ fontSize: '1.1rem', fontWeight: 600, border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px' }}
          />
        ) : (
          <h2
            style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, cursor: isOwnerEdit ? 'text' : 'default' }}
            onClick={() => isOwnerEdit && setEditingTitle(true)}
          >
            {section.title}
          </h2>
        )}

        {isOwnerEdit && (
          <button
            onClick={handleDelete}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
            aria-label="Delete section"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Item grid */}
      <SortableContext items={section.items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="bento-grid">
          {section.items.map(item => (
            <SortableGridItem key={item.id} item={item} sectionId={section.id} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default SortableSection;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/SortableSection.tsx frontend/src/components/creator-dashboard/grid/BentoGrid.css
git commit -m "feat: add SortableSection with CSS Grid, editable title, and section drag"
```

---

## Task 8: EditorGrid rewrite

**Files:**
- Modify: `frontend/src/components/creator-dashboard/grid/EditorGrid.tsx`

Replace the entire file with a simple `DndContext` that dispatches section- or item-level moves.

- [ ] **Step 1: Replace EditorGrid.tsx**

Replace the entire contents of `frontend/src/components/creator-dashboard/grid/EditorGrid.tsx` with:

```tsx
import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import SortableSection from './SortableSection';
import ToolbarOverlay from './options-panel/ToolbarOverlay';
import { useEditorStore } from '../../../context/EditorStore';

const EditorGrid: React.FC = () => {
  const items = useEditorStore(state => state.currentProject.items);
  const viewState = useEditorStore(state => state.viewState);
  const isOwnerEdit = viewState === 'OwnerEdit';

  const reorderItemWithinSection = useEditorStore(state => state.reorderItemWithinSection);
  const moveItem = useEditorStore(state => state.moveItem);
  const reorderSections = useEditorStore(state => state.reorderSections);
  const addSection = useEditorStore(state => state.addSection);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as { type: string; sectionId?: string } | undefined;
    const overData = over.data.current as { type: string; sectionId?: string } | undefined;

    if (activeData?.type === 'section') {
      const fromIdx = items.sections.findIndex(s => s.id === active.id);
      const toIdx = items.sections.findIndex(s => s.id === over.id);
      if (fromIdx !== -1 && toIdx !== -1) reorderSections(fromIdx, toIdx);
      return;
    }

    if (activeData?.type === 'item') {
      const activeSectionId = activeData.sectionId!;
      // over could be an item (with sectionId) or a section droppable
      const overSectionId = overData?.sectionId ?? String(over.id);

      if (activeSectionId === overSectionId) {
        const section = items.sections.find(s => s.id === activeSectionId);
        if (!section) return;
        const fromIdx = section.items.findIndex(i => i.id === active.id);
        const toIdx = overData?.type === 'item'
          ? section.items.findIndex(i => i.id === over.id)
          : section.items.length - 1;
        if (fromIdx !== -1 && toIdx !== -1) reorderItemWithinSection(activeSectionId, fromIdx, toIdx);
      } else {
        const targetSection = items.sections.find(s => s.id === overSectionId);
        if (!targetSection) return;
        const toIdx = overData?.type === 'item'
          ? targetSection.items.findIndex(i => i.id === over.id)
          : targetSection.items.length;
        moveItem(String(active.id), overSectionId, Math.max(0, toIdx));
      }
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.sections.map(section => (
            <SortableSection key={section.id} section={section} />
          ))}
        </SortableContext>
      </DndContext>

      {isOwnerEdit && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            onClick={addSection}
            style={{
              padding: '8px 20px',
              border: '1px dashed #ccc',
              borderRadius: '8px',
              background: 'none',
              cursor: 'pointer',
              color: '#888',
              fontSize: '0.875rem',
            }}
          >
            + Add Section
          </button>
        </div>
      )}

      <footer>
        <div style={{ height: '200px' }} />
      </footer>

      <ToolbarOverlay />
    </div>
  );
};

export default EditorGrid;
```

- [ ] **Step 2: Verify TypeScript compiles for EditorGrid**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep "EditorGrid"`
Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/EditorGrid.tsx
git commit -m "feat: rewrite EditorGrid as DndContext with section list (replace RGL)"
```

---

## Task 9: Update GridItem

**Files:**
- Modify: `frontend/src/components/creator-dashboard/grid/grid-item/GridItem.tsx`

`GridItem` no longer needs to apply `colSpan` (that's on the wrapper in `SortableGridItem`). But it currently reads `state.currentProject.items[id]` — which no longer exists. Update the item lookup to search sections.

- [ ] **Step 1: Update the item selector**

In `GridItem.tsx`, replace line 42:

```ts
  const item = useEditorStore(state => state.currentProject.items[id]);
```

with:

```ts
  const item = useEditorStore(state => {
    for (const section of state.currentProject.items.sections) {
      const found = section.items.find(i => i.id === id);
      if (found) return found;
    }
    return null;
  });
```

- [ ] **Step 2: Verify TypeScript compiles for GridItem**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep "GridItem"`
Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/grid-item/GridItem.tsx
git commit -m "fix: update GridItem item lookup to search sections"
```

---

## Task 10: Fix remaining flat-dict item lookups

**Files:**
- Modify: `frontend/src/hooks/useContentCheck.ts`
- Modify: `frontend/src/components/creator-dashboard/grid/options-panel/TextToolbar.tsx`
- Modify: `frontend/src/components/creator-dashboard/grid/text-editor/TextEditor.tsx:188-194`
- Modify: `frontend/src/components/creator-dashboard/grid/image-editor/ImageEditor.tsx:23,67-76`
- Delete: `frontend/src/components/creator-dashboard/grid/options-panel/OptionsPanel.tsx` (unused dead code)

Five files still access `state.currentProject.items[id]` or `draft[id]` which no longer exist. Fix each in turn.

- [ ] **Step 1: Fix useContentCheck.ts**

Replace `frontend/src/hooks/useContentCheck.ts` with:

```ts
import { useMemo } from 'react';
import { useEditorStore } from '../context/EditorStore';

export const useContentCheck = (id: string) => {
  const item = useEditorStore(state => {
    for (const section of state.currentProject.items.sections) {
      const found = section.items.find(i => i.id === id);
      if (found) return found;
    }
    return null;
  });

  return useMemo(() => {
    if (!item) return false;
    if (item.type === 'image') return item.props.originalImage !== null;
    if (item.type === 'text') return item.props.content !== '';
    return false;
  }, [item]);
};
```

- [ ] **Step 2: Fix TextToolbar.tsx**

The toolbar had a "Width" section that manipulated `layout.w` — that's replaced by the colSpan buttons in `ToolbarOverlay` (Task 11). Remove the width section and update all `items[id]` / `draft[id]` references.

Replace `frontend/src/components/creator-dashboard/grid/options-panel/TextToolbar.tsx` with:

```tsx
import React, { useEffect } from 'react';
import './OptionsPanel.css';
import { useEditorStore } from '@/context/EditorStore';
import { TextProps } from '@/interfaces/ProjectItemsInterfaces';
import ConfirmButton from '@/components/buttons/Confirm';
import CancelButton from '@/components/buttons/Cancel';
import emitter from '@/global-state/EventBus';

const TextToolbar: React.FC<{ id: string }> = ({ id }) => {
  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);

  const item = useEditorStore(state => {
    for (const section of state.currentProject.items.sections) {
      const found = section.items.find(i => i.id === id);
      if (found) return found;
    }
    return null;
  });

  useEffect(() => {
    setActiveEditor(id);
  }, []);

  if (!item || item.type !== 'text') return null;

  const { textAlignHorizontal, textStyle = 'paragraph' } = item.props;

  const updateProps = (props: Partial<TextProps>) => {
    setItemsWithHistory(draft => {
      for (const section of draft.sections) {
        const target = section.items.find(i => i.id === id);
        if (target && target.type === 'text') {
          target.props = { ...target.props, ...props };
          break;
        }
      }
    });
  };

  const handleStyleChange = (style: 'heading' | 'paragraph') => {
    updateProps({ textStyle: style });
    if (style === 'heading') {
      emitter.emit('set:heading', { id, level: 2 });
    } else {
      emitter.emit('set:paragraph', { id });
    }
  };

  return (
    <>
      <div className="button-group">
        <label>Text Style</label>
        <div className="format-buttons">
          <button
            onClick={() => handleStyleChange('heading')}
            className={`format-button ${textStyle === 'heading' ? 'active' : ''}`}
            title="Heading"
          >
            H
          </button>
          <button
            onClick={() => handleStyleChange('paragraph')}
            className={`format-button ${textStyle === 'paragraph' ? 'active' : ''}`}
            title="Paragraph"
          >
            P
          </button>
        </div>
      </div>

      <div className="button-group">
        <label>Alignment</label>
        <div className="format-buttons">
          <button
            onClick={() => updateProps({ textAlignHorizontal: 'left' })}
            className={`format-button ${textAlignHorizontal === 'left' ? 'active' : ''}`}
            title="Align Left"
          >
            ⇤
          </button>
          <button
            onClick={() => updateProps({ textAlignHorizontal: 'center' })}
            className={`format-button ${textAlignHorizontal === 'center' ? 'active' : ''}`}
            title="Align Center"
          >
            ⇔
          </button>
          <button
            onClick={() => updateProps({ textAlignHorizontal: 'right' })}
            className={`format-button ${textAlignHorizontal === 'right' ? 'active' : ''}`}
            title="Align Right"
          >
            ⇥
          </button>
        </div>
      </div>

      <div className="toolbar-group">
        <ConfirmButton id={id} />
        <CancelButton />
      </div>
    </>
  );
};

export default TextToolbar;
```

- [ ] **Step 3: Fix TextEditor.tsx — setItemsWithHistory callback**

In `TextEditor.tsx`, locate the `handleConfirm` effect (around line 188). Replace the `setItemsWithHistory` call:

```ts
        setItemsWithHistory(draft => {
            const draftItem = draft[id];
            if (draftItem && draftItem.type === 'text') {
              draftItem.props.content = localContent;
            }
          }
        )
```

with:

```ts
        setItemsWithHistory(draft => {
          for (const section of draft.sections) {
            const target = section.items.find(i => i.id === id);
            if (target && target.type === 'text') {
              target.props.content = localContent;
              break;
            }
          }
        })
```

- [ ] **Step 4: Fix ImageEditor.tsx — item lookup and setItemsWithHistory callback**

In `ImageEditor.tsx`, replace line 23:

```ts
  const item = useEditorStore(state => state.currentProject.items[id]);
```

with:

```ts
  const item = useEditorStore(state => {
    for (const section of state.currentProject.items.sections) {
      const found = section.items.find(i => i.id === id);
      if (found) return found;
    }
    return null;
  });
```

In the same file, replace the `setItemsWithHistory` callback in `handleConfirm` (around line 67):

```ts
        setItemsWithHistory(draft => {
          const draftItem = draft[id];
          if (draftItem && draftItem.type === 'image') {
            draftItem.props = {
              ...draftItem.props,
              originalImage: localOriginalImage,
              zoom: localZoom
            };
          }
        });
```

with:

```ts
        setItemsWithHistory(draft => {
          for (const section of draft.sections) {
            const target = section.items.find(i => i.id === id);
            if (target && target.type === 'image') {
              target.props.originalImage = localOriginalImage;
              target.props.zoom = localZoom;
              break;
            }
          }
        });
```

- [ ] **Step 5: Delete OptionsPanel.tsx (unused dead code)**

Run: `rm frontend/src/components/creator-dashboard/grid/options-panel/OptionsPanel.tsx`

- [ ] **Step 6: Verify TypeScript compiles cleanly for all fixed files**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep -E "useContentCheck|TextToolbar|TextEditor|ImageEditor|OptionsPanel"`
Expected: no errors from any of these files.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/hooks/useContentCheck.ts
git add frontend/src/components/creator-dashboard/grid/options-panel/TextToolbar.tsx
git add frontend/src/components/creator-dashboard/grid/text-editor/TextEditor.tsx
git add frontend/src/components/creator-dashboard/grid/image-editor/ImageEditor.tsx
git rm frontend/src/components/creator-dashboard/grid/options-panel/OptionsPanel.tsx
git commit -m "fix: update all flat-dict item lookups to search sections"
```

---

## Task 11: Update ToolbarOverlay and add colSpan buttons

**Files:**
- Modify: `frontend/src/components/creator-dashboard/grid/options-panel/ToolbarOverlay.tsx`

`ToolbarOverlay` reads `items[activeEditor]` — update to search sections. Also add colSpan buttons (1–4) so users can change the width without dragging.

- [ ] **Step 1: Replace ToolbarOverlay.tsx**

Replace the entire file with:

```tsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/context/EditorStore';
import { OPTION_PAGES } from './OptionsPages';
import './OptionsPanel.css';

const ColSpanButtons: React.FC<{ id: string; currentColSpan: number }> = ({ id, currentColSpan }) => {
  const updateItemColSpan = useEditorStore(state => state.updateItemColSpan);
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.75rem', color: '#888', alignSelf: 'center', marginRight: '4px' }}>Width:</span>
      {[1, 2, 3, 4].map(span => (
        <button
          key={span}
          onClick={() => updateItemColSpan(id, span)}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: currentColSpan === span ? '#333' : '#ccc',
            background: currentColSpan === span ? '#333' : 'transparent',
            color: currentColSpan === span ? '#fff' : '#333',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: currentColSpan === span ? 600 : 400,
          }}
        >
          {span}
        </button>
      ))}
    </div>
  );
};

const ToolbarOverlay: React.FC = () => {
  const activeEditor = useEditorStore(state => state.activeEditor);
  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [positionReady, setPositionReady] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Find the active item by searching sections
  const item = useEditorStore(state => {
    if (!state.activeEditor) return null;
    for (const section of state.currentProject.items.sections) {
      const found = section.items.find(i => i.id === state.activeEditor);
      if (found) return found;
    }
    return null;
  });

  useEffect(() => {
    if (!activeEditor) {
      setPositionReady(false);
      return;
    }
    const gridItem = document.querySelector(`[data-item-id="${activeEditor}"]`);
    if (gridItem) {
      const rect = gridItem.getBoundingClientRect();
      setPosition({ top: rect.top + window.scrollY, left: rect.right + 10 });
      setPositionReady(true);
    }
  }, [activeEditor]);

  if (!activeEditor || !positionReady || !item) return null;

  const pages = OPTION_PAGES[item.type];
  if (!pages || pages.length === 0) return null;

  const ToolbarComponent = pages[0].component;

  return createPortal(
    <div
      ref={containerRef}
      className="rounded-xl shadow-xl border border-border bg-background min-w-[220px]"
      style={{ position: 'absolute', top: position.top, left: position.left, zIndex: 2000 }}
    >
      <div className="relative h-6">
        <button
          onClick={() => setActiveEditor(null)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="px-4 pb-4 flex flex-col gap-3">
        <ColSpanButtons id={activeEditor} currentColSpan={item.colSpan} />
        <ToolbarComponent id={activeEditor} />
      </div>
    </div>,
    document.getElementById('option-panel-root') || document.body
  );
};

export default ToolbarOverlay;
```

- [ ] **Step 2: Verify TypeScript compiles for ToolbarOverlay**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep "ToolbarOverlay"`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/options-panel/ToolbarOverlay.tsx
git commit -m "feat: update ToolbarOverlay with section-aware lookup and colSpan buttons"
```

---

## Task 12: Update AddContentItem

**Files:**
- Modify: `frontend/src/components/buttons/AddContentItem.tsx`

Wire the "Add Section" menu item (currently a no-op) to `addSection`. Add items to the last section when there is at least one.

- [ ] **Step 1: Update AddContentItem.tsx**

In `AddContentItem.tsx`, replace:

```ts
    const addTextBox = useEditorStore(state => state.addTextBox);
    const addImage = useEditorStore(state => state.addImage);
```

with:

```ts
    const addTextBox = useEditorStore(state => state.addTextBox);
    const addImage = useEditorStore(state => state.addImage);
    const addSection = useEditorStore(state => state.addSection);
    const sections = useEditorStore(state => state.currentProject.items.sections);
```

Replace the `onClick={() => addTextBox()}` line with:

```ts
              onClick={() => {
                if (sections.length === 0) addSection();
                addTextBox();
              }}
```

Replace the `onClick={handleAddImageClick}` call site (the Add Image item) with:

```ts
              onClick={() => {
                if (sections.length === 0) addSection();
                handleAddImageClick();
              }}
```

Replace the `onClick={() => {}}` on the "Add Section" item with:

```ts
              onClick={() => addSection()}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | grep "AddContentItem"`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/buttons/AddContentItem.tsx
git commit -m "feat: wire Add Section and auto-create section when adding first item"
```

---

## Task 13: Full TypeScript clean build

Before removing the old dependencies, ensure the entire app compiles.

- [ ] **Step 1: Run full type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors. If errors remain, fix them before proceeding.

- [ ] **Step 2: Run the migration utility tests**

Run: `cd frontend && npx vitest run src/lib/migrateLegacyItems.test.ts`
Expected: PASS — all 5 tests green.

- [ ] **Step 3: Commit any fixes**

```bash
git add -p
git commit -m "fix: resolve remaining TypeScript errors after bento grid migration"
```

---

## Task 14: Remove react-grid-layout

**Files:**
- Modify: `frontend/package.json`
- Delete: `frontend/src/lib/gridUnits.ts`
- Delete: `frontend/src/lib/gridUnits.test.ts`

- [ ] **Step 1: Remove npm packages**

Run: `cd frontend && npm uninstall react-grid-layout react-resizable @types/react-grid-layout`

- [ ] **Step 2: Delete the now-unused gridUnits files**

Run:
```bash
rm frontend/src/lib/gridUnits.ts
rm frontend/src/lib/gridUnits.test.ts
```

- [ ] **Step 3: Verify the test suite passes (no gridUnits references remain)**

Run: `cd frontend && npx vitest run`
Expected: migration utility tests pass; no test tries to import deleted files.

- [ ] **Step 4: Verify the build succeeds**

Run: `cd frontend && npm run build`
Expected: successful build, no import errors for removed packages.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: remove react-grid-layout and gridUnits utility"
```

---

## Task 15: Manual verification

- [ ] **Step 1: Start the dev server**

Run: `cd frontend && npm run dev`

- [ ] **Step 2: Verify empty project flow**

Open a new project (no URL project id). The page should show "Start by adding content." Click the `+` button in the nav → "Add Text". A single section titled "My Work" should appear with a full-width text item inside it.

- [ ] **Step 3: Verify section CRUD**

In edit mode:
- Click "Add Section" from the `+` menu — a second section ("New Section") appears below.
- Click the section title to edit it inline — type a new name, press Enter — title updates.
- Click the trash icon on the empty section — it disappears.
- Add items to both sections; try deleting a non-empty section — confirm dialog appears.

- [ ] **Step 4: Verify image aspect ratio**

Add an image. Resize the browser window from wide to narrow — the image height should scale with the width, maintaining the original proportions. No stretching.

- [ ] **Step 5: Verify colSpan controls**

Select an item (click the `⋮` menu → Edit). The toolbar should show width buttons 1–4. Clicking them updates the item width immediately. Drag the right-edge handle left or right — the item snaps to a new column span on release.

- [ ] **Step 6: Verify drag-to-reorder**

Drag an item within a section to a different position — order updates. Drag an item from one section to another — it appears in the target section.

- [ ] **Step 7: Verify existing projects load**

Open an existing project that was saved with the old flat-dict format. It should load correctly, with all items placed in a single "My Work" section with their column spans derived from the legacy `w` values.

- [ ] **Step 8: Verify undo/redo**

Make several changes (move items, change colSpan, add section). Undo and redo should traverse the history correctly.
