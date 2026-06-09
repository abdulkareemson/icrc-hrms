// components/modules/admin/UserDetailActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Power, PowerOff } from "lucide-react";

interface UserDetailActionsProps {
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
}

export function UserDetailActions({
  userId,
  email,
  role: initialRole,
  isActive: initialIsActive,
}: UserDetailActionsProps) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  const hasChanges = role !== initialRole;

  const handleSaveRole = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };
      if (!response.ok || !result.success) {
        toast.error("Failed to update role", { description: result.error });
        return;
      }
      toast.success("Role updated successfully", {
        description: "User sessions have been invalidated. They must re-login.",
      });
      router.refresh();
    } catch {
      toast.error("Connection error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const newStatus = !initialIsActive;
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: newStatus }),
    });
    const result = (await response.json()) as {
      success: boolean;
      error?: string;
    };
    if (!response.ok || !result.success) {
      toast.error("Failed to update status", { description: result.error });
      throw new Error(result.error ?? "Update failed");
    }
    toast.success(newStatus ? "User activated" : "User deactivated", {
      description: newStatus
        ? "The user can now log in."
        : "All sessions terminated. User cannot log in.",
    });
    setShowToggleDialog(false);
    router.refresh();
  };

  const handleDelete = async () => {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = (await response.json()) as {
      success: boolean;
      error?: string;
    };
    if (!response.ok || !result.success) {
      toast.error("Failed to delete user", { description: result.error });
      throw new Error(result.error ?? "Delete failed");
    }
    toast.success("User deleted");
    setShowDeleteDialog(false);
    router.push("/admin/users");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Role selector */}
      <div className="flex items-center gap-2">
        <Select
          value={role}
          onValueChange={(value: string | null) => {
            if (value) setRole(value);
          }}
        >
          <SelectTrigger className="w-[160px]" aria-label="Change role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
            <SelectItem value="EMPLOYEE">Employee</SelectItem>
          </SelectContent>
        </Select>

        {hasChanges && (
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSaveRole()}
            disabled={isSaving}
            className="bg-primary-700 text-white hover:bg-primary-800"
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save
          </Button>
        )}
      </div>

      {/* Toggle active */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowToggleDialog(true)}
        className={
          initialIsActive
            ? "text-warning hover:border-warning/30"
            : "text-success hover:border-success/30"
        }
      >
        {initialIsActive ? (
          <PowerOff className="mr-1.5 h-3.5 w-3.5" />
        ) : (
          <Power className="mr-1.5 h-3.5 w-3.5" />
        )}
        {initialIsActive ? "Deactivate" : "Activate"}
      </Button>

      {/* Delete */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowDeleteDialog(true)}
        className="text-error hover:border-error/30"
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>

      <ConfirmationDialog
        open={showToggleDialog}
        onOpenChange={setShowToggleDialog}
        title={initialIsActive ? "Deactivate User" : "Activate User"}
        description={
          initialIsActive
            ? `This will deactivate "${email}" and terminate all active sessions. The user will not be able to log in.`
            : `This will reactivate "${email}". The user will be able to log in again.`
        }
        confirmLabel={initialIsActive ? "Deactivate" : "Activate"}
        variant={initialIsActive ? "warning" : "default"}
        onConfirm={handleToggleActive}
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete User"
        description={`This will permanently deactivate "${email}" and terminate all sessions. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
