"use client";
import { useEffect, useState, useRef } from "react";
import {
  Save, Check, Store, Truck, Globe, Zap, Shield, RefreshCw,
  Mail, Send, UploadCloud, X, Loader2, AlertCircle,
} from "lucide-react";

interface SettingsGroup { [key: string]: string }

const GROUPS = [
  { key:"general",      icon:Store,    label:"General",      desc:"Name, logo, favicon, contact info" },
  { key:"shipping",     icon:Truck,    label:"Shipping",     desc:"Rates, thresholds & tax" },
  { key:"smtp",         icon:Mail,     label:"Email / SMTP", desc:"Outgoing email server" },
  { key:"seo",          icon:Globe,    label:"SEO",          desc:"Meta tags, OG image, robots" },
  { key:"integrations", icon:Zap,      label:"Integrations", desc:"Analytics & payment keys" },
  { key:"advanced",     icon:Shield,   label:"Advanced",     desc:"Maintenance, feature flags" },
];

const FIELD_LABELS: Record<string,string> = {
  store_name:"Store Name",
  store_logo:"Store Logo",
  store_favicon:"Favicon (ICO / PNG)",
  store_favicon_apple:"Apple Touch Icon",
  store_email:"Contact Email",
  store_phone:"Phone Number",
  store_address:"Store Address",
  currency:"Store Currency",
  free_shipping_threshold:"Free Shipping Threshold",
  express_shipping_price:"Express Shipping Price",
  overnight_shipping_price:"Overnight Shipping Price",
  tax_rate:"Tax Rate (%)",
  shipping_api_carrier:"Shipping Logistics Carrier",
  shipping_api_key:"Shipping API Secret Key",
  shipping_api_mode:"Shipping API Mode (Sandbox/Live)",
  low_stock_alert:"Low Stock Alert Threshold",
  meta_title:"Default Meta Title",
  meta_desc:"Default Meta Description",
  og_image:"Default OG / Share Image",
  seo_keywords:"Default Keywords",
  seo_author:"Site Author",
  seo_robots:"Robots Directive",
  google_analytics:"Google Analytics ID",
  facebook_pixel:"Facebook Pixel ID",
  stripe_pk:"Stripe Publishable Key",
  maintenance_mode:"Maintenance Mode",
  reviews_enabled:"Product Reviews Enabled",
  smtp_host:"SMTP Host",
  smtp_port:"SMTP Port",
  smtp_user:"SMTP Username",
  smtp_pass:"SMTP Password",
  smtp_from_name:"From Name",
  smtp_from_email:"From Email",
  smtp_secure:"Use SSL/TLS (port 465)",
};

const FIELD_HINTS: Record<string,string> = {
  store_name: "Displayed in navbar, page title, and emails",
  store_logo: "PNG or SVG — shown in the storefront navbar",
  store_favicon: "16×16 or 32×32 .ico or .png shown in browser tabs",
  store_favicon_apple: "180×180 PNG shown when saved to iPhone home screen",
  meta_title: "Default browser tab title for pages without a specific title",
  seo_keywords: "Comma-separated keywords for search engine indexing",
  seo_robots: "Controls how search engines crawl your site",
  og_image: "Image shown when your URL is shared on social media (1200×630 recommended)",
};

const GENERAL_ORDER = ["store_name","store_logo","store_favicon","store_favicon_apple","store_email","store_phone","store_address","currency"];
const SEO_ORDER     = ["meta_title","meta_desc","og_image","seo_keywords","seo_author","seo_robots"];
const SMTP_ORDER    = ["smtp_host","smtp_port","smtp_user","smtp_pass","smtp_from_name","smtp_from_email","smtp_secure"];
const IMAGE_KEYS    = ["store_logo","store_favicon","store_favicon_apple","og_image"];

const CLOUD  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_OK = CLOUD && PRESET && CLOUD !== "YOUR_CLOUD_NAME" && PRESET !== "YOUR_UNSIGNED_PRESET";

async function uploadToCloudinary(file: File, onP: (p:number)=>void): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", PRESET!);
    fd.append("folder", "codex-store");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onP(Math.round((e.loaded/e.total)*100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const r = JSON.parse(xhr.responseText);
        resolve((r.secure_url as string).replace("/upload/", "/upload/f_auto,q_auto/"));
      } else reject("Upload failed");
    };
    xhr.onerror = () => reject("Network error");
    xhr.send(fd);
  });
}

/* ── Compact image row: URL input + Upload btn + thumbnail ── */
function ImageField({ fieldKey, val, changed, onChange }: {
  fieldKey: string; val: string; changed: boolean; onChange:(v:string)=>void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");
  const [drag,      setDrag]      = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.[0]) return;
    if (!CLOUD_OK) { setError("Cloudinary not configured — paste a URL instead"); return; }
    if (!files[0].type.startsWith("image/")) { setError("Only image files"); return; }
    if (files[0].size > 10*1024*1024) { setError("File exceeds 10 MB"); return; }
    setError(""); setUploading(true);
    try { onChange(await uploadToCloudinary(files[0], setProgress)); }
    catch (e) { setError(String(e)); }
    setUploading(false); setProgress(0);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        {/* URL text input */}
        <input
          value={val}
          onChange={e => onChange(e.target.value)}
          type="text"
          placeholder="Paste URL or upload →"
          className={`flex-1 px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none transition-all min-w-0 ${
            changed
              ? "border-[#e02020] ring-2 ring-[#e02020]/10 bg-red-50 dark:bg-red-950/10"
              : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 focus:border-[#e02020] focus:ring-2 focus:ring-[#e02020]/10"
          }`}
        />

        {/* Hidden file input */}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />

        {/* Upload button */}
        <button
          type="button"
          onClick={() => !uploading && ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          disabled={uploading}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 border-2 border-dashed rounded-xl text-xs font-semibold transition-all select-none ${
            drag
              ? "border-[#e02020] bg-[#e02020]/5 text-[#e02020]"
              : uploading
              ? "border-neutral-200 text-neutral-400 cursor-wait"
              : "border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-[#e02020] hover:text-[#e02020] hover:bg-[#e02020]/5 cursor-pointer"
          }`}
        >
          {uploading
            ? <><Loader2 size={13} className="animate-spin"/>{progress}%</>
            : <><UploadCloud size={13}/>Upload</>
          }
        </button>

        {/* Preview thumbnail */}
        {val ? (
          <div className="relative flex-shrink-0 w-12 h-12 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 overflow-hidden bg-neutral-50 dark:bg-neutral-800 group shadow-sm">
            <img src={val} alt="" className="w-full h-full object-contain p-1" onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
            >
              <X size={12}/>
            </button>
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800">
            <span className="text-neutral-300 text-lg">🖼</span>
          </div>
        )}
      </div>

      {error && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle size={11}/>{error}</p>}
      {!CLOUD_OK && (
        <p className="text-[10px] text-amber-500/80">
          💡 Set <code className="bg-amber-50 dark:bg-amber-900/20 px-1 rounded font-mono">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> &amp; <code className="bg-amber-50 dark:bg-amber-900/20 px-1 rounded font-mono">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> in .env.local for CDN uploads. Paste any URL to use directly.
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string,SettingsGroup>>({});
  const [flat,     setFlat]     = useState<Record<string,string>>({});
  const [edits,    setEdits]    = useState<Record<string,string>>({});
  const [activeGroup, setGroup] = useState("general");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const load = () =>
    fetch("/api/settings").then(r => r.json()).then(d => {
      setSettings(d.settings ?? {});
      setFlat(d.flat ?? {});
    });

  useEffect(() => { load(); }, []);

  const change    = (key: string, val: string) => setEdits(p => ({ ...p, [key]: val }));
  const getValue  = (key: string) => edits[key] !== undefined ? edits[key] : (flat[key] ?? "");
  const hasChanges = Object.keys(edits).length > 0;

  const save = async () => {
    if (!hasChanges) return;
    setSaving(true);
    await fetch("/api/settings", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(edits),
    });
    setSaving(false); setSaved(true);
    window.dispatchEvent(new Event("settings-updated"));
    setTimeout(() => { setSaved(false); setEdits({}); load(); }, 1500);
  };

  const getGroupKeys = () => {
    const base = settings[activeGroup] ? Object.keys(settings[activeGroup]) : [];
    const extra = activeGroup === "general" ? GENERAL_ORDER
      : activeGroup === "seo"     ? SEO_ORDER
      : activeGroup === "smtp"    ? SMTP_ORDER
      : null;
    if (extra) return extra.filter(k => base.includes(k) || flat[k] !== undefined);
    return base;
  };

  const groupKeys   = getGroupKeys();
  const isToggle    = (k: string) => ["maintenance_mode","reviews_enabled","smtp_secure"].includes(k);
  const isCurrency  = (k: string) => k === "currency";
  const isPassword  = (k: string) => k === "smtp_pass";
  const isImage     = (k: string) => IMAGE_KEYS.includes(k);
  const isMultiline = (k: string) => ["store_address","meta_desc","seo_keywords"].includes(k);
  const isNumeric   = (k: string) => k.includes("price") || k.includes("rate") || k.includes("threshold") || k === "smtp_port";

  const group = GROUPS.find(g => g.key === activeGroup)!;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Settings</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {hasChanges
              ? <span className="text-orange-500 font-semibold">{Object.keys(edits).length} unsaved change{Object.keys(edits).length > 1 ? "s" : ""} — remember to save</span>
              : "Manage your store configuration"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-neutral-400 transition-colors" title="Reload from database">
            <RefreshCw size={15}/>
          </button>
          <button onClick={save} disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              saved    ? "bg-green-500 text-white shadow-green-200"
              : hasChanges ? "bg-[#e02020] hover:bg-[#c01a1a] text-white shadow-red-200 hover:shadow-red-300"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
            }`}>
            {saved ? <><Check size={15}/>Saved!</> : <><Save size={15}/>{saving ? "Saving…" : "Save Changes"}</>}
          </button>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid xl:grid-cols-5 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <nav className="xl:col-span-1 space-y-1">
          {GROUPS.map(({ key, icon:Icon, label, desc }) => (
            <button
              key={key}
              onClick={() => setGroup(key)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all group ${
                activeGroup === key
                  ? "bg-[#e02020] text-white shadow-lg shadow-red-200/50"
                  : "hover:bg-white dark:hover:bg-neutral-900 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  activeGroup === key ? "bg-white/20" : "bg-neutral-100 dark:bg-neutral-800 group-hover:bg-[#e02020]/10"
                }`}>
                  <Icon size={15} className={activeGroup === key ? "text-white" : "text-neutral-500 group-hover:text-[#e02020]"}/>
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold leading-tight ${activeGroup === key ? "text-white" : "text-neutral-800 dark:text-white"}`}>{label}</p>
                  <p className={`text-[10px] mt-0.5 leading-tight truncate ${activeGroup === key ? "text-white/70" : "text-neutral-400"}`}>{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <div className="xl:col-span-4 lg:col-span-3">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">

            {/* Panel top bar */}
            <div className="flex items-center gap-3 px-8 py-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="w-9 h-9 rounded-xl bg-[#e02020]/10 flex items-center justify-center">
                <group.icon size={17} className="text-[#e02020]"/>
              </div>
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white leading-tight">{group.label}</h2>
                <p className="text-xs text-neutral-400 mt-0.5">{group.desc}</p>
              </div>
              {hasChanges && (
                <span className="ml-auto text-[10px] font-bold px-2.5 py-1 bg-orange-50 text-orange-500 border border-orange-200 rounded-full">
                  {Object.keys(edits).length} pending
                </span>
              )}
            </div>

            {/* Fields */}
            <div className="px-8 py-6 space-y-6">
              {groupKeys.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-neutral-300 text-4xl mb-3">⚙️</p>
                  <p className="text-neutral-400 text-sm">No settings in this group yet.</p>
                </div>
              )}

              {/* 2-column grid for non-image, non-multiline fields in General/Shipping/Integrations */}
              {(() => {
                const imageKeys   = groupKeys.filter(k => isImage(k));
                const toggleKeys  = groupKeys.filter(k => isToggle(k));
                const currKeys    = groupKeys.filter(k => isCurrency(k));
                const multiKeys   = groupKeys.filter(k => isMultiline(k) && !isImage(k));
                const singleKeys  = groupKeys.filter(k => !isImage(k) && !isToggle(k) && !isCurrency(k) && !isMultiline(k));

                return (
                  <>
                    {/* Regular single-line fields — 2-col grid */}
                    {(singleKeys.length > 0 || currKeys.length > 0) && (
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                        {currKeys.map(key => {
                          const val     = getValue(key);
                          const label   = FIELD_LABELS[key] ?? key;
                          const changed = edits[key] !== undefined;
                          return (
                            <div key={key} className="space-y-1.5">
                              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
                              <select
                                value={val}
                                onChange={e => change(key, e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none transition-all ${
                                  changed ? "border-[#e02020] ring-2 ring-[#e02020]/10" : "border-neutral-200 dark:border-neutral-700 focus:border-[#e02020] focus:ring-2 focus:ring-[#e02020]/10"
                                }`}
                              >
                                {["USD","GBP","EUR","JPY","AED","CNY","AUD","CAD"].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                          );
                        })}

                        {singleKeys.map(key => {
                          const val     = getValue(key);
                          const label   = FIELD_LABELS[key] ?? key.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase());
                          const hint    = FIELD_HINTS[key];
                          const changed = edits[key] !== undefined;
                          return (
                            <div key={key} className="space-y-1.5">
                              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
                              <input
                                value={val}
                                onChange={e => change(key, e.target.value)}
                                type={isPassword(key) ? "password" : isNumeric(key) ? "number" : "text"}
                                placeholder={key === "smtp_host" ? "smtp.gmail.com" : key === "smtp_user" ? "you@gmail.com" : ""}
                                autoComplete="off"
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none transition-all ${
                                  changed
                                    ? "border-[#e02020] ring-2 ring-[#e02020]/10 bg-red-50 dark:bg-red-950/10"
                                    : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 focus:border-[#e02020] focus:ring-2 focus:ring-[#e02020]/10"
                                }`}
                              />
                              {hint && <p className="text-[10px] text-neutral-400 leading-relaxed">{hint}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Multi-line textareas — full width */}
                    {multiKeys.map(key => {
                      const val     = getValue(key);
                      const label   = FIELD_LABELS[key] ?? key;
                      const hint    = FIELD_HINTS[key];
                      const changed = edits[key] !== undefined;
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
                          <textarea
                            value={val}
                            onChange={e => change(key, e.target.value)}
                            rows={3}
                            className={`w-full px-4 py-3 border rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none resize-none transition-all ${
                              changed
                                ? "border-[#e02020] ring-2 ring-[#e02020]/10 bg-red-50 dark:bg-red-950/10"
                                : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 focus:border-[#e02020] focus:ring-2 focus:ring-[#e02020]/10"
                            }`}
                          />
                          {hint && <p className="text-[10px] text-neutral-400 leading-relaxed">{hint}</p>}
                        </div>
                      );
                    })}

                    {/* Image upload fields — full width, nice styling */}
                    {imageKeys.length > 0 && (
                      <div className="space-y-5 pt-2">
                        {imageKeys.map(key => (
                          <div key={key} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-700 space-y-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                                {FIELD_LABELS[key]}
                              </label>
                              {edits[key] !== undefined && (
                                <span className="text-[10px] bg-[#e02020]/10 text-[#e02020] font-bold px-2 py-0.5 rounded-full">Modified</span>
                              )}
                            </div>
                            <ImageField
                              fieldKey={key}
                              val={getValue(key)}
                              changed={edits[key] !== undefined}
                              onChange={v => change(key, v)}
                            />
                            {FIELD_HINTS[key] && (
                              <p className="text-[10px] text-neutral-400">{FIELD_HINTS[key]}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toggle switches */}
                    {toggleKeys.length > 0 && (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden">
                        {toggleKeys.map(key => {
                          const val = getValue(key);
                          const label = FIELD_LABELS[key] ?? key;
                          return (
                            <div key={key} className="flex items-center justify-between px-5 py-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                              <div>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{label}</p>
                                <p className="text-xs text-neutral-400 mt-0.5">Currently <span className={val === "true" ? "text-green-600 font-semibold" : "text-neutral-400"}>{val === "true" ? "enabled" : "disabled"}</span></p>
                              </div>
                              <button
                                onClick={() => change(key, val === "true" ? "false" : "true")}
                                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${val === "true" ? "bg-[#e02020]" : "bg-neutral-200 dark:bg-neutral-700"}`}
                              >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${val === "true" ? "left-7" : "left-1"}`}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* SMTP test */}
              {activeGroup === "smtp" && <SmtpTestPanel flat={flat}/>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Interactive Email Template Tester & Free SMTP Sandbox ── */
function SmtpTestPanel({ flat }: { flat: Record<string, string> }) {
  const [to, setTo] = useState("test@example.com");
  const [template, setTemplate] = useState<"booking" | "cancellation" | "delivery" | "contact" | "test">("booking");
  const [sending, setSend] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; previewUrl?: string | null; isTestAccount?: boolean } | null>(null);

  const configured = !!flat.smtp_host && !!flat.smtp_user;

  const send = async () => {
    if (!to) return;
    setSend(true);
    setResult(null);
    try {
      const r = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, template, forceTest: !configured }),
      });
      const d = await r.json();
      if (d.ok) {
        setResult({
          ok: true,
          msg: `Success! Message ID: ${d.messageId ? d.messageId.slice(0, 30) : "ok"}`,
          previewUrl: d.previewUrl,
          isTestAccount: d.isTestAccount,
        });
      } else {
        setResult({ ok: false, msg: d.error || "Failed to send email." });
      }
    } catch (err: any) {
      setResult({ ok: false, msg: String(err) });
    }
    setSend(false);
  };

  return (
    <div className="mt-6 p-6 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#e02020]/10 flex items-center justify-center text-[#e02020]">
            <Send size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Email Template Tester & SMTP Sandbox</h3>
            <p className="text-xs text-neutral-400">Test transactional emails & inspect HTML templates instantly</p>
          </div>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
            configured ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
          }`}
        >
          {configured ? "✓ Custom SMTP Active" : "⚡ Free Ethereal Test Server Active"}
        </span>
      </div>

      {!configured && (
        <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 rounded-xl text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2.5">
          <span className="text-base">💡</span>
          <div>
            <strong>Zero-Config Free Test Mailer Active:</strong> Custom SMTP fields are currently empty, so emails will be sent via an automatic <strong>Ethereal Email</strong> test server. A clickable <strong>Live Preview Link</strong> will be generated for every email sent!
          </div>
        </div>
      )}

      {/* Select Template */}
      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Select Email Template to Test</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: "booking", label: "🛍️ Order Booking", desc: "Confirmation" },
            { id: "cancellation", label: "❌ Order Cancel", desc: "Refund Notice" },
            { id: "delivery", label: "🚚 Order Delivery", desc: "Shipment Tracking" },
            { id: "contact", label: "📩 Contact Form", desc: "Customer Inquiry" },
            { id: "test", label: "🚀 System Test", desc: "Basic SMTP Ping" },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id as any)}
              className={`p-3 text-left rounded-xl border transition-all ${
                template === t.id
                  ? "border-[#e02020] bg-white dark:bg-neutral-900 shadow-sm ring-2 ring-[#e02020]/10 font-bold"
                  : "border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 hover:border-neutral-300"
              }`}
            >
              <div className="text-xs text-neutral-900 dark:text-white truncate">{t.label}</div>
              <div className="text-[10px] text-neutral-400 font-normal mt-0.5 truncate">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recipient + Send */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Recipient Email</label>
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="recipient@example.com"
            type="email"
            className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#e02020]"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={send}
            disabled={sending || !to}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              !to ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-[#e02020] hover:bg-[#c01a1a] text-white shadow-lg shadow-[#e02020]/20"
            }`}
          >
            <Send size={14} />
            {sending ? "Sending Test Mail…" : "Send Test Email"}
          </button>
        </div>
      </div>

      {/* Result & Ethereal Live Preview Button */}
      {result && (
        <div
          className={`p-4 rounded-xl border space-y-2.5 ${
            result.ok
              ? "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/40"
              : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <span>{result.ok ? "✅" : "❌"}</span>
            <span>{result.msg}</span>
          </div>

          {result.ok && result.previewUrl && (
            <div className="pt-2 border-t border-green-200/60 dark:border-green-800/40 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-green-700 dark:text-green-400">View the exact rendered HTML email in your browser:</span>
              <a
                href={result.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                <span>🌐 Open Ethereal Email Live Preview</span>
                <span className="text-xs">↗</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
