"use client";

import { useEffect, useState } from "react";
import {
  Image as ImageIcon, Search, Copy, Check, ExternalLink, RefreshCw,
  Upload, Layers, FileText, Globe, Sparkles, Eye, X, Download,
  Sun, Moon, Grid, Activity, FileCode, HardDrive
} from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  type: "logo" | "favicon" | "blog" | "category" | "brand" | "og" | "site";
  title: string;
  source: string;
  extension: string;
  inUse?: boolean;
  usageLabel?: string;
  createdAt?: string;
}

const TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  logo:     { label: "Logo",      bg: "bg-blue-50 dark:bg-blue-950/40",    text: "text-blue-600 dark:text-blue-400" },
  favicon:  { label: "Favicon",   bg: "bg-amber-50 dark:bg-amber-950/40",  text: "text-amber-600 dark:text-amber-400" },
  blog:     { label: "Blog Cover",bg: "bg-purple-50 dark:bg-purple-950/40",text: "text-purple-600 dark:text-purple-400" },
  category: { label: "Category",  bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  brand:    { label: "Brand Logo",bg: "bg-rose-50 dark:bg-rose-950/40",    text: "text-rose-600 dark:text-rose-400" },
  og:       { label: "OG / Banner",bg: "bg-indigo-50 dark:bg-indigo-950/40",text: "text-indigo-600 dark:text-indigo-400" },
  site:     { label: "Site Asset",bg: "bg-neutral-100 dark:bg-neutral-800",text: "text-neutral-600 dark:text-neutral-300" },
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [bgMode, setBgMode] = useState<"checker" | "dark" | "light">("checker");

  // Add Asset Form States
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<MediaItem["type"]>("site");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const loadMedia = () => {
    setLoading(true);
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadAsset = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "asset-image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const ext = file.name.split(".").pop()?.toUpperCase() || "IMG";
      const newItem: MediaItem = {
        id: `local_${Date.now()}`,
        url: result,
        type: newType,
        title: cleanName || "Uploaded Local Asset",
        source: "Uploaded Local File",
        extension: ext,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      setAddModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    const cleanUrl = newUrl.trim();
    const ext = cleanUrl.split("?")[0].split(".").pop()?.toUpperCase() || "IMG";

    const newItem: MediaItem = {
      id: `custom_${Date.now()}`,
      url: cleanUrl,
      type: newType,
      title: newTitle.trim() || "Custom Site Asset",
      source: "Manually Added URL",
      extension: ext.length <= 4 ? ext : "IMG",
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
    setNewUrl("");
    setNewTitle("");
    setAddModalOpen(false);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.source.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "logos") return matchesSearch && (item.type === "logo" || item.type === "favicon");
    if (activeTab === "blog") return matchesSearch && item.type === "blog";
    if (activeTab === "categories") return matchesSearch && (item.type === "category" || item.type === "brand");
    if (activeTab === "banners") return matchesSearch && item.type === "og";
    return matchesSearch;
  });

  const logoCount = items.filter((i) => i.type === "logo" || i.type === "favicon").length;
  const blogCount = items.filter((i) => i.type === "blog").length;
  const catCount = items.filter((i) => i.type === "category" || i.type === "brand").length;
  const bannerCount = items.filter((i) => i.type === "og").length;
  const activeSiteCount = items.filter((i) => i.inUse).length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Media Library</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-[#e02020]/10 text-[#e02020] rounded-full flex items-center gap-1.5">
              <Activity size={12} className="animate-pulse" /> {activeSiteCount} Active Site Assets
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Centralized media hub for store branding, logos, favicons, marketing banners &amp; blog covers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMedia}
            disabled={loading}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl transition-colors"
            title="Refresh Media"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#e02020]/20"
          >
            <Upload size={14} /> Add Asset
          </button>
        </div>
      </div>

      {/* ── Stats Summary Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Logos & Favicons", count: logoCount, icon: Sparkles, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Blog Covers", count: blogCount, icon: FileText, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Category & Brands", count: catCount, icon: Layers, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "OG & Banners", count: bannerCount, icon: Globe, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-neutral-900 dark:text-white leading-tight">{stat.count}</p>
              <p className="text-[11px] font-medium text-neutral-400 leading-tight mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar & Search ── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by name, URL or extension..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-[#e02020] transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Assets" },
            { id: "logos", label: "Logos & Favicons" },
            { id: "blog", label: "Blog Covers" },
            { id: "categories", label: "Categories & Brands" },
            { id: "banners", label: "SEO & Banners" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#e02020] text-white shadow-sm shadow-[#e02020]/20"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Media Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl h-52 animate-pulse p-3 flex flex-col justify-between">
              <div className="w-full h-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
              <div className="space-y-1.5">
                <div className="w-3/4 h-3 bg-neutral-100 dark:bg-neutral-800 rounded" />
                <div className="w-1/2 h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <ImageIcon size={24} />
          </div>
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No media assets found</p>
          <p className="text-xs text-neutral-400">Try adjusting your search filter or upload a new asset.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const badge = TYPE_BADGES[item.type] ?? TYPE_BADGES.site;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Image Viewport */}
                <div
                  className="relative h-36 w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-3 overflow-hidden cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3Cline x1='3' y1='3' x2='21' y2='21'/%3E%3C/svg%3E";
                      target.className = "w-8 h-8 opacity-40";
                    }}
                  />

                  {/* Top Left Badges: Format & Category */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap max-w-[85%]">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-neutral-900/80 text-white dark:bg-neutral-800/90 shadow-sm">
                      .{item.extension}
                    </span>
                  </div>

                  {/* Top Right Live Usage Indicator */}
                  {item.inUse && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-extrabold shadow-sm" title={item.usageLabel || "Active on Site"}>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> Active
                    </div>
                  )}

                  {/* Overlay Quick Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                      }}
                      className="p-2 bg-white/90 text-neutral-800 rounded-xl hover:bg-white transition-colors"
                      title="Inspect Asset"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadAsset(item.url, item.title);
                      }}
                      className="p-2 bg-white/90 text-neutral-800 rounded-xl hover:bg-white transition-colors"
                      title="Direct Download"
                    >
                      <Download size={14} />
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-white/90 text-neutral-800 rounded-xl hover:bg-white transition-colors"
                      title="Open Original"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {/* Card Info & Actions */}
                <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 space-y-2">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-white truncate" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5" title={item.source}>
                      {item.source}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => copyUrl(item.id, item.url)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                        isCopied
                          ? "bg-green-500 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy URL
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => downloadAsset(item.url, item.title)}
                      className="p-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                      title="Download Asset"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Asset Modal with Drag & Drop ── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Upload size={18} className="text-[#e02020]" /> Add New Site Asset
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                <X size={18} />
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-2 transition-all cursor-pointer ${
                dragActive
                  ? "border-[#e02020] bg-[#e02020]/5"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/40"
              }`}
              onClick={() => {
                const fileInput = document.getElementById("localFileInput");
                fileInput?.click();
              }}
            >
              <input
                id="localFileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-10 h-10 rounded-xl bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300 flex items-center justify-center mx-auto">
                <HardDrive size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Drag &amp; Drop Local Image File</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">PNG, SVG, ICO, JPG, WEBP up to 10MB</p>
              </div>
            </div>

            <div className="relative flex items-center my-2">
              <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800" />
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-neutral-400">OR REGISTER URL</span>
              <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800" />
            </div>

            <form onSubmit={handleAddAsset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Asset Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Summer Sale Banner"
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Image URL</label>
                <input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://... or /Logo/banner.png"
                  required
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Asset Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-[#e02020]"
                >
                  <option value="site">General Site Asset</option>
                  <option value="logo">Store Logo</option>
                  <option value="favicon">Favicon / Icon</option>
                  <option value="blog">Blog Cover</option>
                  <option value="category">Category Banner</option>
                  <option value="og">Social / OG Banner</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Asset Inspection Modal with Contrast Canvas ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setPreviewItem(null)}>
          <div
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${TYPE_BADGES[previewItem.type]?.bg} ${TYPE_BADGES[previewItem.type]?.text}`}>
                {TYPE_BADGES[previewItem.type]?.label}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                .{previewItem.extension}
              </span>
              {previewItem.inUse && (
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Activity size={11} /> {previewItem.usageLabel || "Active on Site"}
                </span>
              )}
            </div>

            {/* Viewport Contrast Canvas Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate max-w-[300px]">{previewItem.title}</h3>
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                <button
                  onClick={() => setBgMode("checker")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    bgMode === "checker" ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400"
                  }`}
                  title="Checkerboard Canvas"
                >
                  <Grid size={13} />
                </button>
                <button
                  onClick={() => setBgMode("dark")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    bgMode === "dark" ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400"
                  }`}
                  title="Dark Pitch Canvas"
                >
                  <Moon size={13} />
                </button>
                <button
                  onClick={() => setBgMode("light")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    bgMode === "light" ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400"
                  }`}
                  title="Light Pure White Canvas"
                >
                  <Sun size={13} />
                </button>
              </div>
            </div>

            {/* Preview Viewport Canvas */}
            <div
              className={`w-full h-64 rounded-2xl flex items-center justify-center p-4 overflow-hidden border border-neutral-200 dark:border-neutral-800 transition-colors ${
                bgMode === "dark"
                  ? "bg-neutral-950"
                  : bgMode === "light"
                  ? "bg-white"
                  : "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] bg-neutral-50 dark:bg-neutral-900"
              }`}
            >
              <img src={previewItem.url} alt={previewItem.title} className="max-h-full max-w-full object-contain drop-shadow-md" />
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-neutral-400 font-medium">Source Reference</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{previewItem.source}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-neutral-400 font-medium">Direct Image URL</span>
                <span className="font-mono text-[10px] text-neutral-600 dark:text-neutral-400 truncate max-w-[280px]">{previewItem.url}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => downloadAsset(previewItem.url, previewItem.title)}
                className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Download size={14} /> Download Asset
              </button>
              <button
                onClick={() => copyUrl(previewItem.id, previewItem.url)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  copiedId === previewItem.id ? "bg-green-500 text-white" : "bg-[#e02020] hover:bg-[#c01a1a] text-white"
                }`}
              >
                {copiedId === previewItem.id ? (
                  <>
                    <Check size={14} /> Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Image URL
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
