# Image Aspect-Ratio Locking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make image grid items maintain a constant rendered aspect ratio across viewport-width changes and the mobile/desktop layout toggle, without persisting derived layout values during render.

**Architecture:** Add a pure `gridUnits.ts` utility that encodes react-grid-layout's column/row ↔ pixel math. `EditorGrid` measures its container width via `ResizeObserver` and uses the utility to derive each image item's `h` at render time from its stored `aspectRatio` and current `w`/container width — for both the desktop and mobile layouts passed to RGL. User-driven resizes (`onResizeStop`) recompute and persist `aspectRatio` from the resulting pixel box. `ImageEditor` stops writing a computed aspect ratio on confirm and falls back to a constant `4/3` default for new items.

**Tech Stack:** React 19, TypeScript, react-grid-layout, Zustand/Immer (`EditorStore`), Vitest

**Design doc:** `docs/superpowers/specs/2026-06-11-image-aspect-ratio-locking-design.md`

---

## Task 1: Grid-units ↔ pixel utility (`gridUnits.ts`)

**Files:**
- Create: `frontend/src/lib/gridUnits.ts`
- Test: `frontend/src/lib/gridUnits.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/lib/gridUnits.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getColWidth, unitsToPx, pxToUnits, clamp, deriveImageHeightUnits } from './gridUnits';

describe('getColWidth', () => {
  it('computes column width for a 4-column desktop grid', () => {
    expect(getColWidth(800, 4, 5, 1)).toBeCloseTo(195.75);
  });

  it('computes column width for a 1-column mobile grid', () => {
    expect(getColWidth(800, 1, 5, 1)).toBeCloseTo(798);
  });
});

describe('unitsToPx / pxToUnits', () => {
  it('round-trips width units through pixels', () => {
    const colWidth = getColWidth(800, 4, 5, 1);
    const px = unitsToPx(2, colWidth, 5);
    expect(px).toBeCloseTo(396.5);
    expect(pxToUnits(px, colWidth, 5)).toBeCloseTo(2);
  });

  it('round-trips height units through pixels with rowHeight=1', () => {
    const px = unitsToPx(45, 1, 5);
    expect(px).toBeCloseTo(265);
    expect(pxToUnits(px, 1, 5)).toBeCloseTo(45);
  });
});

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(10, 1, 20)).toBe(10);
  });

  it('clamps to the minimum', () => {
    expect(clamp(0, 1, 20)).toBe(1);
  });

  it('clamps to the maximum', () => {
    expect(clamp(25, 1, 20)).toBe(20);
  });
});

describe('deriveImageHeightUnits', () => {
  const baseParams = {
    aspectRatio: 4 / 3,
    containerWidthPx: 800,
    marginX: 5,
    marginY: 5,
    paddingX: 1,
    rowHeight: 1,
    minH: 1,
    maxH: 200,
    fallbackH: 45,
  };

  it('derives height for a desktop (4-col) item spanning 2 columns', () => {
    const result = deriveImageHeightUnits({
      ...baseParams,
      widthUnits: 2,
      cols: 4,
    });
    expect(result).toBeCloseTo(50.395833, 5);
  });

  it('derives height for the same item stacked full-width on mobile (1-col)', () => {
    const result = deriveImageHeightUnits({
      ...baseParams,
      widthUnits: 1,
      cols: 1,
    });
    expect(result).toBeCloseTo(100.583333, 5);
  });

  it('falls back to fallbackH when containerWidthPx is not yet measured', () => {
    const result = deriveImageHeightUnits({
      ...baseParams,
      containerWidthPx: 0,
      widthUnits: 2,
      cols: 4,
    });
    expect(result).toBe(45);
  });

  it('clamps the derived height to maxH', () => {
    const result = deriveImageHeightUnits({
      ...baseParams,
      widthUnits: 2,
      cols: 4,
      maxH: 50,
    });
    expect(result).toBe(50);
  });

  it('clamps the derived height to minH', () => {
    const result = deriveImageHeightUnits({
      ...baseParams,
      aspectRatio: 20, // very wide/short image
      widthUnits: 2,
      cols: 4,
      minH: 30,
    });
    expect(result).toBe(30);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/lib/gridUnits.test.ts`
Expected: FAIL — `gridUnits.ts` does not exist / exports not found.

- [ ] **Step 3: Implement `gridUnits.ts`**

Create `frontend/src/lib/gridUnits.ts`:

```ts
// Pure helpers for converting between react-grid-layout's column/row units
// and pixels. RGL's pixel formulas (with rowHeight in px, and margin applied
// between cells inside an item's span) are:
//
//   widthPx  = colWidth * w + marginX * (w - 1)
//   heightPx = rowHeight * h + marginY * (h - 1)

export function getColWidth(
  containerWidthPx: number,
  cols: number,
  marginX: number,
  paddingX: number
): number {
  return (containerWidthPx - marginX * (cols - 1) - paddingX * 2) / cols;
}

export function unitsToPx(units: number, cellSize: number, margin: number): number {
  return cellSize * units + margin * (units - 1);
}

export function pxToUnits(px: number, cellSize: number, margin: number): number {
  return (px + margin) / (cellSize + margin);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface DeriveImageHeightParams {
  aspectRatio: number;
  widthUnits: number;
  containerWidthPx: number;
  cols: number;
  marginX: number;
  marginY: number;
  paddingX: number;
  rowHeight: number;
  minH: number;
  maxH: number;
  fallbackH: number;
}

// Derives the grid-row-unit height that keeps an image item's rendered
// width/height ratio equal to `aspectRatio`, for the given container width
// and column count. Falls back to `fallbackH` if `containerWidthPx` hasn't
// been measured yet (e.g. before first ResizeObserver callback).
export function deriveImageHeightUnits(params: DeriveImageHeightParams): number {
  const {
    aspectRatio,
    widthUnits,
    containerWidthPx,
    cols,
    marginX,
    marginY,
    paddingX,
    rowHeight,
    minH,
    maxH,
    fallbackH,
  } = params;

  if (!containerWidthPx) {
    return fallbackH;
  }

  const colWidth = getColWidth(containerWidthPx, cols, marginX, paddingX);
  const widthPx = unitsToPx(widthUnits, colWidth, marginX);
  const targetHeightPx = widthPx / aspectRatio;
  const derivedH = pxToUnits(targetHeightPx, rowHeight, marginY);

  return clamp(derivedH, minH, maxH);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/lib/gridUnits.test.ts`
Expected: PASS — all 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/gridUnits.ts frontend/src/lib/gridUnits.test.ts
git commit -m "feat: add gridUnits pixel/grid-unit conversion utilities"
```

---

## Task 2: Measure `EditorGrid` container width

**Files:**
- Modify: `frontend/src/components/creator-dashboard/grid/EditorGrid.tsx:1-31, 97-99`

- [ ] **Step 1: Add `ResizeObserver`-based container width state**

In `frontend/src/components/creator-dashboard/grid/EditorGrid.tsx`, update the import on line 1:

```ts
import React, { useCallback, useEffect, useRef, useState } from 'react';
```

After the existing hook reads (after line 31, `const { editorMaxWidth, gridRowHeight, gridColumnCount } = useEditorStore();`), add:

```ts
  const containerRef = useRef<HTMLDivElement>(null!);
  const [containerWidthPx, setContainerWidthPx] = useState(0);

  // Measures the outer wrapper's width so image aspect ratios can be derived
  // from real pixel widths at both the lg (4-col) and xs (1-col) breakpoints.
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setContainerWidthPx(width);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
```

- [ ] **Step 2: Attach the ref to the outer wrapper**

Update the outer `<div>` (currently line 99):

```tsx
    <div ref={containerRef} style={{ width: '100%', maxWidth: `${editorMaxWidth}px`, margin: '0 auto' }}>
```

- [ ] **Step 3: Verify the app still builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/EditorGrid.tsx
git commit -m "feat: measure EditorGrid container width via ResizeObserver"
```

---

## Task 3: Derive image item `h` at render time

**Files:**
- Modify: `frontend/src/components/creator-dashboard/grid/EditorGrid.tsx`

- [ ] **Step 1: Add shared grid constants and import the utility**

At the top of `frontend/src/components/creator-dashboard/grid/EditorGrid.tsx`, after the existing imports, add:

```ts
import { deriveImageHeightUnits, getColWidth, unitsToPx } from '@/lib/gridUnits';

// Single source of truth for RGL's margin/padding/breakpoint config — also
// passed into the <ResponsiveGrid> props below and used by gridUnits.
const GRID_MARGIN: [number, number] = [5, 5];
const GRID_PADDING: [number, number] = [1, 1];
const BREAKPOINT_LG = 768;
```

- [ ] **Step 2: Replace `generateLayouts` with a version that derives image heights**

Replace the existing `generateLayouts` (current lines 46-63):

```ts
  const generateLayouts = useCallback(() => {
    const itemValues = Object.values(items);

    // For image items, derive `h` from the stored aspectRatio and the
    // current pixel width so the rendered ratio stays constant across
    // viewport widths and the mobile/desktop toggle. Text items keep their
    // stored `h` unchanged.
    const deriveH = (item: typeof itemValues[number], widthUnits: number, cols: number) => {
      if (item.type !== 'image') return item.layout.h;

      return deriveImageHeightUnits({
        aspectRatio: item.props.aspectRatio,
        widthUnits,
        containerWidthPx,
        cols,
        marginX: GRID_MARGIN[0],
        marginY: GRID_MARGIN[1],
        paddingX: GRID_PADDING[0],
        rowHeight: gridRowHeight,
        minH: item.layout.minH || 1,
        maxH: item.layout.maxH || 100,
        fallbackH: item.layout.h,
      });
    };

    // Desktop layout uses the user-configured layout, with image heights derived
    const desktopLayout = itemValues.map(item => ({
      ...item.layout,
      h: deriveH(item, item.layout.w, gridColumnCount),
    }));

    // Mobile layout stacks everything in a single column, with image heights
    // derived for a full-width (w=1, cols=1) item
    const mobileLayout = itemValues.map(item => ({
      ...item.layout,
      w: 1, // Force width to 1 column
      x: 0, // Ensure it's in the first (and only) column
      h: deriveH(item, 1, 1),
    }));

    return {
      lg: desktopLayout,
      xs: mobileLayout,
    };
  }, [items, containerWidthPx, gridColumnCount, gridRowHeight]);
```

- [ ] **Step 3: Use the shared margin/padding constants in `<ResponsiveGrid>`**

Update the RGL props (current lines 111-112):

```tsx
        margin={GRID_MARGIN}
        containerPadding={GRID_PADDING}
```

And update the breakpoints prop (current line 103) to use the shared constant:

```tsx
        breakpoints={{ lg: BREAKPOINT_LG, xs: 0 }}
```

- [ ] **Step 4: Verify the app still builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/EditorGrid.tsx
git commit -m "feat: derive image item heights from aspect ratio at render time"
```

---

## Task 4: Capture aspect ratio on resize

**Files:**
- Modify: `frontend/src/components/creator-dashboard/grid/EditorGrid.tsx:33-44`

- [ ] **Step 1: Update `handleLayoutChange` to recompute `aspectRatio` for image items**

Replace the existing `handleLayoutChange` (current lines 33-44):

```ts
  const handleLayoutChange = (layout: any[]) => {
    if (isOwnerEdit && !loadingAssets) {
      setItemsWithHistory(draft => {
        layout.forEach(layoutItem => {
          const draftItem = draft[layoutItem.i];
          if (!draftItem) return;

          draftItem.layout = layoutItem;

          // Dragging only changes position, but resizing changes w/h —
          // recompute aspectRatio from the new pixel box so the ratio the
          // user just set becomes the new locked ratio.
          if (draftItem.type === 'image' && containerWidthPx) {
            const cols = containerWidthPx >= BREAKPOINT_LG ? gridColumnCount : 1;
            const colWidth = getColWidth(containerWidthPx, cols, GRID_MARGIN[0], GRID_PADDING[0]);
            const widthPx = unitsToPx(layoutItem.w, colWidth, GRID_MARGIN[0]);
            const heightPx = unitsToPx(layoutItem.h, gridRowHeight, GRID_MARGIN[1]);
            draftItem.props.aspectRatio = widthPx / heightPx;
          }
        });
      });
    }
  };
```

- [ ] **Step 2: Verify the app still builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/EditorGrid.tsx
git commit -m "feat: recompute image aspect ratio on resize"
```

---

## Task 5: Clean up `ImageEditor.tsx`

**Files:**
- Modify: `frontend/src/components/creator-dashboard/grid/image-editor/ImageEditor.tsx:25-36, 71-81, 98`

- [ ] **Step 1: Remove the computed `currentAspectRatio` memo and default to `4/3`**

Replace the current lines 25-36:

```ts
  // Memoize the aspect ratio calculation to prevent infinite re-renders
  const currentAspectRatio = useMemo(() => {
    return gridWidth && gridHeight ? gridWidth / gridHeight : 4 / 3;
  }, [gridWidth, gridHeight]);
  
  // Provide default values if item doesn't exist or props are incomplete
  const defaultImageProps: ImageProps = useMemo(() => ({
    assetId: null,
    originalImage: null,
    zoom: 1,
    aspectRatio: currentAspectRatio
  }), [currentAspectRatio]);
```

with:

```ts
  // Provide default values if item doesn't exist or props are incomplete.
  // aspectRatio defaults to 4/3 for new items; the locked ratio is set by
  // EditorGrid's onResizeStop handler, not here.
  const defaultImageProps: ImageProps = useMemo(() => ({
    assetId: null,
    originalImage: null,
    zoom: 1,
    aspectRatio: 4 / 3
  }), []);
```

- [ ] **Step 2: Stop overwriting `aspectRatio` in the confirm handler**

In the `handleConfirm` body (current lines 71-81), remove the `aspectRatio: currentAspectRatio` line:

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

- [ ] **Step 3: Remove `currentAspectRatio` from the effect's dependency array**

Update the dependency array on current line 98:

```ts
  }, [id, localZoom, localOriginalImage, imageProps, setItemsWithHistory]);
```

- [ ] **Step 4: Verify the app still builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new type errors, no unused-variable errors for `gridWidth`/`gridHeight` (still used for the container `style` below) or `useMemo` (still used for `defaultImageProps`/`imageProps`).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/creator-dashboard/grid/image-editor/ImageEditor.tsx
git commit -m "refactor: stop recomputing image aspectRatio from rendered box"
```

---

## Task 6: Manual verification

**Files:** none (manual browser check)

- [ ] **Step 1: Start the dev server**

Run: `cd frontend && npm run dev`

- [ ] **Step 2: Verify ratio stability across viewport resize**

In the project editor (OwnerEdit mode), add an image item. Resize the browser window continuously from wide (>768px) down through the 768px breakpoint to narrow (<768px) and back. The image's rendered width/height ratio should remain visually constant throughout — no sudden stretching at the breakpoint.

- [ ] **Step 3: Verify ratio persists after a manual resize**

While in OwnerEdit mode on desktop width, drag-resize an image item to a new size (changing both `w` and `h`). Then toggle to mobile width (or use the app's mobile/desktop preview toggle if present) and back to desktop. The new ratio set by the resize should be the one preserved — not the original default.

- [ ] **Step 4: Verify existing projects still load correctly**

Open an existing project that has image items created before this change. Confirm images render without errors and without a jarring height jump beyond a small one-time adjustment (per design section E, legacy `aspectRatio` values may shift slightly on first load, then stay stable).

- [ ] **Step 5: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: PASS — including the new `gridUnits.test.ts` suite and no regressions elsewhere.
