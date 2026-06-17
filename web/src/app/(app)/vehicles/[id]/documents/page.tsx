"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { documentsApi } from "@/lib/api/documents";

export default function DocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", id],
    queryFn:  () => documentsApi.list(id),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => documentsApi.delete(id, docId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["documents", id] });
      toast.success("Document deleted");
    },
    onError: () => toast.error("Failed to delete document"),
  });

  const handleUpload = async (file: File, meta: { documentType: string; title: string; notes?: string }) => {
    await documentsApi.upload(id, file, meta);
    qc.invalidateQueries({ queryKey: ["documents", id] });
    setModalOpen(false);
    toast.success("Document uploaded");
  };

  return (
    <div>
      <Link href={`/vehicles/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors">
        <ArrowLeft size={15} /> Back to Vehicle
      </Link>
      <PageHeader
        title="Documents"
        subtitle="Upload and manage vehicle documents"
        action={<Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Upload</Button>}
      />

      {isLoading ? (
        <PageSpinner />
      ) : docs && docs.length > 0 ? (
        <motion.div className="space-y-3">
          <AnimatePresence>
            {docs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={(docId) => deleteMutation.mutate(docId)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          icon={<FileText size={28} className="text-brand-400" />}
          title="No documents yet"
          description="Upload your vehicle's registration certificate, insurance policy, or any other document"
          action={
            <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Upload First Document
            </Button>
          }
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload Document" size="lg">
        <DocumentUpload onUpload={handleUpload} />
      </Modal>
    </div>
  );
}
