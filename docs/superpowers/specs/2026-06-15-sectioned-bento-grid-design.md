# Sectioned Bento Grid Design

**Date:** 2026-06-15  
**Status:** Approved  
**Replaces:** react-grid-layout based grid (`EditorGrid.tsx`) and the image aspect-ratio locking plan (`2026-06-11-image-aspect-ratio-locking-design.md`)

---

## Background

The current grid is built on react-grid-layout (RGL) with a flat items dict. Image aspect-ratio locking was added to fix stretching across breakpoints, but the implementation fights RGL's internals — a timing race between our ResizeObserver and RGL's WidthProvider means images still stretch when the browser is resized across the 768px breakpoint. Rather than patch RGL further, we replace it with a CSS Grid system that is simpler, more controllable, and structured to support an eventual LLM layout API.

---

## Goals

- Eliminate image aspect-ratio bugs entirely (CSS, not JS math)
- Introduce sections as first-class narrative containers (e.g. stages of a DIY project)
- Keep the UX simple — not a full web builder, just a bento-box portfolio
- Produce a clean data model that an LLM agent can read and manipulate

---

## Data Model

The `items` JSON column on `Project` changes shape. No database migration is needed — the column type stays `Json`. A migration utility will convert legacy flat-dict projects on load.

### New shape

```ts
type ProjectItems = {
  sections: Section[]
}

type Section = {
  id: string         // nanoid
  title: string
  items: GridItem[]  // ordered array; DOM order = layout order
}

type GridItem = {
  id: string
  type: 'text' | 'image'
  colSpan: number    // 1–4 (out of 4 columns)
  props: TextProps | ImageProps  // unchanged from current
}
```

### Key decisions

- **No explicit x/y coordinates.** Items flow left-to-right within a section via CSS Grid `auto-placement`. Layout order = array order.
- **No rowSpan.** Row height is content-driven. Text items grow with their content. Image items are sized by `aspectRatio` via the CSS `aspect-ratio` property — no JS height math.
- **colSpan is the only layout knob per item** (1 = quarter width, 2 = half, 3 = three-quarter, 4 = full).
- **Sections are ordered.** The `sections` array order is the vertical render order.

### Legacy migration

On project load, if `items` has the old shape (a dict with string keys and `layout` objects), convert it:

```ts
function migrateLegacyItems(raw: unknown): ProjectItems {
  if (raw && 'sections' in (raw as object)) return raw as ProjectItems
  // Convert flat dict to a single default section
  const items = Object.values(raw as Record<string, LegacyItem>)
  return {
    sections: [{
      id: nanoid(),
      title: 'My Work',
      items: items.map(item => ({
        id: item.id,
        type: item.type,
        colSpan: Math.min(item.layout.w, 4),
        props: item.props
      }))
    }]
  }
}
```

---

## Grid Rendering

### Section layout

```
[ Section Title (editable) ]        [ + Add Item ] [ ⋮ Delete ]
┌────────┬────────┬────────┬────────┐
│ item   │ item             │ item  │   ← colSpan: 1, 2, 1
│        │                  │       │
├────────┴────────┬─────────┴───────┤
│ item (full)                       │   ← colSpan: 4
│                                   │
└───────────────────────────────────┘

[ + Add Section ]
```

### CSS Grid

Each section renders a `div` with:
```css
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 8px;
```

Each item:
```css
grid-column: span var(--col-span);  /* set via inline style */
```

Image items additionally set `aspect-ratio` via inline style from `props.aspectRatio`. No JS measurement required. On any viewport width, the CSS engine recomputes height automatically.

### Mobile

A single media query at 640px sets all items to `grid-column: span 4` (full width). No breakpoint logic in JS, no layout switching.

### EditorGrid rewrite

`EditorGrid.tsx` becomes a simple map:
- Map over `sections` → render `<Section>` per section
- Map over `section.items` → render `<GridItem>` per item
- No `ResponsiveGrid`, no `WidthProvider`, no `generateLayouts()`, no `ResizeObserver`

The `gridUnits.ts` utility and its tests are deleted (no longer needed).

---

## Interactions

### Drag to reorder items

dnd-kit `SortableContext` per section. Items have a drag handle (shown on hover in edit mode). Moving between sections uses nested dnd-kit sortable contexts — dnd-kit supports this via the `over` container detection pattern.

### Drag to reorder sections

The section list is itself a dnd-kit `SortableContext`. A drag handle on the section header reorders sections.

### Resize (colSpan)

Two mechanisms, both updating `colSpan`:

**Toolbar buttons:** The existing `ToolbarOverlay` gets four column-span buttons (1–4). Click immediately updates `colSpan`. Fast and precise.

**Drag handle:** A handle on the right edge of each item. On `mousedown`, track `mousemove` delta. Each `<SectionGrid>` component holds a ref to its grid div; its pixel width divided by 4 gives one column width. Compute `colSpan` as:
```ts
const colWidth = sectionGridRef.current.offsetWidth / 4
const newSpan = clamp(Math.round(dragX / colWidth), 1, 4)
```
Live-previews during drag (optimistic UI), commits to store on `mouseup`. No dnd-kit needed — plain pointer events.

### Section CRUD

- **Add section:** Button below the last section. Creates a new section with a default title and empty items array.
- **Delete section:** Button on section header. If section has items, shows a confirmation. Items are discarded.
- **Edit section title:** Click on the title text → inline `<input>`. Blur or Enter commits.

### Add/remove items

Unchanged from current — `AddContentItem` button adds to the active section. Delete button on `GridItem` removes it.

### Undo/redo

All mutations go through `setItemsWithHistory` in `EditorStore`. The history stack stores full snapshots of `ProjectItems`. Existing undo/redo UI and 20-item limit unchanged.

---

## EditorStore Changes

The store's `currentProject.items` changes from `Record<string, GridItem>` to `ProjectItems`. All selectors and mutators that currently navigate `items[id]` need to navigate `sections[].items[]` instead.

Key store changes:
- `setItemsWithHistory` accepts `(draft: ProjectItems) => void` instead of `(draft: Record<string, GridItem>) => void`
- `activeEditor` stays as `string | null` (item id) — lookup changes to a linear search across sections
- Project load calls `migrateLegacyItems` before setting store state

---

## LLM Layout API (future)

The data model is designed to be LLM-readable. A layout suggestion from an agent would be a partial update:

```ts
type LayoutSuggestion = {
  sections: Array<{
    id: string
    title?: string
    itemOrder?: string[]       // reorder by id
    itemSpans?: { id: string; colSpan: number }[]
  }>
  sectionOrder?: string[]      // reorder sections by id
}
```

The agent can suggest colSpan changes, item reordering within sections, and section reordering — without touching content (text, images). This API does not need to exist now; the data model just needs to not block it.

---

## What Gets Deleted

- `react-grid-layout` and `react-resizable` npm packages
- `react-grid-layout/css/styles.css` and `react-resizable/css/styles.css` imports
- `frontend/src/lib/gridUnits.ts` and `gridUnits.test.ts`
- `EditorStore` layout-related fields: `gridRowHeight`, `gridColumnCount`, `editorMaxWidth` (replaced by CSS)
- `EditorGrid.tsx` logic: `generateLayouts`, `handleLayoutChange`, `handleBreakpointChange`, `containerRef`, `containerWidthPx`, `currentBreakpoint`
- RGL-specific fields from item data: `layout.x`, `layout.y`, `layout.w`, `layout.h`, `layout.minW`, etc.

---

## What Stays Unchanged

- `TextEditor.tsx` and `ImageEditor.tsx` — rendered inside grid items, no layout concerns
- `GridItem.tsx` — wrapper component, may need minor updates for drag handle
- `ToolbarOverlay.tsx` — extended with colSpan buttons, otherwise unchanged
- `ImageProps.aspectRatio` — still stored, now consumed by CSS instead of JS
- All backend, API, and asset handling — no changes
- Auth, routing, public profile view — no changes
