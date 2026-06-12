# Image Aspect-Ratio Locking — Design

## Problem

Image grid items store an `aspectRatio` (`ImageProps.aspectRatio`), but it's purely descriptive: it's recomputed from the rendered pixel box and overwritten on every confirm. It never constrains layout.

The root cause is a unit mismatch in `EditorGrid`:
- `layout.w` is in column units (1–4), which scale with container width.
- `layout.h` is rendered in raw pixels because `rowHeight={gridRowHeight}` is `1px`.

So an item's rendered `width/height` ratio changes whenever the container width changes — including the mobile/desktop toggle, where mobile forces `w=1` but copies `h` unchanged (`EditorGrid.tsx:53-57`).

Scope for this spec: **image items only**. Text dynamic-height is a related but separate problem (content-driven, not ratio-driven) and is noted as a future extension (section F).

## Design

### A. Grid-units ↔ pixel utility (`frontend/src/lib/gridUnits.ts`)

RGL's pixel formulas account for margins *inside* an item's span:

```
widthPx  = colWidth * w + margin_x * (w - 1)
heightPx = rowHeight * h + margin_y * (h - 1)   // rowHeight = 1px currently
```

New pure functions:
- `getColWidth(containerWidthPx, cols, marginX, paddingX)`
- `unitsToPx(units, cellSize, margin)`
- `pxToUnits(px, cellSize, margin)` — inverse of the above

This is the single place that encodes RGL's margin/padding/cols → pixel mapping. Used by both the resize-capture step (D) and the render-time derivation step (C), and reusable later for text auto-height.

### B. Measuring container width

`EditorGrid`'s outer wrapper (`maxWidth: 800px`) gets a `ResizeObserver` (same pattern as `GridItem.tsx`) feeding a `containerWidthPx` state value. This wrapper's width is pure CSS layout and is valid input for computing column widths at both `cols=4` (desktop) and `cols=1` (mobile) — independent of which breakpoint RGL has activated.

### C. Deriving `h` in `generateLayouts()`

For **image items only**, in both `desktopLayout` and `mobileLayout`:

```ts
const colWidth = getColWidth(containerWidthPx, cols, margin, padding); // cols=4 or 1
const widthPx = unitsToPx(item.layout.w, colWidth, margin);            // w=1 for mobile
const targetHeightPx = widthPx / item.props.aspectRatio;
const derivedH = clamp(
  pxToUnits(targetHeightPx, /* rowHeight */ 1, marginY),
  item.layout.minH ?? 1,
  item.layout.maxH ?? 100
);
```

`layout.h` in the store stops being authoritative for image items — it's a fallback/seed. The derived `h` is computed every render and passed into RGL's `layouts` prop, so `compactType="vertical"` reflows items below correctly. No store writes happen during resize/scroll.

If `containerWidthPx` is `0` (not yet measured on first mount), fall back to `item.layout.h` to avoid a flash of zero height.

### D. Resize → capture new aspect ratio

In `handleLayoutChange` (`onResizeStop`), for image items: compute `widthPx`/`heightPx` from the resulting `w`/`h` via the same utility, set `aspectRatio = widthPx / heightPx`, and persist both the new `layout` (`w`, `h`, `x`, `y`) and `props.aspectRatio` via `setItemsWithHistory`. Resizing redefines the ratio (per design decision).

### E. New & legacy items

New image items get a default `aspectRatio` (`4/3`) at creation. Existing projects already have an `aspectRatio` value from the old (margin-naive) computation — it'll differ slightly from the new margin-aware math, so existing images may shift height very slightly on first load, then stay stable. No migration script needed.

### F. Text auto-height (future extension, not in this spec)

A follow-up could have `TextEditor` measure its content's natural `scrollHeight`, convert via `pxToUnits()`, and feed a derived `h` into `generateLayouts()` the same way — driven by content size instead of a stored ratio. Separate spec/plan.

### G. Cleanup in `ImageEditor.tsx`

- Remove the `currentAspectRatio` memo (computed from `gridWidth`/`gridHeight`, with the "prevent infinite re-renders" comment) — dead code under this design.
- `defaultImageProps.aspectRatio` falls back to a constant (`4/3`) instead of the computed value.
- The `confirm-edit` handler no longer writes `aspectRatio` — cropping/zooming the image content shouldn't redefine the frame's ratio; only resizing the grid box (`onResizeStop` in `EditorGrid`) does.

## Testing

- Unit tests for `gridUnits.ts`: `unitsToPx`/`pxToUnits` round-trips, `getColWidth` for cols=4 and cols=1.
- Tests for the derivation function with mock items (various `aspectRatio`, `containerWidthPx`), asserting derived `h` for desktop vs. mobile layouts.
- Manual check: resize the browser across the 768px breakpoint with an image present — visual ratio should stay constant; drag-resize an image, then toggle mobile/desktop — new ratio should persist.
