'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiCamera } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export function CameraCapture({ onCapture, onCancel, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraReady(true);
      }
    } catch {
      onError('Unable to access camera. Please check permissions.');
      onCancel();
    }
  }, [onCancel, onError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }, [stream]);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          stopCamera();
          onCapture(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-2xl mx-auto px-4">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-4 w-full max-w-md">
        <Button
          onClick={handleCancel}
          variant="secondary"
          size="lg"
          fullWidth
        >
          Cancel
        </Button>
        <Button
          onClick={capturePhoto}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isCameraReady}
          className="flex items-center justify-center gap-2"
        >
          <FiCamera className="w-6 h-6" />
          Capture Photo
        </Button>
      </div>
    </div>
  );
}
