// Root layout node
export type LayoutNode = SectionNode;

// ----- Section: Top-level grid container -----
export interface SectionNode {
  id: string;
  type: "Section";
  layout: "grid"; // future-proof
  props: {
    columns: number;      // number of grid columns
    rowHeight?: number;   // fixed or dynamic row height (optional)
    gap?: number;         // space between grid items
  };
  children: BlockNode[];  // positioned blocks
}

// ----- Block: Placed manually within the grid -----
export interface BlockNode {
  id: string;
  type: "Block";
  props: {
    colStart: number;      // 1-based column start
    rowStart: number;      // 1-based row start
    colSpan: number;       // how many columns it spans
    rowSpan: number;       // how many rows it spans
  };
  children: ContentNode; // actual content (Text, Image, etc.) One item per block for now
}

// ----- Content: Leaf components -----
export type ContentNode = TextBlockNode | ImageNode;

export interface TextBlockNode {
  id: string;
  type: "TextBlock";
  props: {
    text: string;
    fontSize?: string;
    align?: "left" | "center" | "right";
  };
}

export interface ImageNode {
  id: string;
  type: "Image";
  props: {
    src: string;
    alt?: string;
    fit?: "cover" | "contain";
    borderRadius?: string;
  };
}