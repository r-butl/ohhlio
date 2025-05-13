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
}

interface RendererProps {
  className?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
  items?: number;
  rowHeight?: number;
  onLayoutChange?: (layout: LayoutItem[]) => void;
}

interface RendererState {
  layouts: { [key: string]: LayoutItem[] };
}

/**
 * This example illustrates how to let grid items lay themselves out with a bootstrap-style specification.
 */
export default class Renderer extends React.PureComponent<RendererProps, RendererState> {
  static defaultProps: RendererProps = {
    className: "layout",
    isDraggable: true,
    isResizable: true,
    items: 5,
    rowHeight: 30,
    onLayoutChange: () => {},
  };

  constructor(props: RendererProps) {
    super(props);
    this.state = {
      layouts: this.generateLayouts()
    };
  }

  onLayoutChange = (layout: LayoutItem[]) => {
    this.props.onLayoutChange?.(layout);
  };

  generateDOM() {
    return [...Array(this.props.items)].map((_, i) => (
      <div key={i} className="grid-item">
        <span className="text">Item {i + 1}</span>
      </div>
    ));
  }

  generateLayouts() {
    const { items = 5 } = this.props;
    const breakpoints = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    
    return Object.keys(breakpoints).reduce((memo, breakpoint) => {
      const width = breakpoints[breakpoint as keyof typeof breakpoints];
      const colCount = cols[breakpoint as keyof typeof cols];
      
      memo[breakpoint] = [...Array(items)].map((_, i) => ({
        x: (i * width) % colCount,
        y: Math.floor(i / colCount) * 4,
        w: width,
        h: 4,
        i: String(i)
      }));
      
      return memo;
    }, {} as { [key: string]: LayoutItem[] });
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%", minHeight: "500px", maxWidth: "1600px", margin: "0 auto" }}>
        <ResponsiveReactGridLayout
          className={this.props.className}
          layouts={this.state.layouts}
          breakpoints={{ lg: 1600, md: 1200, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 16, md: 12, sm: 8, xs: 4, xxs: 2 }}
          rowHeight={this.props.rowHeight}
          isDraggable={this.props.isDraggable}
          isResizable={this.props.isResizable}
          onLayoutChange={this.onLayoutChange}
          margin={[30, 30]}
          containerPadding={[10, 10]}
        >
          {this.generateDOM()}
        </ResponsiveReactGridLayout>
      </div>
    );
  }
}