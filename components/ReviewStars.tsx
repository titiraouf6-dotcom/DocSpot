"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface ReviewStarsProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

export function ReviewStars({ label, value, onChange, readOnly = false }: ReviewStarsProps) {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <label className="label-field">{label}</label>
      <div className="flex gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            className={`transition-all duration-200 ${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            onClick={() => !readOnly && onChange(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hover || value)
                  ? "fill-warning text-warning"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
