// TextBox.tsx
import React from 'react';

type TextBoxProps = {
  content: string;
};

export function TextBox ({ content }: TextBoxProps) {
  return <div className="text-box">{content}</div>;
};

export default TextBox;