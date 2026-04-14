
export interface TextProps {
    content: string;    // Probably want to store this as mark down as it would look super clean.
}

export interface ImageProps {
    assetId: string | null; 
    originalImage: string | null; 
    aspectRatio: number;    // For the frame of the image
    cropX: number;          // Crop box x location
    cropY: number;          // Crop box y location
    zoom: number;           // image zoom on crop box, shape of crop box is determined by aspect ratio
}

export interface ItemLayoutProps {
    x: number       // origin square x  -   width goes right from here
    y: number       // origin square y  -   height goes down from here
    w: number       // Cuantos grid squares rightward
    h: number       // Cuantos grid squares downward
    i: string       // Position in Layout sequence
}

export interface ItemProps {
    id: string;
    type: 'text' | 'image';
    layout: ItemLayoutProps;
    contents: ImageProps | TextProps;
}


export interface ProjectHeader {
    title: string;
    description?: string;
    headerPhoto?: ImageProps;
}
  
export interface ProjectProps {
    projectHeader: ProjectHeader
    items: ItemProps[]
}