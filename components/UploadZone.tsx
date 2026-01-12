'use client';

import { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { XIcon } from './icons/XIcon';

const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/pdf', // .pdf
];

const ACCEPTED_EXTENSIONS = ['.docx', '.doc', '.pdf'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

type UploadZoneProps = {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
};

export function UploadZone({ onFileSelect, isUploading, uploadProgress }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return `Invalid file type. Please upload a .docx, .doc, or .pdf file.`;
    }

    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(extension)) {
      return `Invalid file type. Please upload a .docx, .doc, or .pdf file.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 25MB.`;
    }

    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-8
          transition-all duration-200 ease-out
          ${isDragOver 
            ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.02]' 
            : selectedFile
              ? 'border-[var(--success)] bg-[var(--success-bg)]'
              : error
                ? 'border-[var(--error)] bg-[var(--error-bg)]'
                : 'border-[var(--border)] bg-[var(--background-subtle)] hover:border-[var(--neutral-400)] hover:bg-[var(--background-muted)]'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={176}
                  strokeDashoffset={176 - (176 * (uploadProgress || 0)) / 100}
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                {uploadProgress || 0}%
              </span>
            </div>
            <p className="text-sm text-[var(--neutral-600)]">Uploading...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10">
              <DocumentIcon className="h-8 w-8 text-[var(--success)]" />
            </div>
            <div className="text-center">
              <p className="font-medium text-[var(--foreground)]">{selectedFile.name}</p>
              <p className="text-sm text-[var(--neutral-500)]">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-sm text-[var(--neutral-600)] hover:bg-[var(--background-muted)] transition-colors"
            >
              <XIcon className="h-4 w-4" />
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`
              flex h-16 w-16 items-center justify-center rounded-full
              transition-colors duration-200
              ${isDragOver ? 'bg-[var(--accent)]/10' : 'bg-[var(--background-muted)]'}
            `}>
              <UploadIcon className={`
                h-8 w-8 transition-colors duration-200
                ${isDragOver ? 'text-[var(--accent)]' : 'text-[var(--neutral-400)]'}
              `} />
            </div>
            <div className="text-center">
              <p className="font-medium text-[var(--foreground)]">
                {isDragOver ? 'Drop your file here' : 'Drag & drop your SOW document'}
              </p>
              <p className="mt-1 text-sm text-[var(--neutral-500)]">
                or <span className="text-[var(--accent)] font-medium">browse</span> to select
              </p>
              <p className="mt-3 text-xs text-[var(--neutral-400)]">
                Supports .docx, .doc, and .pdf (max 25MB)
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-[var(--error)]/10 p-3 text-center">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
