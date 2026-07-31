"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, FolderPlus, Layers, Check, X, Image as ImageIcon } from "lucide-react";
import CloudinaryUpload from "@/components/admin/CloudinaryUpload";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  description: string | null;
  display_order: number;
  is_active: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add_parent" | "add_sub" | "edit" | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    parent_id: "" as string | null,
    image_url: "",
    description: "",
    display_order: "0"
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const d = await res.json();
      setCategories(d.categories || []);
    } catch {
      toast.error("Failed to load categories");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAddParent = () => {
    setForm({ name: "", slug: "", parent_id: null, image_url: "", description: "", display_order: "0" });
    setEditing(null);
    setModal("add_parent");
  };

  const openAddSub = (parentId: string) => {
    setForm({ name: "", slug: "", parent_id: parentId, image_url: "", description: "", display_order: "1" });
    setEditing(null);
    setSelectedParentId(parentId);
    setModal("add_sub");
  };

  const openEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id,
      image_url: cat.image_url || "",
      description: cat.description || "",
      display_order: String(cat.display_order || 0)
    });
    setEditing(cat);
    setModal("edit");
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        parent_id: form.parent_id || null,
        image_url: form.image_url || null,
        description: form.description || null,
        display_order: parseInt(form.display_order) || 0
      };

      if (modal === "edit" && editing) {
        await fetch(`/api/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        toast.success("Category updated successfully");
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        toast.success("Category created successfully");
      }
      setModal(null);
      load();
    } catch {
      toast.error("Error saving category");
    }
    setSaving(false);
  };

  const del = async (cat: Category) => {
    const msg = cat.parent_id
      ? `Delete subcategory "${cat.name}"?`
      : `Delete parent category "${cat.name}" and all its subcategories?`;
    if (!confirm(msg)) return;

    try {
      await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      toast.success("Category deleted");
      load();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const parents = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const filteredParents = parents.filter(p => {
    const subs = getSubcategories(p.id);
    const matchesParent = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesSub = subs.some(s => s.name.toLowerCase().includes(search.toLowerCase()));
    return matchesParent || matchesSub;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">Categories & Subcategories</h1>
          <p className="text-sm text-neutral-500">Manage your store's parent category hierarchy and child subcategories.</p>
        </div>
        <button
          onClick={openAddParent}
          className="px-4 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <FolderPlus size={16} />
          Add Parent Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
        <Search size={16} className="text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search categories or subcategories..."
          className="w-full bg-transparent text-sm text-neutral-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Categories Tree List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-neutral-100 dark:border-neutral-800">
          <Layers size={40} className="mx-auto text-neutral-300 mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">No categories found</h3>
          <p className="text-xs text-neutral-400 mt-1">Get started by creating your first parent category above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredParents.map(parent => {
            const subs = getSubcategories(parent.id);
            return (
              <div
                key={parent.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Parent Row */}
                <div className="p-5 bg-neutral-50/50 dark:bg-neutral-800/40 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0 relative border border-neutral-200 dark:border-neutral-700">
                      {parent.image_url ? (
                        <img src={parent.image_url} alt={parent.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-neutral-900 dark:text-white">{parent.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full">
                          /category/{parent.slug}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {subs.length} subcategor{subs.length === 1 ? "y" : "ies"}
                        {parent.description ? ` · ${parent.description}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const newStatus = parent.is_active ? 0 : 1;
                          await fetch(`/api/categories/${parent.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ is_active: newStatus })
                          });
                          toast.success(`Category ${newStatus ? 'enabled' : 'disabled'}`);
                          load();
                        } catch {
                          toast.error("Failed to update status");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        parent.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {parent.is_active ? "Active" : "Hidden"}
                    </button>
                    <button
                      onClick={() => openAddSub(parent.id)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={14} /> Add Subcategory
                    </button>
                    <button
                      onClick={() => openEdit(parent)}
                      className="p-2 text-neutral-400 hover:text-blue-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => del(parent)}
                      className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Subcategories List */}
                {subs.length > 0 && (
                  <div className="p-4 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {subs.map(sub => (
                      <div key={sub.id} className="py-3 px-2 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3 pl-4">
                          <span className="text-neutral-300 text-lg">└</span>
                          <div>
                            <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">{sub.name}</span>
                            <span className="ml-2 text-[10px] text-neutral-400 font-mono">/category/{sub.slug}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(sub)}
                            className="p-1.5 text-neutral-400 hover:text-blue-500 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => del(sub)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                {modal === "edit"
                  ? "Edit Category"
                  : modal === "add_parent"
                  ? "Add Parent Category"
                  : "Add Subcategory"}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 text-neutral-400 hover:text-neutral-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Category Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Menswear or Casual Shirts"
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">URL Slug (Optional)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                />
              </div>

              {/* Parent Category Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Parent Category</label>
                <select
                  value={form.parent_id || ""}
                  onChange={e => setForm(p => ({ ...p, parent_id: e.target.value || null }))}
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                >
                  <option value="">None (Top-Level Parent Category)</option>
                  {parents
                    .filter(p => p.id !== editing?.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Category Image Upload */}
              <CloudinaryUpload
                mode="single"
                label="Category Banner/Thumbnail Image"
                value={form.image_url}
                onChange={v => setForm(p => ({ ...p, image_url: v as string }))}
              />

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description for SEO and category page header..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020] resize-none"
                />
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                {saving ? "Saving..." : modal === "edit" ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
