"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";

const schema = z.object({
  plateNumber:  z.string().min(1, "Required").max(20),
  make:         z.string().min(1, "Required"),
  model:        z.string().min(1, "Required"),
  year:         z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  color:        z.string().optional(),
  fuelType:     z.enum(["petrol", "diesel", "electric", "hybrid", "cng"]),
  transmission: z.enum(["manual", "automatic", "cvt"]),
  engineCc:     z.coerce.number().int().positive().optional().or(z.literal("")),
  mileageKm:    z.coerce.number().int().min(0).optional().or(z.literal("")),
  condition:    z.enum(["excellent", "good", "fair", "poor"]),
  notes:        z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof schema>;

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormValues>;
  onSubmit: (values: VehicleFormValues) => Promise<void>;
  submitLabel?: string;
}

const STEPS = ["Identity", "Specs", "Condition"];

const STEP_FIELDS: Record<number, (keyof VehicleFormValues)[]> = {
  1: ["plateNumber", "make", "model", "year", "color"],
  2: ["fuelType", "transmission", "engineCc", "mileageKm"],
  3: ["condition", "notes"],
};

const selectCls = "w-full rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20 capitalize";

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export function VehicleForm({ defaultValues, onSubmit, submitLabel = "Create Vehicle" }: VehicleFormProps) {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);

  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fuelType: "petrol",
      transmission: "manual",
      condition: "good",
      ...defaultValues,
    },
  });

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step] as any);
    if (!valid) return;
    setDir(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDir(-1);
    setStep((s) => s - 1);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <StepIndicator steps={STEPS} current={step} variant="numbered" />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="space-y-4"
          >
            {step === 1 && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Vehicle Identity</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Input
                        label="Plate Number"
                        description="Sri Lankan format — e.g. ABC-1234 or WP CAB-1234"
                        {...register("plateNumber")}
                        error={errors.plateNumber?.message}
                        placeholder="ABC-1234"
                      />
                    </div>
                    <Input label="Make" {...register("make")} error={errors.make?.message} placeholder="Toyota" />
                    <Input label="Model" {...register("model")} error={errors.model?.message} placeholder="Corolla" />
                    <Input label="Year" type="number" {...register("year")} error={errors.year?.message} placeholder="2022" />
                    <Input label="Color" {...register("color")} error={errors.color?.message} placeholder="White" />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Technical Specs</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Fuel Type</label>
                      <select {...register("fuelType")} className={selectCls}>
                        {["petrol","diesel","electric","hybrid","cng"].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Transmission</label>
                      <select {...register("transmission")} className={selectCls}>
                        {["manual","automatic","cvt"].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <Input
                      label="Engine CC"
                      type="number"
                      description="Cubic centimetres — optional"
                      {...register("engineCc")}
                      error={errors.engineCc?.message}
                      placeholder="1500"
                    />
                    <Input
                      label="Mileage (km)"
                      type="number"
                      description="Current odometer reading"
                      {...register("mileageKm")}
                      error={errors.mileageKm?.message}
                      placeholder="45000"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Condition &amp; Notes</p>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Condition</label>
                      <select {...register("condition")} className={selectCls}>
                        {["excellent","good","fair","poor"].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                      <textarea
                        {...register("notes")}
                        rows={4}
                        className="w-full rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20 resize-none placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                        placeholder="Any additional notes about this vehicle…"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {step > 1 && (
            <Button type="button" variant="ghost" onClick={goBack}>
              Back
            </Button>
          )}
        </div>
        <div>
          {step < 3 ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" loading={isSubmitting}>
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
