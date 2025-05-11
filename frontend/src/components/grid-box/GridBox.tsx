// GridBox.tsx (parent component)
import React from 'react';
import TextBox from "../text-box/TextBox";
import ImageBox from "../image-box/ImageBox";

type GridBoxProps = {
  type: 'text' | 'image' | 'other'; // or any other types you may have
  content: string; // content for the box (this can be extended)
};

export function GridBox({ type, content }: GridBoxProps) {
  switch (type) {
    case 'text':
      return <TextBox content={content} />;
    case 'image':
      return <ImageBox content={content} />;
    case 'other':
      return <div>{content}</div>; // fallback box
    default:
      return <div>Invalid box type</div>;
  }
};

