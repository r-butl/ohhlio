// OptionPages.ts
import TextToolbar from './TextToolbar';
import ImageToolbar from './ImageToolbar';

export type PageComponentProps = { id: string };

export interface PageEntry {
  label: string;
  component: React.FC<PageComponentProps>;
}

export const OPTION_PAGES: Record<string, PageEntry[]> = {
  text: [
    { label: 'Edit', component:  TextToolbar},
  ],
  image: [
    { label: 'Crop', component: ImageToolbar },
  ],
};
