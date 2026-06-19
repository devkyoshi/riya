"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, Trash2, Eye, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { sharingApi, type ShareLink } from "@/lib/api/sharing";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const SCOPE_LABELS: Record<string, string> = {
  serviceRecords: "Service Records",
  documents: "Documents",
  insurancePolicies: "Insurance",
  revenueLicenses: "Revenue Licenses",
  emissionTests: "Emission Tests",
  mileageLog: "Mileage Log",
  timeline: "Timeline",
};

const DEFAULT_SCOPE = {
  serviceRecords: true,
  documents: true,
  insurancePolicies: true,
  revenueLicenses: true,
  emissionTests: true,
  mileageLog: false,
  timeline: true,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  );
}

export function ShareLinksPanel({ vehicleId }: { vehicleId: string }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("7");
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [scope, setScope] = useState<Record<string, boolean>>(DEFAULT_SCOPE);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["share-links", vehicleId],
    queryFn: () => sharingApi.shareLinks.list(vehicleId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      sharingApi.shareLinks.create(vehicleId, {
        label: label.trim() || undefined,
        scope,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        isSingleUse,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["share-links", vehicleId] });
      setShowCreate(false);
      setLabel("");
      setExpiresInDays("7");
      setIsSingleUse(false);
      setScope(DEFAULT_SCOPE);
      toast.success("Share link created");
    },
    onError: () => toast.error("Failed to create share link"),
  });

  const revokeMutation = useMutation({
    mutationFn: (linkId: string) => sharingApi.shareLinks.revoke(vehicleId, linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["share-links", vehicleId] });
      toast.success("Share link revoked");
    },
    onError: () => toast.error("Failed to revoke share link"),
  });

  const shareUrl = (token: string) =>
    `${window.location.origin}/share/${token}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Share Links</h3>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          New Link
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-4">Loading...</div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={<Link2 size={24} />}
          title="No active share links"
          description="Create a scoped link to share your vehicle record with a buyer."
        />
      ) : (
        <ul className="space-y-3">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-start gap-3 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50"
            >
              <Link2 size={16} className="text-brand-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {link.label ?? "Untitled link"}
                  </span>
                  {link.isSingleUse && <Badge variant="warning">Single-use</Badge>}
                  {link.expiresAt && (
                    <Badge variant="neutral">
                      Expires {new Date(link.expiresAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-400 font-mono truncate max-w-xs">
                    {shareUrl(link.token)}
                  </span>
                  <CopyButton text={shareUrl(link.token)} />
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <Eye size={11} />
                  <span>{link.viewCount} view{link.viewCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <button
                onClick={() => revokeMutation.mutate(link.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                title="Revoke link"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Share Link" size="md">
        <div className="space-y-4">
          <Input
            label="Label (optional)"
            placeholder="e.g. For potential buyer"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            label="Expires in (days)"
            type="number"
            min="1"
            max="365"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            description="Leave blank for no expiry"
          />

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visible sections</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SCOPE_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scope[key] ?? false}
                    onChange={(e) => setScope((s) => ({ ...s, [key]: e.target.checked }))}
                    className="rounded border-gray-300 text-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSingleUse}
              onChange={(e) => setIsSingleUse(e.target.checked)}
              className="rounded border-gray-300 text-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Single-use (deactivate after first view)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
              Create Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
