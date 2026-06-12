
export interface TextProps {
    content: string;    // Probably want to store this as mark down as it would look super clean.
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
    aspectRatio: number;    // For the frame of the image
    zoom: number;           // image zoom on crop box, shape of crop box is determined by aspect ratio
    isUploading?: boolean;
    isUploaded?: boolean;
    _backup?: ImageProps;
}

export interface ItemLayoutProps {
    x: number       // origin square x  -   width goes right from here
    y: number       // origin square y  -   height goes down from here
    w: number       // Cuantos grid squares rightward
    h: number       // Cuantos grid squares downward
    i: string       // Position in Layout sequence
    minW?: number
    maxW?: number
    minH?: number
    maxH?: number
}

export interface TextItem {
    id: string;
    type: 'text';
    layout: ItemLayoutProps;
    props: TextProps;
}

export interface ImageItem {
    id: string;
    type: 'image';
    layout: ItemLayoutProps;
    props: ImageProps;
}

export type ItemProps = TextItem | ImageItem;


export interface ProjectHeader {
    title?: string;
    description?: string;
    headerPhotoId?: string;
}

export interface ProjectProps {
    projectHeader: ProjectHeader
    items: Record<string, ItemProps>
}
