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
