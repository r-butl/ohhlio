import React, { useState, useRef } from 'react';
import { useEditorStore } from '@/context/EditorStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileImage } from "lucide-react";

const FileUploadBox: React.FC = () => {
    const fileUploadSelected = useEditorStore(state => state.fileUploadSelected);
    const setFileUploadSelected = useEditorStore(state => state.setFileUploadSelected);
    const addImage = useEditorStore(state => state.addImage);
    
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = () => {
        if (files.length === 0) return;
        
        setUploading(true);

        // Add an image item for each selected file
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const imageData = reader.result as string;
                addImage(imageData);
            };
            reader.readAsDataURL(file);
        });
        
        // Close the dialog
        setFileUploadSelected(false);
        setFiles([]);
        setUploading(false);
    };

    return (
        <Dialog open={fileUploadSelected} onOpenChange={setFileUploadSelected}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>File Upload</DialogTitle>
                    <DialogDescription>
                        Upload multiple images to add to your project.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    {/* File Selection Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Button 
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="mb-2"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Select Files
                        </Button>
                        <p className="text-sm text-gray-500">
                            Drag and drop files here, or click to select
                        </p>
                    </div>

                    {/* Selected Files */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium">Selected Files ({files.length})</h4>
                            <div className="max-h-48 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-2">
                                    {files.map((file, index) => (
                                        <Card key={index} className="p-2">
                                            <CardContent className="p-2 flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <FileImage className="w-4 h-4" />
                                                    <span className="text-sm truncate">{file.name}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            <Button 
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full"
                            >
                                {uploading ? 'Adding...' : `Add ${files.length} Images to Grid`}
                            </Button>
                        </div>
                    )}


                </div>
            </DialogContent>
        </Dialog>
    )
};

export default FileUploadBox;