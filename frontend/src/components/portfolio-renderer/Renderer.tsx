import React, { useEffect} from "react";
import { WidthProvider, Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./Renderer.css";
import TextEditor from "../text-editor/TextEditor";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface LayoutItem {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
  aspectRatio?: number;
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
  columnCount?: number;
  onEditingStateChange?: (isEditing: boolean) => void;
}

interface RendererState {
  layouts: { [key: string]: LayoutItem[] };
  currentBreakpoint: string;
  textEditorsEditing: { [key: string]: boolean };
  activeEditorId: string | null;
  items: number;
}

export default class Renderer extends React.PureComponent<RendererProps, RendererState> {
  static defaultProps: RendererProps = {
    className: "layout",
    isEditMode: false,
    isEditing: false,
    contentSchema: [],
    onContentChange: () => {},
    columnCount: 3,
  };

  constructor(props: RendererProps) {
    super(props);
    this.state = {
      layouts: this.generateLayouts(),
      currentBreakpoint: 'lg',
      textEditorsEditing: {},
      activeEditorId: null,
      items: props.contentSchema?.length || 0
    };
  };

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
                w: 10,
                h: 12,
                i: String(Date.now())
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

  getCurrentBreakpoint = () => {
    return this.state.currentBreakpoint;
  };

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
      switch (item.type) {
        case 'text':
          return (
            <div key={item.id} className="grid-item">
              <TextEditor 
                isEditable={this.handleIsEditableChange(item)}
                initialText={item.content}
                isEditing={this.state.textEditorsEditing[item.id] || false}
                onEditingChange={(isEditing) => this.handleEditingChange(item.id, isEditing)}
              />
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
    const { contentSchema = [], columnCount = 3 } = this.props;
    
    // Create a single layout configuration for all breakpoints
    const layout = contentSchema.map(item => item.layout);

    // Use the same layout for all breakpoints
    return {
      lg: layout,
      md: layout,
      sm: layout,
      xs: layout,
      xxs: layout
    };
  }

  render() {
    const columnCount = 5;
    const maxWidth = 1600;
    const rowHeight = maxWidth / 16;
    return (
      <div style={{ width: "100%", height: "100%", minHeight: "500px", maxWidth: `${maxWidth}px`, margin: "0 auto"}}>

        <ResponsiveReactGridLayout
          className={this.props.className}
          layouts={this.state.layouts}
          breakpoints={{ lg: 1600, md: 1200, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: columnCount, md: columnCount, sm: columnCount, xs: columnCount, xxs: columnCount }}
          rowHeight={rowHeight}
          isDraggable={this.props.isEditMode && !Object.values(this.state.textEditorsEditing).some(isEditMode => isEditMode)}
          isResizable={this.props.isEditMode && !Object.values(this.state.textEditorsEditing).some(isEditMode => isEditMode)}
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