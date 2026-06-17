"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Wrench, Shield, Receipt, Wind } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { recordsApi } from "@/lib/api/records";
import { formatDate, formatCurrency } from "@/lib/utils";

type RecordTab = "service" | "insurance" | "revenue" | "emission";

const serviceSchema = z.object({
  serviceDate:  z.string().min(1, "Required"),
  mileageKm:    z.coerce.number().int().min(0).optional(),
  garageName:   z.string().optional(),
  description:  z.string().min(1, "Required"),
  totalCost:    z.string().optional(),
  currency:     z.string().default("LKR"),
});

const insuranceSchema = z.object({
  provider:     z.string().min(1, "Required"),
  policyNumber: z.string().min(1, "Required"),
  coverageType: z.string().min(1, "Required"),
  startDate:    z.string().min(1, "Required"),
  endDate:      z.string().min(1, "Required"),
  premiumLkr:   z.string().optional(),
});

const revenueSchema = z.object({
  issueDate:    z.string().min(1, "Required"),
  expiryDate:   z.string().min(1, "Required"),
  feeAmountLkr: z.string().optional(),
});

const emissionSchema = z.object({
  testDate:   z.string().min(1, "Required"),
  expiryDate: z.string().optional(),
  testCenter: z.string().optional(),
  result:     z.enum(["pass", "fail", "conditional"]),
  notes:      z.string().optional(),
});

const tabConfig = [
  { key: "service" as const,   label: "Service",   icon: Wrench },
  { key: "insurance" as const, label: "Insurance", icon: Shield },
  { key: "revenue" as const,   label: "Revenue",   icon: Receipt },
  { key: "emission" as const,  label: "Emission",  icon: Wind },
];

const cardCls = "bg-white dark:bg-zinc-800 rounded-3xl shadow-card border border-gray-100 dark:border-zinc-700 p-4 mb-3";
const selectCls = "w-full rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/30";

export default function RecordsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<RecordTab>("service");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: serviceRecords, isLoading: loadingSvc } = useQuery({
    queryKey: ["records", "service", id],
    queryFn: () => recordsApi.service.list(id),
  });
  const { data: insurance, isLoading: loadingIns } = useQuery({
    queryKey: ["records", "insurance", id],
    queryFn: () => recordsApi.insurance.list(id),
  });
  const { data: revenue, isLoading: loadingRev } = useQuery({
    queryKey: ["records", "revenue", id],
    queryFn: () => recordsApi.revenue.list(id),
  });
  const { data: emission, isLoading: loadingEmit } = useQuery({
    queryKey: ["records", "emission", id],
    queryFn: () => recordsApi.emission.list(id),
  });

  const activeTab = tabConfig.find(t => t.key === tab)!;

  const closeModal = () => setModalOpen(false);
  const onSuccess = (key: string, label: string) => {
    closeModal();
    qc.invalidateQueries({ queryKey: ["records", key, id] });
    toast.success(`${label} record added`);
  };

  return (
    <div>
      <Link href={`/vehicles/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors">
        <ArrowLeft size={15} /> Back to Vehicle
      </Link>
      <PageHeader
        title="Records"
        subtitle="Service history, insurance and compliance records"
        action={<Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Add Record</Button>}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {tabConfig.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setModalOpen(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                : "bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Service Records */}
      {tab === "service" && (
        loadingSvc ? <PageSpinner /> :
        (serviceRecords ?? []).length === 0 ? (
          <EmptyState icon={<Wrench size={24} className="text-blue-400" />} title="No service records" description="Log your first service to start tracking maintenance history" action={<Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Add Service Record</Button>} />
        ) : (
          <AnimatePresence>
            {(serviceRecords ?? []).map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={cardCls}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{r.description}</p>
                    {r.garageName && <p className="text-xs text-gray-400 dark:text-zinc-500">{r.garageName}</p>}
                  </div>
                  {r.totalCost && <Badge variant="neutral">{formatCurrency(r.totalCost, r.currency)}</Badge>}
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{formatDate(r.serviceDate)} {r.mileageKm ? `· ${r.mileageKm.toLocaleString()} km` : ""}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )
      )}

      {/* Insurance */}
      {tab === "insurance" && (
        loadingIns ? <PageSpinner /> :
        (insurance ?? []).length === 0 ? (
          <EmptyState icon={<Shield size={24} className="text-green-400" />} title="No insurance records" description="Keep track of your active policies and renewal dates" action={<Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Add Insurance</Button>} />
        ) : (
          <AnimatePresence>
            {(insurance ?? []).map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={cardCls}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{r.provider}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{r.policyNumber} · {r.coverageType}</p>
                  </div>
                  <Badge variant="success">{formatDate(r.endDate)}</Badge>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{formatDate(r.startDate)} → {formatDate(r.endDate)}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )
      )}

      {/* Revenue */}
      {tab === "revenue" && (
        loadingRev ? <PageSpinner /> :
        (revenue ?? []).length === 0 ? (
          <EmptyState icon={<Receipt size={24} className="text-amber-400" />} title="No revenue licenses" description="Add your annual revenue license to track renewal dates" action={<Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Add Revenue License</Button>} />
        ) : (
          <AnimatePresence>
            {(revenue ?? []).map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={cardCls}>
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Revenue License</p>
                  {r.feeAmountLkr && <Badge variant="neutral">{formatCurrency(r.feeAmountLkr)}</Badge>}
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">Expires {formatDate(r.expiryDate)}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )
      )}

      {/* Emission */}
      {tab === "emission" && (
        loadingEmit ? <PageSpinner /> :
        (emission ?? []).length === 0 ? (
          <EmptyState icon={<Wind size={24} className="text-teal-400" />} title="No emission tests" description="Log emission test results and track certificate expiry" action={<Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Add Emission Test</Button>} />
        ) : (
          <AnimatePresence>
            {(emission ?? []).map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={cardCls}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Emission Test</p>
                    {r.testCenter && <p className="text-xs text-gray-400 dark:text-zinc-500">{r.testCenter}</p>}
                  </div>
                  <Badge variant={r.result === "pass" ? "success" : "danger"}>{r.result}</Badge>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{formatDate(r.testDate)}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )
      )}

      {/* Add Record Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={`Add ${activeTab.label} Record`}
        size="md"
      >
        {tab === "service" && (
          <ServiceRecordForm
            vehicleId={id}
            onSuccess={() => onSuccess("service", "Service")}
          />
        )}
        {tab === "insurance" && (
          <InsuranceForm
            vehicleId={id}
            onSuccess={() => onSuccess("insurance", "Insurance")}
          />
        )}
        {tab === "revenue" && (
          <RevenueForm
            vehicleId={id}
            onSuccess={() => onSuccess("revenue", "Revenue license")}
          />
        )}
        {tab === "emission" && (
          <EmissionForm
            vehicleId={id}
            onSuccess={() => onSuccess("emission", "Emission test")}
          />
        )}
      </Modal>
    </div>
  );
}

/* ─── 2-step: Service Record ─────────────────────────────── */
function ServiceRecordForm({ vehicleId, onSuccess }: { vehicleId: string; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(serviceSchema),
  });

  const goNext = async () => {
    const ok = await trigger(["serviceDate", "mileageKm", "garageName"]);
    if (ok) setStep(2);
  };

  return (
    <form onSubmit={handleSubmit(async (data) => {
      try {
        await recordsApi.service.create(vehicleId, data as any);
        onSuccess();
      } catch {
        toast.error("Failed to add service record");
      }
    })} className="space-y-5">
      <StepIndicator steps={["When & Where", "Details"]} current={step} variant="dots" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }} className="space-y-4">
            <Input label="Service Date" type="date" {...register("serviceDate")} error={errors.serviceDate?.message as string} />
            <Input label="Mileage (km)" type="number" {...register("mileageKm")} placeholder="50 000" />
            <Input label="Garage Name" {...register("garageName")} placeholder="City Garage" />
            <Button type="button" onClick={goNext} className="w-full">Continue</Button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }} className="space-y-4">
            <Input label="Description" {...register("description")} error={errors.description?.message as string} placeholder="Oil change, filter replacement…" />
            <Input label="Total Cost" {...register("totalCost")} placeholder="8 500.00" />
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">Add Record</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

/* ─── 2-step: Insurance ──────────────────────────────────── */
function InsuranceForm({ vehicleId, onSuccess }: { vehicleId: string; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(insuranceSchema),
  });

  const goNext = async () => {
    const ok = await trigger(["provider", "policyNumber", "coverageType"]);
    if (ok) setStep(2);
  };

  return (
    <form onSubmit={handleSubmit(async (data) => {
      try {
        await recordsApi.insurance.create(vehicleId, data as any);
        onSuccess();
      } catch {
        toast.error("Failed to add insurance record");
      }
    })} className="space-y-5">
      <StepIndicator steps={["Policy Info", "Dates & Cost"]} current={step} variant="dots" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="i1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }} className="space-y-4">
            <Input label="Provider" {...register("provider")} error={errors.provider?.message as string} placeholder="Ceylinco Insurance" />
            <Input label="Policy Number" {...register("policyNumber")} error={errors.policyNumber?.message as string} />
            <Input label="Coverage Type" {...register("coverageType")} error={errors.coverageType?.message as string} placeholder="Comprehensive" />
            <Button type="button" onClick={goNext} className="w-full">Continue</Button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="i2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }} className="space-y-4">
            <Input label="Start Date" type="date" {...register("startDate")} error={errors.startDate?.message as string} />
            <Input label="End Date" type="date" {...register("endDate")} error={errors.endDate?.message as string} />
            <Input label="Premium (LKR)" {...register("premiumLkr")} placeholder="45 000.00" />
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">Add Insurance</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

/* ─── Single screen: Revenue License ────────────────────── */
function RevenueForm({ vehicleId, onSuccess }: { vehicleId: string; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(revenueSchema) });
  return (
    <form onSubmit={handleSubmit(async (data) => {
      try {
        await recordsApi.revenue.create(vehicleId, data as any);
        onSuccess();
      } catch {
        toast.error("Failed to add revenue license");
      }
    })} className="space-y-4">
      <Input label="Issue Date" type="date" {...register("issueDate")} error={errors.issueDate?.message as string} />
      <Input label="Expiry Date" type="date" {...register("expiryDate")} error={errors.expiryDate?.message as string} />
      <Input label="Fee Amount (LKR)" {...register("feeAmountLkr")} placeholder="5 000.00" />
      <Button type="submit" loading={isSubmitting} className="w-full">Add Revenue License</Button>
    </form>
  );
}

/* ─── Single screen: Emission Test ──────────────────────── */
function EmissionForm({ vehicleId, onSuccess }: { vehicleId: string; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(emissionSchema),
    defaultValues: { result: "pass" },
  });
  return (
    <form onSubmit={handleSubmit(async (data) => {
      try {
        await recordsApi.emission.create(vehicleId, data as any);
        onSuccess();
      } catch {
        toast.error("Failed to add emission test");
      }
    })} className="space-y-4">
      <Input label="Test Date" type="date" {...register("testDate")} />
      <Input label="Expiry Date" type="date" {...register("expiryDate")} />
      <Input label="Test Center" {...register("testCenter")} placeholder="DIMO" />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Result</label>
        <select {...register("result")} className={selectCls}>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="conditional">Conditional</option>
        </select>
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">Add Emission Test</Button>
    </form>
  );
}
