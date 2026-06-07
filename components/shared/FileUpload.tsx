// components/shared/FileUpload.tsx
"use client";

import { useState, useCallback } from "react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { cn, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, FileText, ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  endpoint: "profilePhoto" | "document" | "cv";
  value?: string | null;
  onChange: (fileKey: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  endpoint,
  value,
  onChange,
  accept,
  maxSizeMB = 4,
  label = "Upload file",
  description,
  className,
  disabled = false,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      const file = res[0];
      if (file) {
        onChange(file.key);
        setFileName(file.name);
        toast.success("File uploaded successfully");
      }
    },
    onUploadError: (error) => {
      toast.error("Upload failed", {
        description: error.message || "Please try again",
      });
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file) return;

      // Client-side size check
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error("File too large", {
          description: `Maximum file size is ${maxSizeMB}MB. Your file is ${formatFileSize(file.size)}.`,
        });
        return;
      }

      setUploadProgress(0);
      await startUpload([file]);
    },
    [maxSizeMB, startUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!disabled && !isUploading) {
        void handleFileSelect(e.dataTransfer.files);
      }
    },
    [disabled, isUploading, handleFileSelect],
  );

  const handleRemove = () => {
    onChange(null);
    setFileName(null);
    setUploadProgress(0);
  };

  // File is uploaded
  if (value && !isUploading) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <p className="text-sm font-medium text-neutral-700">{label}</p>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success-light/30 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-light">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {fileName ?? "File uploaded"}
            </p>
            <p className="text-xs text-neutral-500">Upload complete</p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 text-neutral-400 hover:text-error"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium text-neutral-700">{label}</p>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-all duration-200",
          dragOver
            ? "border-primary-500 bg-primary-50/50 scale-[1.01]"
            : "border-neutral-300 bg-neutral-50/50 hover:border-primary-400 hover:bg-primary-50/30",
          (disabled || isUploading) && "opacity-60 cursor-not-allowed",
          !disabled && !isUploading && "cursor-pointer",
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <div className="w-48">
              <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 mb-3">
              {endpoint === "profilePhoto" ? (
                <ImageIcon className="h-6 w-6 text-primary-600" />
              ) : (
                <FileText className="h-6 w-6 text-primary-600" />
              )}
            </div>
            <div className="text-center">
              <label className="cursor-pointer">
                <span className="text-sm font-semibold text-primary-700 hover:text-primary-800">
                  Click to upload
                </span>
                <span className="text-sm text-neutral-500">
                  {" "}
                  or drag and drop
                </span>
                <input
                  type="file"
                  className="sr-only"
                  accept={accept}
                  disabled={disabled || isUploading}
                  onChange={(e) => void handleFileSelect(e.target.files)}
                />
              </label>
            </div>
            {description && (
              <p className="mt-1.5 text-xs text-neutral-400">{description}</p>
            )}
            <p className="mt-1 text-[11px] text-neutral-400">
              Max {maxSizeMB}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
