import React, { useEffect} from "react";
import { WidthProvider, Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./Renderer.css";
import TextEditor from "../text-editor/TextEditor";
import GridItem from "../grid-item/GridItem";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface LayoutItem {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

interface ContentItem {
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

interface RendererProps {
  className?: string;
  isEditMode?: boolean;
  isEditing?: boolean;
  contentSchema?: ContentItem[];
  onContentChange?: (content: ContentItem[]) => void;
  onEditingStateChange?: (isEditing: boolean) => void;
}

interface RendererState {
  layouts: { [key: string]: LayoutItem[] };
  currentBreakpoint: string;
  textEditorsEditing: { [key: string]: boolean };
  activeEditorId: string | null;
  items: number;
  isOptionsHovered: boolean;
}

export default class Renderer extends React.PureComponent<RendererProps, RendererState> {
  static defaultProps: RendererProps = {
    className: "layout",
    isEditMode: false,
    isEditing: false,
    contentSchema: [],
    onContentChange: () => {},
  };

  private static readonly defaultLayout = {
    minW: 8,
    maxW: 24,
    minH: 1,
    maxH: 24
  };

  constructor(props: RendererProps) {
    super(props);
    this.state = {
      layouts: this.generateLayouts(),
      currentBreakpoint: 'lg',
      textEditorsEditing: {},
      activeEditorId: null,
      items: props.contentSchema?.length || 0,
      isOptionsHovered: false
    };
  };

  onLayoutChange = (layout: LayoutItem[]) => {
    this.props.onContentChange?.(layout.map(item => ({
      id: item.i,
      type: 'text',
      content: '',
      layout: {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        i: item.i
      }
    })));
  };

  onBreakpointChange = (newBreakpoint: string) => {
    this.setState({ currentBreakpoint: newBreakpoint });
    console.log('Current breakpoint:', newBreakpoint);
  };

  private handleOptionsHoverChange = (isHovered: boolean) => {
    this.setState({ isOptionsHovered: isHovered });
  }

  private handleEditingChange = (itemId: string, isEditing: boolean) => {
    this.setState((prevState) => ({
      textEditorsEditing: {
        ...prevState.textEditorsEditing,
        [itemId]: isEditing
      },
      activeEditorId: isEditing ? itemId : null
    }), () => {
      const isAnyEditorEditing = Object.values(this.state.textEditorsEditing).some(isEditing => isEditing);
      this.props.onEditingStateChange?.(isAnyEditorEditing);
    });
  };

  private handleIsEditableChange = (item: any) => {
    const isEditable = this.props.isEditMode && (!this.state.activeEditorId || this.state.activeEditorId === item.id);
    console.log('TextEditor editable state:', {
      itemId: item.id,
      isEditMode: this.props.isEditMode,
      activeEditorId: this.state.activeEditorId,
      isEditable
    });
    return isEditable;
  };

  private generateDOM() {
    return this.props.contentSchema?.map((item) => {
      const commonProps = {
        key: item.id,
        isEditable: this.handleIsEditableChange(item),
        isEditing: this.state.textEditorsEditing[item.id] || false,
        onEditingChange: (isEditing: boolean) => this.handleEditingChange(item.id, isEditing),
        onOptionsHoverChange: this.handleOptionsHoverChange
      }

      switch (item.type) {
        case 'text':
          return (
            <div 
            key={item.id}   
            data-grid={{
              ...item.layout,
              minW: Renderer.defaultLayout.minW,
              maxW: Renderer.defaultLayout.maxW,
              minH: Renderer.defaultLayout.minH,
              maxH: Renderer.defaultLayout.maxH
            }}
            className={`${this.props.isEditMode ? 'edit' : ''}`}>

              <GridItem {...commonProps}>
                <TextEditor 
                  isEditing={commonProps.isEditing}
                />
              </GridItem>
            </div>
          );
        case 'image':
          return (
            <div key={item.id} className="grid-item">
              {/* Image component will go here */}
              <div>Image: {item.content}</div>
            </div>
          );
        default:
          return null;
      }
    }) || [];
  }

  generateLayouts() {
    const { contentSchema = []} = this.props;
  
    const layout = contentSchema.map(item => ({
      x: item.layout.x,
      y: item.layout.y,
      w: Math.max(item.layout.w, Renderer.defaultLayout.minW),
      h: Math.max(item.layout.h, Renderer.defaultLayout.minH),
      i: item.layout.i,
      minW: Renderer.defaultLayout.minW,
      maxW: Renderer.defaultLayout.maxW,
      minH: Renderer.defaultLayout.minH,
      maxH: Renderer.defaultLayout.maxH
    }));
  
    return {
      lg: layout,
      md: layout,
      sm: layout,
      xs: layout,
      xxs: layout
    };
  }
  
  componentDidUpdate(prevProps: RendererProps) {

    if (prevProps.contentSchema !== this.props.contentSchema) {
      // Handle new content being added
      const newContent = this.props.contentSchema?.filter(
        item => !prevProps.contentSchema?.some(prev => prev.id === item.id)
      ) || [];
      
      if (newContent.length > 0) {
        // Initialize new content with proper layout
        const updatedSchema = this.props.contentSchema?.map(item => {
          if (!item.layout) {
            return {
              ...item,
              id: String(Date.now()),
              content: item.type === 'text' ? 'New Text Block' : '',
              layout: {
                x: 0,
                y: 0,
                w: Renderer.defaultLayout.minW,
                h: Renderer.defaultLayout.minH,
                i: String(Date.now()),
                ...Renderer.defaultLayout
              }
            };
          }
          return item;
        }) || [];
        console.log('Content Schema Updated:', updatedSchema);
        this.props.onContentChange?.(updatedSchema);
      }
    }
  }

  render() {
    const { isEditMode, className } = this.props;
    const columnCount = 24;
    const maxWidth = 1600;
    const rowHeight = maxWidth / 16;
    const isDraggable = isEditMode && 
                        !Object.values(this.state.textEditorsEditing).some(Boolean) && 
                        !this.state.isOptionsHovered;

    return (
      <div style={{ width: "100%", height: "100%", minHeight: "500px", maxWidth: `${maxWidth}px`, margin: "0 auto"}}>

        <ResponsiveReactGridLayout
          className={className}
          layouts={this.state.layouts}
          breakpoints={{ lg: 1600, md: 1200, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: columnCount, md: columnCount, sm: columnCount, xs: columnCount, xxs: columnCount }}
          rowHeight={rowHeight}
          isDraggable={isDraggable}
          isResizable={isDraggable}
          onLayoutChange={this.onLayoutChange}
          onBreakpointChange={this.onBreakpointChange}
          margin={[20, 20]}
          containerPadding={[10, 10]}
          compactType="vertical"
          preventCollision={false}
        >
          {this.generateDOM()}
        </ResponsiveReactGridLayout>
      </div>
    );
  }
}