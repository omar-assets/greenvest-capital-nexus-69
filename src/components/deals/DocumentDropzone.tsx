import React, { useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface DocumentDropzoneProps {
  onUpload: (params: { file: File; category: string; onProgress?: (progress: number) => void }) => void;
  isUploading: boolean;
}

export interface DocumentDropzoneRef {
  triggerFileSelect: () => void;
}

interface FileWithCategory {
  file: File;
  category: string;
  progress: number;
}

const DOCUMENT_CATEGORIES = [
  'Bank Statement',
  'Tax Return',
  'Driver License',
  'Other'
];

const DocumentDropzone = forwardRef<DocumentDropzoneRef, DocumentDropzoneProps>(({ onUpload, isUploading }, ref) => {
  const [filesToUpload, setFilesToUpload] = useState<FileWithCategory[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      category: 'Other',
      progress: 0
    }));
    setFilesToUpload(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    noClick: false
  });

  useImperativeHandle(ref, () => ({
    triggerFileSelect: open
  }));

  const updateFileCategory = (index: number, category: string) => {
    setFilesToUpload(prev => prev.map((item, i) => 
      i === index ? { ...item, category } : item
    ));
  };

  const removeFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = (index: number) => {
    const fileData = filesToUpload[index];
    if (fileData.category === '') return;
    
    onUpload({ 
      file: fileData.file, 
      category: fileData.category,
      onProgress: (progress) => {
        setFilesToUpload(prev => prev.map((item, i) => 
          i === index ? { ...item, progress } : item
        ));
      }
    });
    removeFile(index);
  };

  const uploadAllFiles = () => {
    filesToUpload.forEach((fileData, index) => {
      if (fileData.category !== '') {
        setTimeout(() => {
          onUpload({ 
            file: fileData.file, 
            category: fileData.category,
            onProgress: (progress) => {
              setFilesToUpload(prev => prev.map((item, i) => 
                i === index ? { ...item, progress } : item
              ));
            }
          });
        }, index * 500); // Stagger uploads
      }
    });
    setFilesToUpload([]);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-900/20' 
            : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-400">Drop the PDF files here...</p>
        ) : (
          <div>
            <p className="text-slate-300 mb-2">Drag & drop PDF files here, or click to select</p>
            <p className="text-sm text-slate-500">Maximum file size: 10MB</p>
          </div>
        )}
      </div>

      {/* Files to upload */}
      {filesToUpload.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-200">Files to Upload ({filesToUpload.length})</h4>
            <Button 
              onClick={uploadAllFiles}
              disabled={isUploading || filesToUpload.some(f => f.category === '')}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Upload All
            </Button>
          </div>
          
          {filesToUpload.map((fileData, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <File className="h-8 w-8 text-red-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-slate-200" title={fileData.file.name}>
                      {fileData.file.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <Select 
                    value={fileData.category} 
                    onValueChange={(value) => updateFileCategory(index, value)}
                  >
                    <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-slate-200">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {DOCUMENT_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category} className="text-slate-200 hover:bg-slate-700">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => uploadFile(index)}
                    disabled={isUploading || fileData.category === ''}
                    className="border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    Upload
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {fileData.progress > 0 && (
                  <Progress value={fileData.progress} className="mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});

DocumentDropzone.displayName = 'DocumentDropzone';

export default DocumentDropzone;
