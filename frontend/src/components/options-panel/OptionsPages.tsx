// OptionPages.ts
import { ReactNode } from 'react';
import TextToolbarPortal from './TextToolbar';

export type PageComponentProps = { id: string };

export interface PageEntry {
  label: string;
  component: React.FC<PageComponentProps>;
}

export const OPTION_PAGES: Record<string, PageEntry[]> = {
  text: [
    { label: 'Text Settings', component:  TextToolbarPortal},
  ],
  image: [
    //{ label: 'Image Settings', component: ImageSettingsPage },
  ],
  // ... add more item types
};
