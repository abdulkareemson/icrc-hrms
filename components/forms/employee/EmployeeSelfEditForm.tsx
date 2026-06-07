// components/forms/employee/EmployeeSelfEditForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  employeeSelfUpdateSchema,
  type EmployeeSelfUpdateFormValues,
} from "@/lib/validators/employee.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Phone, CreditCard, Save, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeSelfEditFormProps {
  employeeId: string;
  currentData: {
    phoneNumber: string;
    personalEmail?: string | null;
    address: string;
    bankName?: string | null;
    accountNumber?: string | null;
    bankSortCode?: string | null;
  };
}

function FormField({
  label,
  htmlFor,
  error,
  required = false,
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

export function EmployeeSelfEditForm({
  employeeId,
  currentData,
}: EmployeeSelfEditFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EmployeeSelfUpdateFormValues>({
    resolver: zodResolver(employeeSelfUpdateSchema),
    defaultValues: {
      phoneNumber: currentData.phoneNumber,
      personalEmail: currentData.personalEmail ?? "",
      address: currentData.address,
      bankName: currentData.bankName ?? "",
      accountNumber: currentData.accountNumber ?? "",
      bankSortCode: currentData.bankSortCode ?? "",
    },
  });

  const onSubmit = async (data: EmployeeSelfUpdateFormValues) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/self-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        toast.error("Failed to update profile", {
          description: result.error,
        });
        return;
      }

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Restricted access notice */}
      <div className="flex items-center gap-3 rounded-xl bg-info-light/50 border border-info/10 px-5 py-3">
        <Lock className="h-4 w-4 text-info shrink-0" />
        <p className="text-xs text-info-dark">
          You can update your contact details and bank information. For other
          changes, please contact the HR department.
        </p>
      </div>

      {/* Contact Details */}
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100 pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <Phone className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              Contact Details
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Phone Number"
              htmlFor="phoneNumber"
              error={errors.phoneNumber?.message}
              required
            >
              <Input
                id="phoneNumber"
                placeholder="+234 800 000 0000"
                {...register("phoneNumber")}
              />
            </FormField>
            <FormField
              label="Personal Email"
              htmlFor="personalEmail"
              error={errors.personalEmail?.message}
            >
              <Input
                id="personalEmail"
                type="email"
                placeholder="personal@email.com"
                {...register("personalEmail")}
              />
            </FormField>
            <FormField
              label="Address"
              htmlFor="address"
              error={errors.address?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                id="address"
                placeholder="Residential address"
                {...register("address")}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-neutral-50 to-white border-b border-neutral-100 pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <CreditCard className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              Bank Details
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="Bank Name"
              htmlFor="bankName"
              error={errors.bankName?.message}
            >
              <Input
                id="bankName"
                placeholder="e.g. First Bank of Nigeria"
                {...register("bankName")}
              />
            </FormField>
            <FormField
              label="Account Number"
              htmlFor="accountNumber"
              error={errors.accountNumber?.message}
            >
              <Input
                id="accountNumber"
                maxLength={10}
                placeholder="10-digit number"
                {...register("accountNumber")}
              />
            </FormField>
            <FormField
              label="Sort Code"
              htmlFor="bankSortCode"
              error={errors.bankSortCode?.message}
            >
              <Input
                id="bankSortCode"
                placeholder="Sort code"
                {...register("bankSortCode")}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white px-8 shadow-md shadow-primary-700/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
