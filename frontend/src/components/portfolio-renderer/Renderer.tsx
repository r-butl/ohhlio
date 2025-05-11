import React, { useEffect, useState } from 'react';
import { LayoutNode, SectionNode, BlockNode, ContentNode, TextBlockNode, ImageNode } from './render-layout-schema';
import { GridBox } from '../grid-box/GridBox'; // Import GridBox to render content inside blocks
import TextBox from '../text-box/TextBox';
import ImageBox from '../image-box/ImageBox';

interface RendererProps {
  jsonString: string; // JSON string representing the layout schema
}

// The component for rendering the layout
export function Renderer( { jsonString }: RendererProps) {
  const [layoutData, setLayoutData] = useState<LayoutNode | null>(null);

  useEffect(() => {
    // Parse the JSON schema string to an object
    const layout = JSON.parse(jsonString) as LayoutNode;
    setLayoutData(layout);
  }, [jsonString]);

  if (!layoutData) {
    return <div>Loading...</div>;
  }

  // Render grid based on the layout schema
  const renderBlocks = (blocks: BlockNode[]) => {
    return blocks.map((block) => {
      const { colStart, rowStart, colSpan, rowSpan } = block.props;
      const content = block.children; // Either a TextBlockNode or ImageNode

      // Render the content based on its type
      const renderContent = (content: ContentNode) => {
        switch (content.type) {
          case 'TextBlock':
            return <TextBox content={content.props.text} />;
          case 'Image':
            return <ImageBox content={content.props.src} />;
          default:
            return null;
        }
      };

      return (
        <div
          key={block.id}
          style={{
            gridColumnStart: colStart,
            gridRowStart: rowStart,
            gridColumnEnd: `span ${colSpan}`,
            gridRowEnd: `span ${rowSpan}`,
          }}
        >
          {renderContent(content)}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${(layoutData as SectionNode).props.columns}, 1fr)`,
        gap: `${(layoutData as SectionNode).props.gap}px`,
      }}
    >
      {renderBlocks((layoutData as SectionNode).children)}
    </div>
  );
}

export default Renderer;