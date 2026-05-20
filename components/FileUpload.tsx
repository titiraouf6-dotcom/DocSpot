"use client";

import { useUploadThing } from "@/lib/uploadthing";
import { Upload, X, FileCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
  endpoint: "paymentProof" | "certificate" | "profileImage";
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  className?: string;
}

export function FileUpload({ endpoint, value, onChange, label, accept, className }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        onChange(res[0].url);
        toast.success("تم رفع الملف بنجاح");
      }
      setIsUploading(false);
    },
    onUploadError: () => {
      toast.error("حدث خطأ أثناء رفع الملف");
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 4 ميجابايت");
      return;
    }

    setIsUploading(true);
    startUpload([file]);
  };

  return (
    <div className={className}>
      {label && <label className="label-field">{label}</label>}
      {value ? (
        <div className="flex items-center gap-3 bg-primary/10 rounded-lg px-4 py-3">
          <FileCheck className="w-5 h-5 text-primary" />
          <span className="text-sm text-primary font-medium">تم رفع الملف</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="mr-auto text-gray-400 hover:text-danger transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg px-4 py-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200">
          {isUploading ? (
            <div className="animate-pulse flex flex-col items-center">
              <Upload className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm text-gray-medium">جاري الرفع...</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-medium">اضغط لرفع الملف</span>
              <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (4MB max)</span>
            </>
          )}
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={accept || ".pdf,.jpg,.jpeg,.png"}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
