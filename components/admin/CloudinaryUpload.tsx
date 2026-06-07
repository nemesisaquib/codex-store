"use client";
import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, AlertCircle, ImageIcon } from "lucide-react";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CONFIGURED = CLOUD && PRESET && CLOUD !== "YOUR_CLOUD_NAME" && PRESET !== "YOUR_UNSIGNED_PRESET";

interface Props {
  /** single = one image (main). multiple = gallery array. */
  mode?: "single" | "multiple";
  /** current value(s) */
  value: string | string[];
  /** called with new value(s) */
  onChange: (v: string | string[]) => void;
  label?: string;
}

async function uploadToCloudinary(file: File, onProgress?: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", PRESET!);
    fd.append("folder", "codex-products");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        // request optimized delivery: auto format + quality
        const url = (res.secure_url as string).replace("/upload/", "/upload/f_auto,q_auto/");
        resolve(url);
      } else {
        try { reject(JSON.parse(xhr.responseText).error?.message || "Upload failed"); }
        catch { reject("Upload failed"); }
      }
    };
    xhr.onerror = () => reject("Network error");
    xhr.send(fd);
  });
}

export default function CloudinaryUpload({ mode = "single", value, onChange, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  const images = mode === "multiple" ? (Array.isArray(value) ? value : []) : (value ? [value as string] : []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!CONFIGURED) { setError("Cloudinary not configured — see .env.local"); return; }
    setError("");
    setUploading(true);

    try {
      const toUpload = mode === "single" ? [files[0]] : Array.from(files);
      const urls: string[] = [];
      for (const file of toUpload) {
        if (!file.type.startsWith("image/")) { setError("Only image files allowed"); continue; }
        if (file.size > 10 * 1024 * 1024) { setError(`${file.name} exceeds 10MB`); continue; }
        const url = await uploadToCloudinary(file, setProgress);
        urls.push(url);
      }
      if (mode === "single") {
        if (urls[0]) onChange(urls[0]);
      } else {
        onChange([...(Array.isArray(value) ? value : []), ...urls]);
      }
    } catch (e) {
      setError(String(e));
    }
    setUploading(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    if (mode === "single") { onChange(""); return; }
    onChange((Array.isArray(value) ? value : []).filter((_, i) => i !== idx));
  };

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{label}</label>}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          drag ? "border-[#e02020] bg-[#e02020]/5" : "border-neutral-300 dark:border-neutral-700 hover:border-[#e02020]"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={mode === "multiple"}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="text-[#e02020] animate-spin" />
            <p className="text-xs text-neutral-500">Uploading… {progress}%</p>
            <div className="w-full max-w-[180px] h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-[#e02020] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <UploadCloud size={24} className="text-neutral-400" />
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {mode === "multiple" ? "Drop images or click to upload" : "Drop image or click to upload"}
            </p>
            <p className="text-[11px] text-neutral-400">PNG, JPG, WebP up to 10MB → auto-optimized on CDN</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {!CONFIGURED && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-orange-500">
          <AlertCircle size={12} /> Add your Cloudinary cloud name + unsigned preset in <code className="font-mono">.env.local</code> to enable uploads.
        </p>
      )}

      {/* Previews — small gallery thumbnails */}
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group w-[72px] h-[90px] rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#e02020]"
              >
                <X size={11} />
              </button>
              {mode === "multiple" && <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold bg-black/60 text-white px-1 py-0.5 rounded leading-none">{i + 1}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
