"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Plus, CheckCircle, AlertCircle, Wrench, Shield } from "lucide-react";
import { toast } from "sonner";
import { partnersApi, type BusinessAccount } from "@/lib/api/partners";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageSpinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [type, setType] = useState<"garage" | "insurer" | "dealer">("garage");
  const [form, setForm] = useState({
    businessName: "", registrationNumber: "", address: "", contactPhone: "", contactEmail: "",
  });

  const mutation = useMutation({
    mutationFn: () => partnersApi.register({ type, ...form }),
    onSuccess: () => { toast.success("Business account registered!"); onSuccess(); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Registration failed"),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business type</label>
        <div className="grid grid-cols-3 gap-2">
          {(["garage", "insurer", "dealer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`p-3 rounded-2xl border text-sm font-medium transition-all capitalize ${
                type === t
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
                  : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <Input label="Business name" required value={form.businessName} onChange={set("businessName")} placeholder="e.g. Super Fix Garage" />
      <Input label="Registration number" value={form.registrationNumber} onChange={set("registrationNumber")} placeholder="Optional" />
      <Input label="Address" value={form.address} onChange={set("address")} placeholder="Street, City" />
      <Input label="Contact phone" value={form.contactPhone} onChange={set("contactPhone")} placeholder="+94 77 000 0000" />
      <Input label="Contact email" type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="info@business.lk" />
      <Button
        className="w-full"
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
        disabled={!form.businessName}
      >
        Register
      </Button>
    </div>
  );
}

function SubmitServiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ vehiclePlate: "", serviceDate: "", mileageKm: "", description: "", totalCost: "" });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => partnersApi.submitServiceRecord({
      vehiclePlate: form.vehiclePlate,
      serviceDate: form.serviceDate,
      mileageKm: Number(form.mileageKm),
      description: form.description,
      totalCost: form.totalCost || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-submissions"] });
      toast.success("Service record submitted");
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Submission failed"),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="Submit Service Record" size="md">
      <div className="space-y-3">
        <Input label="Vehicle plate number" value={form.vehiclePlate} onChange={set("vehiclePlate")} placeholder="e.g. CAB1234" />
        <Input label="Service date" type="date" value={form.serviceDate} onChange={set("serviceDate")} />
        <Input label="Mileage (km)" type="number" value={form.mileageKm} onChange={set("mileageKm")} />
        <Input label="Description" value={form.description} onChange={set("description")} placeholder="Oil change, brake service..." />
        <Input label="Total cost (LKR)" value={form.totalCost} onChange={set("totalCost")} placeholder="Optional" />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Submit</Button>
        </div>
      </div>
    </Modal>
  );
}

function SubmitInsuranceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ vehiclePlate: "", policyNumber: "", coverageType: "", startDate: "", endDate: "", premiumLkr: "" });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => partnersApi.submitInsurance({
      vehiclePlate: form.vehiclePlate,
      policyNumber: form.policyNumber,
      coverageType: form.coverageType || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      premiumLkr: form.premiumLkr || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-submissions"] });
      toast.success("Insurance policy submitted");
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Submission failed"),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="Submit Insurance Policy" size="md">
      <div className="space-y-3">
        <Input label="Vehicle plate number" value={form.vehiclePlate} onChange={set("vehiclePlate")} placeholder="e.g. CAB1234" />
        <Input label="Policy number" value={form.policyNumber} onChange={set("policyNumber")} />
        <Input label="Coverage type" value={form.coverageType} onChange={set("coverageType")} placeholder="e.g. Comprehensive" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" value={form.startDate} onChange={set("startDate")} />
          <Input label="End date" type="date" value={form.endDate} onChange={set("endDate")} />
        </div>
        <Input label="Premium (LKR)" value={form.premiumLkr} onChange={set("premiumLkr")} placeholder="Optional" />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>Submit</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function PartnerPage() {
  const qc = useQueryClient();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  const { data: business, isLoading, isError } = useQuery({
    queryKey: ["partner-profile"],
    queryFn: () => partnersApi.getProfile(),
    retry: false,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["partner-submissions"],
    queryFn: () => partnersApi.listSubmissions(),
    enabled: !!business,
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader title="Partner Portal" subtitle="Garage, insurer, and dealer integrations" />

      {isError || !business ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 size={18} className="text-brand-500" />
                Register Your Business
              </CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                Register as a garage, insurer, or dealer to submit verified records directly to vehicle owners on Riya.
              </p>
              <RegisterForm onSuccess={() => qc.invalidateQueries({ queryKey: ["partner-profile"] })} />
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Profile card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 size={18} className="text-brand-500" />
                  {business.businessName}
                  {business.isVerified ? (
                    <Badge variant="success" className="ml-2">Verified</Badge>
                  ) : (
                    <Badge variant="warning" className="ml-2">Pending verification</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-5 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">Type</span><p className="font-medium capitalize">{business.type}</p></div>
                {business.registrationNumber && <div><span className="text-gray-400">Registration</span><p className="font-medium">{business.registrationNumber}</p></div>}
                {business.contactPhone && <div><span className="text-gray-400">Phone</span><p className="font-medium">{business.contactPhone}</p></div>}
                {business.contactEmail && <div><span className="text-gray-400">Email</span><p className="font-medium">{business.contactEmail}</p></div>}
                {business.address && <div className="col-span-2"><span className="text-gray-400">Address</span><p className="font-medium">{business.address}</p></div>}
              </div>
            </Card>
          </motion.div>

          {/* Submit buttons */}
          <div className="flex flex-wrap gap-3">
            {business.type === "garage" && (
              <Button icon={<Wrench size={15} />} onClick={() => setShowServiceModal(true)}>
                Submit Service Record
              </Button>
            )}
            {business.type === "insurer" && (
              <Button icon={<Shield size={15} />} onClick={() => setShowInsuranceModal(true)}>
                Submit Insurance Policy
              </Button>
            )}
          </div>

          {/* Submission history */}
          <Card>
            <CardHeader>
              <CardTitle>My Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <div className="px-6 pb-5">
              {submissions.length === 0 ? (
                <EmptyState
                  icon={<Plus size={22} />}
                  title="No submissions yet"
                  description="Submit your first record to a vehicle owner."
                />
              ) : (
                <ul className="space-y-3">
                  {submissions.map((s: any) => (
                    <li key={s.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 dark:border-zinc-700/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {s.description ?? s.policyNumber ?? "Record"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.serviceDate ?? s.startDate} · {s.mileageKm ? `${s.mileageKm.toLocaleString()} km` : s.provider ?? ""}
                        </p>
                      </div>
                      {s.isVerified && <Badge variant="success">Verified</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <SubmitServiceModal open={showServiceModal} onClose={() => setShowServiceModal(false)} />
          <SubmitInsuranceModal open={showInsuranceModal} onClose={() => setShowInsuranceModal(false)} />
        </div>
      )}
    </div>
  );
}
