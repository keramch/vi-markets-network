
import React, { useState, useCallback } from 'react';
import heic2any from 'heic2any';
import { XIcon } from './Icons';

interface ImageUploaderProps {
  id: string;
  label: string;
  onFilesChanged: (files: File[]) => void;
  maxFiles?: number;
  maxSizeKB?: number;
  allowedTypes?: string[];
  aspectRatio?: string;
  maxDimension?: number;
}

async function resizeToWebP(file: File, maxDimension: number): Promise<File> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w <= maxDimension && h <= maxDimension) {
        resolve(file);
        return;
      }

      const scale = maxDimension / Math.max(w, h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const type = blob.type || 'image/webp';
          const ext = type === 'image/webp' ? '.webp' : type === 'image/jpeg' ? '.jpg' : '.png';
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}${ext}`, { type }));
        },
        'image/webp',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  id,
  label,
  onFilesChanged,
  maxFiles = 1,
  maxSizeKB = 5120,
  allowedTypes = ['image/jpeg', 'image/png'],
  aspectRatio,
  maxDimension = 1600,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const validateFile = (file: File): string | null => {
    const checkTypes = allowedTypes.includes('image/jpeg')
      ? [...allowedTypes, 'image/webp']
      : [...allowedTypes, 'image/jpeg', 'image/webp'];
    if (!checkTypes.includes(file.type)) {
      return `Invalid file type. Accepted: JPG, PNG, WebP, HEIC, AVIF.`;
    }
    if (file.size > maxSizeKB * 1024) {
      return `File size exceeds ${maxSizeKB / 1024}MB.`;
    }
    return null;
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(event.target.files || []);
    if (rawFiles.length === 0) return;

    setProcessing(true);
    const processed: File[] = [];
    const processingErrors: string[] = [];

    for (const file of rawFiles) {
      // Step 1: convert HEIC/HEIF to JPEG
      let converted = file;
      const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);
      if (isHeic) {
        try {
          const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
          const blob = Array.isArray(result) ? result[0] : result;
          converted = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        } catch {
          processingErrors.push(`${file.name}: Could not convert HEIC image. Please try exporting as JPEG first.`);
          continue;
        }
      }

      // Step 2: resize and convert to WebP if image exceeds maxDimension
      processed.push(await resizeToWebP(converted, maxDimension));
    }

    setProcessing(false);

    const currentFiles: File[] = maxFiles === 1 ? [] : [...files];
    const currentErrors: string[] = [...processingErrors];

    processed.forEach((file: File) => {
      if (currentFiles.length >= maxFiles) {
        currentErrors.push(`You can only upload a maximum of ${maxFiles} files.`);
        return;
      }
      const error = validateFile(file);
      if (error) {
        currentErrors.push(`${file.name}: ${error}`);
      } else {
        currentFiles.push(file);
      }
    });

    setErrors(currentErrors);

    previews.forEach(URL.revokeObjectURL);

    setFiles(currentFiles);
    setPreviews(currentFiles.map(f => URL.createObjectURL(f)));
    onFilesChanged(currentFiles);

    event.target.value = '';
  }, [files, previews, maxFiles, allowedTypes, maxSizeKB, maxDimension, onFilesChanged]);

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);

    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onFilesChanged(updatedFiles);
  };

  const acceptAttr = [
    ...allowedTypes,
    ...(allowedTypes.some(t => t.includes('heic') || t.includes('heif')) ? ['.heic', '.heif'] : []),
  ].join(',');

  const formatsList = 'JPG, PNG, WebP, HEIC, AVIF';

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>

      <div className="flex justify-center px-6 py-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-3 text-center">
          <svg
            className="mx-auto h-10 w-10 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div>
            <label
              htmlFor={id}
              className={`inline-flex items-center justify-center px-5 py-3 min-h-[3rem] text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors ${
                processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-brand-blue hover:bg-brand-blue/90'
              }`}
            >
              {processing ? 'Preparing…' : maxFiles > 1 ? 'Choose Photos' : 'Choose Image'}
              <input
                id={id}
                name={id}
                type="file"
                className="sr-only"
                multiple={maxFiles > 1}
                accept={acceptAttr}
                onChange={handleFileChange}
                disabled={processing}
                aria-describedby={`${id}-description`}
              />
            </label>
            {processing && (
              <p className="mt-1 text-xs text-gray-500">Preparing image…</p>
            )}
            {!processing && (
              <p className="mt-2 text-xs text-gray-400">or drag and drop</p>
            )}
          </div>

          <p className="text-xs text-gray-500" id={`${id}-description`}>
            {formatsList} · up to {maxSizeKB / 1024}MB
            {aspectRatio && ` · ${aspectRatio} ratio recommended`}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-2 text-sm text-red-600 space-y-1">
          {errors.map((error, i) => <p key={i}>{error}</p>)}
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {previews.map((src, index) => (
            <div key={index} className="relative">
              <img src={src} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 leading-none hover:bg-opacity-75"
                aria-label={`Remove image ${index + 1}`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
