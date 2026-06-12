import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WidthProvider, Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import TextEditor from './text-editor/TextEditor';
import ImageEditor from './image-editor/ImageEditor';
import GridItem from './grid-item/GridItem';
import ToolbarOverlay from './options-panel/ToolbarOverlay';

import { useEditorStore } from '../../../context/EditorStore';
import { deriveImageHeightUnits, getColWidth, unitsToPx } from '@/lib/gridUnits';

// Single source of truth for RGL's margin/padding/breakpoint config — also
// passed into the <ResponsiveGrid> props below and used by gridUnits.
const GRID_MARGIN: [number, number] = [5, 5];
const GRID_PADDING: [number, number] = [1, 1];
const BREAKPOINT_LG = 768;

const ResponsiveGrid = WidthProvider(Responsive);

interface RendererProps {}

const EditorGrid: React.FC<RendererProps> = () => {

  const buttonHovered = useEditorStore(state => state.buttonHovered);
  const viewState = useEditorStore(state => state.viewState);
  const activeEditor = useEditorStore(state => state.activeEditor);
  const items = useEditorStore(state => state.currentProject.items);

  const setItemsWithHistory = useEditorStore(state => state.setItemsWithHistory);
  
  const isOwnerEdit = viewState === 'OwnerEdit';
  const loadingAssets = useEditorStore(state => state.isLoadingAssets);
  const isDraggable = isOwnerEdit && (activeEditor === null) && !buttonHovered;
  const isResizable = isOwnerEdit && !buttonHovered;

  const { editorMaxWidth, gridRowHeight, gridColumnCount } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null!);
  const [containerWidthPx, setContainerWidthPx] = useState(0);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'lg' | 'xs'>('lg');

  // Measures the outer wrapper's width so image aspect ratios can be derived
  // from real pixel widths at both the lg (4-col) and xs (1-col) breakpoints.
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setContainerWidthPx(width);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint === 'lg' ? 'lg' : 'xs');
  };

  const handleLayoutChange = (layout: any[]) => {
    if (isOwnerEdit && !loadingAssets) {
      setItemsWithHistory(draft => {
        layout.forEach(layoutItem => {
          const draftItem = draft[layoutItem.i];
          if (!draftItem) return;

          draftItem.layout = layoutItem;

          // Dragging only changes position, but resizing changes w/h —
          // recompute aspectRatio from the new pixel box so the ratio the
          // user just set becomes the new locked ratio. `cols` is taken from
          // RGL's own onBreakpointChange callback so it matches whichever
          // layout (lg or xs) RGL is actually editing.
          if (draftItem.type === 'image' && containerWidthPx) {
            const cols = currentBreakpoint === 'lg' ? gridColumnCount : 1;
            const colWidth = getColWidth(containerWidthPx, cols, GRID_MARGIN[0], GRID_PADDING[0]);
            const widthPx = unitsToPx(layoutItem.w, colWidth, GRID_MARGIN[0]);
            const heightPx = unitsToPx(layoutItem.h, gridRowHeight, GRID_MARGIN[1]);
            if (heightPx > 0) {
              draftItem.props.aspectRatio = widthPx / heightPx;
            }
          }
        });
      });
    }
  };

  const generateLayouts = useCallback(() => {
    const itemValues = Object.values(items);

    // For image items, derive `h` from the stored aspectRatio and the
    // current pixel width so the rendered ratio stays constant across
    // viewport widths and the mobile/desktop toggle. Text items keep their
    // stored `h` unchanged.
    const deriveH = (item: typeof itemValues[number], widthUnits: number, cols: number) => {
      if (item.type !== 'image') return item.layout.h;

      return deriveImageHeightUnits({
        aspectRatio: item.props.aspectRatio,
        widthUnits,
        containerWidthPx,
        cols,
        marginX: GRID_MARGIN[0],
        marginY: GRID_MARGIN[1],
        paddingX: GRID_PADDING[0],
        rowHeight: gridRowHeight,
        minH: item.layout.minH || 1,
        maxH: item.layout.maxH || 100,
        fallbackH: item.layout.h,
      });
    };

    // Desktop layout uses the user-configured layout, with image heights derived
    const desktopLayout = itemValues.map(item => ({
      ...item.layout,
      h: deriveH(item, item.layout.w, gridColumnCount),
    }));

    // Mobile layout stacks everything in a single column, with image heights
    // derived for a full-width (w=1, cols=1) item
    const mobileLayout = itemValues.map(item => ({
      ...item.layout,
      w: 1, // Force width to 1 column
      x: 0, // Ensure it's in the first (and only) column
      h: deriveH(item, 1, 1),
    }));

    return {
      lg: desktopLayout,
      xs: mobileLayout,
    };
  }, [items, containerWidthPx, gridColumnCount, gridRowHeight]);

  const renderItem = (item: typeof items[string]) => {

    return (
      <div
        key={item.id}
        data-grid={{
          ...item.layout,
          minW: item.layout.minW || 1,
          maxW: item.layout.maxW || gridColumnCount,
          minH: item.layout.minH || 1,
          maxH: item.layout.maxH || 100,
        }}
      >
        <GridItem
          id={item.id}
        >
          {item.type === 'text' ? (
            <TextEditor 
              id={item.id}
              {...item.props}
            />
          ) : (
            <ImageEditor
              id={item.id}
              {...item.props}
            />
          )}
        </GridItem>
      </div>
    );
  };

  return (

    <div ref={containerRef} style={{ width: '100%', maxWidth: `${editorMaxWidth}px`, margin: '0 auto' }}>
      <ResponsiveGrid
        className="layout"
        layouts={generateLayouts()}
        breakpoints={{ lg: BREAKPOINT_LG, xs: 0 }}
        cols={{ lg: gridColumnCount, xs: 1 }}
        rowHeight={gridRowHeight}
        isDraggable={isDraggable && !loadingAssets}
        isResizable={isResizable && !loadingAssets}
        resizeHandles={['sw', 'se']}
        onDragStop={handleLayoutChange}
        onResizeStop={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        margin={GRID_MARGIN}
        containerPadding={GRID_PADDING}
        compactType="vertical"
        preventCollision={false}
      >
        {Object.values(items).map(renderItem)}
      </ResponsiveGrid>
      <footer>
            <div
                className='space'
                style={{height: '200px'}}>
            </div>
      </footer>
      <ToolbarOverlay />
    </div>
  );
};

export default EditorGrid;
