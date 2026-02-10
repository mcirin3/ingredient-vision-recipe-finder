'use client';

import React, { useRef, useState } from 'react';
import { FiCamera, FiImage } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE, MESSAGES } from '@/lib/constants';
import { CameraCapture } from './CameraCapture';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onError: (error: string) => void;
}

export default function ImageUploader({ onImageSelect, onError }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      onError(MESSAGES.INVALID_FILE_TYPE);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError(MESSAGES.FILE_TOO_LARGE);
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      onImageSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = (file: File) => {
    if (validateFile(file)) {
      onImageSelect(file);
      setShowCamera(false);
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
        onError={onError}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          Ingredient Vision
        </h1>
        <p className="text-lg text-gray-600">
          Take or upload a photo of your ingredients
        </p>
        <p className="text-sm text-gray-500">
          Get recipe recommendations in seconds
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
        <Button
          onClick={() => setShowCamera(true)}
          variant="warm"
          size="lg"
          className="flex items-center justify-center gap-2 w-48"
        >
          <FiCamera className="w-5 h-5" />
          Take Photo
        </Button>

        <Button
          onClick={handleUploadClick}
          variant="accent"
          size="lg"
          className="flex items-center justify-center gap-2 w-48"
        >
          <FiImage className="w-5 h-5" />
          Upload Image
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="text-xs text-gray-500 text-center max-w-md px-4">
        Supported formats: JPEG, PNG, WebP • Max size: {MAX_FILE_SIZE / 1024 / 1024}MB
      </div>
    </div>
  );
}
