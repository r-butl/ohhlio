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
