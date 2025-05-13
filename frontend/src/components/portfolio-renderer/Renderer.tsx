import React from "react";
import { WidthProvider, Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./Renderer.css";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface LayoutItem {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
  aspectRatio?: number;
}

interface RendererProps {
  className?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
  items?: number;
  rowHeight?: number;
  onLayoutChange?: (layout: LayoutItem[]) => void;
  columnCount?: number;
}

interface RendererState {
  layouts: { [key: string]: LayoutItem[] };
  currentBreakpoint: string;
}

export default class Renderer extends React.PureComponent<RendererProps, RendererState> {
  static defaultProps: RendererProps = {
    className: "layout",
    isDraggable: true,
    isResizable: true,
    items: 5,
    rowHeight: 30,
    onLayoutChange: () => {},
    columnCount: 3,
  };

  constructor(props: RendererProps) {
    super(props);
    this.state = {
      layouts: this.generateLayouts(),
      currentBreakpoint: 'lg'
    };
  }

  componentDidUpdate(prevProps: RendererProps) {
    if (prevProps.columnCount !== this.props.columnCount) {
      this.setState({ 
        layouts: this.generateLayouts() 
      });
    }
  }

  onLayoutChange = (layout: LayoutItem[]) => {
    this.props.onLayoutChange?.(layout);
  };

  onBreakpointChange = (newBreakpoint: string) => {
    this.setState({ currentBreakpoint: newBreakpoint });
    console.log('Current breakpoint:', newBreakpoint);
  };

  getCurrentBreakpoint = () => {
    return this.state.currentBreakpoint;
  };

  generateDOM() {
    return [...Array(this.props.items)].map((_, i) => (
      <div key={i} className="grid-item">
        <span className="text">Item {i + 1}</span>
      </div>
    ));
  }

  generateLayouts() {
    const { items = 5, columnCount = 3 } = this.props;
    
    // Create a single layout configuration for all breakpoints
    const layout = [...Array(items)].map((_, i) => ({
      x: (i % columnCount) * (12 / columnCount), // Distribute items across columns
      y: Math.floor(i / columnCount) * 4, // Stack items vertically
      w: 12 / columnCount, // Width is total columns (12) divided by column count
      h: 4,
      i: String(i)
    }));

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
    return (
      <div style={{ width: "100%", height: "100%", minHeight: "500px", maxWidth: "1600px", margin: "0 auto" }}>
        <ResponsiveReactGridLayout
          className={this.props.className}
          layouts={this.state.layouts}
          breakpoints={{ lg: 1600, md: 1200, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
          rowHeight={this.props.rowHeight}
          isDraggable={this.props.isDraggable}
          isResizable={this.props.isResizable}
          onLayoutChange={this.onLayoutChange}
          onBreakpointChange={this.onBreakpointChange}
          margin={[30, 30]}
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