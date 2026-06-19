"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { sharingApi, type CoOwner } from "@/lib/api/sharing";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export function CoOwnersPanel({ vehicleId }: { vehicleId: string }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  const { data: coOwners = [], isLoading } = useQuery({
    queryKey: ["co-owners", vehicleId],
    queryFn: () => sharingApi.coOwners.list(vehicleId),
  });

  const addMutation = useMutation({
    mutationFn: () => sharingApi.coOwners.add(vehicleId, { email: email.trim(), canEdit }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["co-owners", vehicleId] });
      setShowAdd(false);
      setEmail("");
      setCanEdit(false);
      toast.success("Co-owner added");
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? "Failed to add co-owner"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => sharingApi.coOwners.remove(vehicleId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["co-owners", vehicleId] });
      toast.success("Co-owner removed");
    },
    onError: () => toast.error("Failed to remove co-owner"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Co-Owners</h3>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-4">Loading...</div>
      ) : coOwners.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No co-owners"
          description="Add family members or co-owners who share access to this vehicle."
        />
      ) : (
        <ul className="space-y-2">
          {coOwners.map((co) => (
            <li
              key={co.userId}
              className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-sm shrink-0">
                {co.user?.fullName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {co.user?.fullName ?? "Unknown"}
                </p>
                <p className="text-xs text-gray-400 truncate">{co.user?.email}</p>
              </div>
              <Badge variant={co.canEdit ? "info" : "neutral"}>
                {co.canEdit ? "Can edit" : "Read only"}
              </Badge>
              <button
                onClick={() => removeMutation.mutate(co.userId)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove co-owner"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Co-Owner" size="sm">
        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            description="They must already have a Riya account"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={canEdit}
              onChange={(e) => setCanEdit(e.target.checked)}
              className="rounded border-gray-300 text-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Allow editing</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={addMutation.isPending} onClick={() => addMutation.mutate()}>
              Add Co-Owner
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
