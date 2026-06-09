// components/modules/admin/SystemSettingsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Settings } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedByEmail: string | null;
  updatedAt: string;
}

interface SystemSettingsClientProps {
  configs: ConfigItem[];
}

export function SystemSettingsClient({ configs }: SystemSettingsClientProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(configs.map((c) => [c.key, c.value])),
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const handleSave = async (config: ConfigItem) => {
    const newValue = values[config.key];
    if (newValue === undefined || newValue === config.value) {
      toast.info("No changes to save");
      return;
    }

    setSavingKey(config.key);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          key: config.key,
          value: newValue,
          description: config.description,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.success) {
        toast.error("Failed to save", { description: result.error });
        return;
      }

      toast.success("Setting updated", { description: result.message });
      router.refresh();
    } catch {
      toast.error("Connection error");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="grid gap-4">
      {configs.map((config) => {
        const hasChanged = values[config.key] !== config.value;
        const isSaving = savingKey === config.key;

        return (
          <Card
            key={config.id}
            className="overflow-hidden border-neutral-200 shadow-sm"
          >
            <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100/80">
                  <Settings className="h-4 w-4 text-primary-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 font-mono">
                    {config.key}
                  </p>
                  {config.description && (
                    <p className="mt-0.5 text-xs font-normal text-neutral-500">
                      {config.description}
                    </p>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label
                    htmlFor={`config-${config.key}`}
                    className="text-xs text-neutral-500"
                  >
                    Value
                  </Label>
                  <Input
                    id={`config-${config.key}`}
                    value={values[config.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [config.key]: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSave(config)}
                  disabled={!hasChanged || isSaving}
                  className="bg-primary-700 text-white hover:bg-primary-800"
                >
                  {isSaving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Save
                </Button>
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                Last updated: {formatDateTime(config.updatedAt)}
                {config.updatedByEmail ? ` by ${config.updatedByEmail}` : ""}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
