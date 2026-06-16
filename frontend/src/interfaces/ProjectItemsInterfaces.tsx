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
