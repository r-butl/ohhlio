// ImageBox.tsx
import React from 'react';
import './ImageBox.css'; 

type ImageBoxProps = {
  content: string; // Assume this is a URL for the image
};

export function ImageBox({ content }: ImageBoxProps){
  return <img src={content} alt="Image box" className="image-box"/>;
};

export default ImageBox;