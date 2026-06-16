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
