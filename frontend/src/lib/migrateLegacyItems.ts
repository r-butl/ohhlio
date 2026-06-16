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
    props: item.props as unknown as ItemProps['props'],
  }) as ItemProps);

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
