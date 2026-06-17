"use client";

import React, { useCallback, useState } from "react";
import { Upload, CloudUpload, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  "registration_certificate", "insurance_policy", "revenue_license",
  "emission_certificate", "repair_invoice", "other",
];

const selectCls = "w-full rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20";

interface DocumentUploadProps {
  onUpload: (file: File, meta: { documentType: string; title: string; notes?: string }) => Promise<void>;
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [step, setStep] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("other");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); }
  }, [title]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); }
  }, [title]);

  const handleSubmit = async () => {
    if (!file || !title) return;
    setLoading(true);
    try {
      await onUpload(file, { documentType: docType, title, notes: notes || undefined });
      setFile(null); setTitle(""); setNotes(""); setDocType("other"); setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <StepIndicator steps={["Choose File", "Details"]} current={step} variant="dots" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-3xl p-10 text-center transition-colors",
                dragging
                  ? "border-gray-400 bg-gray-50 dark:bg-zinc-800/50"
                  : "border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800/30"
              )}
            >
              <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Upload size={24} className="mx-auto text-gray-700 dark:text-zinc-300 mb-2" />
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{file.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <CloudUpload size={28} className="mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">Drop a file here or <span className="text-gray-900 dark:text-white font-medium">browse</span></p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">PDF, JPG, PNG up to 10 MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Document Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className={selectCls}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>

            <Button onClick={() => setStep(2)} disabled={!file} className="w-full">
              Continue
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="space-y-4"
          >
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Insurance 2024"
              description="A short, memorable name for this document"
            />
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes (optional)"
            />

            <div className="flex items-center gap-3 pt-1">
              <Button variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft size={15} />} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} loading={loading} disabled={!title} className="flex-1">
                Upload
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
