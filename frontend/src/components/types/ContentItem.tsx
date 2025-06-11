export interface ContentItem {
    id: string;
    type: 'text' | 'image';
    content: string;
    layout: {
      x: number;
      y: number;
      w: number;
      h: number;
      i: string;
    };
  }