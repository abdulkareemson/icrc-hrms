// components/forms/document/DocumentUploadForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  uploadDocumentSchema,
  type UploadDocumentInput,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/validators/document.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { toast } from "sonner";
import { ArrowLeft, FileText, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeOption {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  departmentName: string;
}

interface DocumentUploadFormProps {
  employees: EmployeeOption[];
  preselectedEmployeeId?: string;
}

function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function DocumentUploadForm({
  employees,
  preselectedEmployeeId,
}: DocumentUploadFormProps) {
  const router = useRouter();
  const [fileKey, setFileKey] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UploadDocumentInput>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: {
      employeeId: preselectedEmployeeId ?? "",
      documentType: undefined,
      title: "",
      fileKey: "",
      fileSize: 0,
      mimeType: "",
      expiresAt: null,
    },
  });

  const onSubmit = async (data: UploadDocumentInput) => {
    if (!fileKey) {
      toast.error("Please upload a file first");
      return;
    }

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, fileKey }),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { id: string };
        message?: string;
        error?: string;
        details?: Record<string, string[]>;
      };

      if (!response.ok || !result.success) {
        if (result.details) {
          const firstError = Object.values(result.details).flat()[0];
          toast.error("Validation error", {
            description: firstError ?? result.error,
          });
        } else {
          toast.error("Failed to upload document", {
            description: result.error,
          });
        }
        return;
      }

      toast.success("Document uploaded successfully", {
        description: result.message,
      });

      router.push("/documents");
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <FileText className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Document Details
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Upload and categorise the employee document
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Employee selector */}
            <FormField
              label="Employee"
              htmlFor="employeeId"
              error={errors.employeeId?.message}
              required
              className="sm:col-span-2"
            >
              <Select
                defaultValue={preselectedEmployeeId}
                onValueChange={(value: string | null) => {
                  if (value) {
                    setValue("employeeId", value, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger
                  id="employeeId"
                  aria-invalid={!!errors.employeeId}
                >
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <span className="font-medium">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="ml-2 text-neutral-400 text-xs">
                        {emp.staffId} · {emp.departmentName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Document type */}
            <FormField
              label="Document Type"
              htmlFor="documentType"
              error={errors.documentType?.message}
              required
            >
              <Select
                onValueChange={(value: string | null) => {
                  if (value) {
                    setValue(
                      "documentType",
                      value as UploadDocumentInput["documentType"],
                      { shouldValidate: true },
                    );
                  }
                }}
              >
                <SelectTrigger
                  id="documentType"
                  aria-invalid={!!errors.documentType}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FormField>

            {/* Title */}
            <FormField
              label="Document Title"
              htmlFor="title"
              error={errors.title?.message}
              required
            >
              <Input
                id="title"
                placeholder="e.g. Employment Contract 2026"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
            </FormField>

            {/* Expiry date */}
            <FormField
              label="Expiry Date (Optional)"
              htmlFor="expiresAt"
              error={errors.expiresAt?.message}
              className="sm:col-span-2"
            >
              <Input
                id="expiresAt"
                type="datetime-local"
                aria-invalid={!!errors.expiresAt}
                {...register("expiresAt")}
              />
              <p className="text-xs text-neutral-400 mt-1">
                Set for documents like passports, medical certificates, or
                contracts that expire. An alert will be sent 30 days before
                expiry.
              </p>
            </FormField>

            {/* File upload */}
            <div className="sm:col-span-2">
              <FileUpload
                endpoint="document"
                value={fileKey}
                onChange={(key) => {
                  setFileKey(key);
                  setValue("fileKey", key ?? "", { shouldValidate: true });
                  // fileSize and mimeType are set server-side via uploadthing metadata
                  if (key) {
                    setValue("fileSize", 1, { shouldValidate: false });
                    setValue("mimeType", "application/octet-stream", {
                      shouldValidate: false,
                    });
                  }
                }}
                label="Upload Document"
                description="PDF, Word, images, or other document formats"
                maxSizeMB={16}
              />
              {errors.fileKey && (
                <p className="mt-1.5 text-xs text-error" role="alert">
                  {errors.fileKey.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting || !fileKey}
          className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 text-white shadow-md shadow-primary-700/20 hover:from-primary-800 hover:to-primary-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Save Document
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
