"use client";

import { wilayas } from "@/lib/constants/wilayas";
import { useState, useEffect } from "react";

interface WilayaCommuneSelectProps {
  wilayaValue: string;
  communeValue: string;
  onWilayaChange: (value: string) => void;
  onCommuneChange: (value: string) => void;
  wilayaLabel?: string;
  communeLabel?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export function WilayaCommuneSelect({
  wilayaValue,
  communeValue,
  onWilayaChange,
  onCommuneChange,
  wilayaLabel = "الولاية",
  communeLabel = "البلدية",
  className = "grid grid-cols-1 md:grid-cols-2 gap-4",
  inputClassName = "input-field",
  labelClassName = "label-field",
}: WilayaCommuneSelectProps) {
  const [communes, setCommunes] = useState<string[]>([]);

  useEffect(() => {
    if (wilayaValue) {
      const selected = wilayas.find((w) => w.name === wilayaValue);
      setCommunes(selected?.communes || []);
      onCommuneChange("");
    } else {
      setCommunes([]);
    }
  }, [wilayaValue]);

  return (
    <div className={className}>
      <div>
        <label className={labelClassName}>{wilayaLabel}</label>
        <select
          value={wilayaValue}
          onChange={(e) => onWilayaChange(e.target.value)}
          className={inputClassName}
        >
          <option value="">اختر الولاية</option>
          {wilayas.map((w) => (
            <option key={w.code} value={w.name}>
              {w.code} - {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClassName}>{communeLabel}</label>
        <select
          value={communeValue}
          onChange={(e) => onCommuneChange(e.target.value)}
          className={inputClassName}
          disabled={!wilayaValue}
        >
          <option value="">اختر البلدية</option>
          {communes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
