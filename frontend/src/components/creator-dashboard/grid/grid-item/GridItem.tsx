// EditableContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import './GridItem.css';
import { useEditorStore } from '@/context/EditorStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OPTION_PAGES } from '../options-panel/OptionsPages';
import { useContentCheck } from '@/hooks/useContentCheck';

export interface GridDimensions {
  gridWidth?: number;
  gridHeight?: number;
}

interface GridItemProps {
  id: string;
  children: React.ReactElement<GridDimensions>;
}

const GridItem: React.FC<GridItemProps> = ({
  id,
  children,
}) => {

  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null!);

  const setActiveEditor = useEditorStore(state => state.setActiveEditor);
  const activeEditor = useEditorStore(state => state.activeEditor);
  const isEditing = activeEditor === id;
  const deleteItem = useEditorStore(state => state.deleteItem);
  
  const item = useEditorStore(state => state.currentProject.items[id]);
  const hasContent = useContentCheck(id);

  const viewState = useEditorStore(state => state.viewState);
  const isOwnerEdit = viewState === 'OwnerEdit';
  const loadingAssets = useEditorStore(state => state.isLoadingAssets || state.loadingAssets);

  const pages = item ? OPTION_PAGES[item.type] : null;

  // Gets the dimensions of the grid item on change
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);


  return (
    <>
      <div 
        ref={containerRef}
        className={cn(
          "grid-item transition-shadow duration-300 ",
          {"shadow-[0px_0px_20px_-10px_rgba(0,0,0,0.3)]": isOwnerEdit && !loadingAssets}
        )}
        data-item-id={id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="content-area">
          {React.cloneElement(children as React.ReactElement<GridDimensions>, {
            gridWidth: dimensions.width,
            gridHeight: dimensions.height
          })}    
        </div>
        {isHovered && isOwnerEdit && !loadingAssets && !isEditing && pages && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background border border-border"
                  onMouseEnter={(e) => e.stopPropagation()}
                  onMouseLeave={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="bg-system text-system-foreground border-system" 
                align="end"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {hasContent && pages.map((page) => (
                  <DropdownMenuItem
                    key={page.label}
                    onClick={() => {
                      setActiveEditor(id);
                    }}
                  >
                    {page.label}
                  </DropdownMenuItem>
                ))}
                {hasContent && pages.length > 0 && <DropdownMenuSeparator className="bg-system" />}
                <DropdownMenuItem
                  onClick={() => {
                    deleteItem(id);
                    setActiveEditor(null);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </>
  );
};

export default GridItem;