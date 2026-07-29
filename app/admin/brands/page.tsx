"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Tag, Star, X, Check, Image as ImageIcon } from "lucide-react";
import CloudinaryUpload from "@/components/admin/CloudinaryUpload";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_featured: number;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    logo_url: "",
    description: "",
    is_featured: false
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands");
      const d = await res.json();
      setBrands(d.brands || []);
    } catch {
      toast.error("Failed to load brands");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm({ name: "", slug: "", logo_url: "", description: "", is_featured: false });
    setEditing(null);
    setModal("add");
  };

  const openEdit = (b: Brand) => {
    setForm({
      name: b.name,
      slug: b.slug,
      logo_url: b.logo_url || "",
      description: b.description || "",
      is_featured: b.is_featured === 1
    });
    setEditing(b);
    setModal("edit");
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        logo_url: form.logo_url || null,
        description: form.description || null,
        is_featured: form.is_featured
      };

      if (modal === "edit" && editing) {
        await fetch(`/api/brands/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        toast.success("Brand updated successfully");
      } else {
        await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        toast.success("Brand created successfully");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Error saving brand");
    }
    setSaving(false);
  };

  const del = async (b: Brand) => {
    if (!confirm(`Delete brand "${b.name}"?`)) return;
    try {
      await fetch(`/api/brands/${b.id}`, { method: "DELETE" });
      toast.success("Brand deleted");
      load();
    } catch {
      toast.error("Failed to delete brand");
    }
  };

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">Brands Management</h1>
          <p className="text-sm text-neutral-500">Manage brand identities, logos, and featured brand highlights.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add New Brand
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
        <Search size={16} className="text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search brands..."
          className="w-full bg-transparent text-sm text-neutral-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-neutral-100 dark:border-neutral-800">
          <Tag size={40} className="mx-auto text-neutral-300 mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">No brands found</h3>
          <p className="text-xs text-neutral-400 mt-1">Get started by creating your first brand above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBrands.map(b => (
            <div
              key={b.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center p-2 border border-neutral-200 dark:border-neutral-700">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-bold text-lg text-neutral-400">{b.name[0]}</span>
                    )}
                  </div>
                  {b.is_featured === 1 && (
                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> Featured
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">{b.name}</h3>
                <p className="text-[11px] font-mono text-neutral-400 mt-0.5">/brand/{b.slug}</p>
                {b.description && (
                  <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{b.description}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => openEdit(b)}
                  className="p-1.5 text-neutral-400 hover:text-blue-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => del(b)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                {modal === "edit" ? "Edit Brand" : "Add New Brand"}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 text-neutral-400 hover:text-neutral-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Brand Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Nike, Adidas, Apple"
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Slug (Optional)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                />
              </div>

              {/* Brand Logo Upload */}
              <CloudinaryUpload
                mode="single"
                label="Brand Logo"
                value={form.logo_url}
                onChange={v => setForm(p => ({ ...p, logo_url: v as string }))}
              />

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short brand story or slogan..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020] resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                  className="accent-[#e02020] w-4 h-4"
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Feature this brand on homepage</span>
              </label>

              <button
                onClick={save}
                disabled={saving}
                className="w-full py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                {saving ? "Saving..." : modal === "edit" ? "Save Changes" : "Create Brand"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
