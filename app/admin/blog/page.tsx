"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  Plus, Search, Edit2, Trash2, Eye, Sparkles, Check, X, 
  FileText, Globe, Calendar, User, Tag, Clock, RefreshCw, AlertCircle
} from "lucide-react";
import CloudinaryUpload from "@/components/admin/CloudinaryUpload";
import { toast } from "sonner";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  tags: string;
  featured_image: string;
  excerpt: string;
  content: string;
  status: string;
  views: number;
  read_time: number;
  meta_title: string | null;
  meta_desc: string | null;
  meta_keywords: string | null;
  created_at: string;
}

const CATEGORIES = ["Fashion Guides", "Streetwear Trends", "Lookbooks", "Brand News", "Styling Tips"];

const EMPTY_ARTICLE = {
  title: "",
  slug: "",
  author: "E-shop Editorial",
  category: "Fashion Guides",
  tags: "fashion, luxury, streetwear",
  featured_image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85&auto=format&fit=crop",
  excerpt: "",
  content: "",
  status: "published",
  meta_title: "",
  meta_desc: "",
  meta_keywords: ""
};

export default function AdminBlogCmsPage() {
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<typeof EMPTY_ARTICLE>(EMPTY_ARTICLE);
  
  const [saving, setSaving] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [seoScore, setSeoScore] = useState<number | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: "50", status: "" });
      if (search) p.set("q", search);
      if (categoryFilter !== "all") p.set("category", categoryFilter);
      const res = await fetch(`/api/blog?${p}`);
      const d = await res.json();
      setPosts(d.posts || []);
      setTotal(d.total || 0);
    } catch {
      toast.error("Failed to load blog posts");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [search, categoryFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_ARTICLE);
    setSeoScore(null);
    setModal("add");
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      author: p.author || "E-shop Editorial",
      category: p.category || "Fashion Guides",
      tags: p.tags || "",
      featured_image: p.featured_image || "",
      excerpt: p.excerpt || "",
      content: p.content || "",
      status: p.status || "published",
      meta_title: p.meta_title || "",
      meta_desc: p.meta_desc || "",
      meta_keywords: p.meta_keywords || ""
    });
    setSeoScore(null);
    setModal("edit");
  };

  const handleAiSeoGenerate = async () => {
    if (!form.title && !form.content) {
      toast.error("Please enter a Title or Content first");
      return;
    }
    setGeneratingSeo(true);
    try {
      const res = await fetch("/api/admin/ai-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, content: form.content || form.excerpt })
      });
      const data = await res.json();
      if (data.ok) {
        setForm(prev => ({
          ...prev,
          meta_title: data.metaTitle,
          meta_desc: data.metaDesc,
          meta_keywords: data.keywords
        }));
        setSeoScore(data.seoScore);
        toast.success("✨ AI SEO Meta Generated Successfully!", { description: `SEO Score: ${data.seoScore}/100` });
      }
    } catch {
      toast.error("Failed to generate AI SEO");
    }
    setGeneratingSeo(false);
  };

  const savePost = async () => {
    if (!form.title || !form.content) {
      toast.error("Title and Content are required");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/blog/${editing.id}` : "/api/blog";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast.success(editing ? "Article updated!" : "Article published!");
        setModal(null);
        loadPosts();
      } else {
        toast.error("Error saving article");
      }
    } catch {
      toast.error("Failed to save article");
    }
    setSaving(false);
  };

  const deletePost = async (id: string, title: string) => {
    if (!confirm(`Delete article "${title}"?`)) return;
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Article deleted");
        loadPosts();
      }
    } catch {
      toast.error("Failed to delete article");
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-[#e02020]" /> Blog & Editorial CMS
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage fashion articles, buying guides, AI SEO metadata & lookbooks</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadPosts()} className="p-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl transition-colors" title="Refresh">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[#e02020]/20">
            <Plus size={16} /> Write New Article
          </button>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] text-neutral-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                categoryFilter === cat ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                {["Article", "Category", "Author", "Status", "Views", "Date", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" /></td></tr>
                ))
              ) : posts.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-xs text-neutral-400">No blog articles found. Click "Write New Article" to create one.</td></tr>
              ) : (
                posts.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200/60 dark:border-neutral-700">
                          <img src={getOptimizedImageUrl(p.featured_image, { width: 150 })} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">{p.title}</p>
                          <code className="text-[10px] text-[#e02020]">/blog/{p.slug}</code>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-neutral-600 dark:text-neutral-300 font-medium">{p.category}</td>
                    <td className="px-5 py-4 text-xs text-neutral-500">{p.author}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"}`}>
                        {p.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">{p.views || 0}</td>
                    <td className="px-5 py-4 text-xs text-neutral-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-neutral-400 hover:text-[#e02020] transition-colors"><Eye size={14} /></a>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-neutral-400 hover:text-[#3b82f6] transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deletePost(p.id, p.title)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
          Showing {posts.length} of {total} articles
        </div>
      </div>

      {/* Editor & AI SEO Modal */}
      {modal && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setModal(null)} />
          <div style={{ maxWidth: "1100px" }} className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-h-[88vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800 my-auto">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md z-20">
              <div>
                <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
                  {modal === "add" ? "Write New Article" : `Edit: ${form.title}`}
                </h2>
                <p className="text-xs text-neutral-400">Publish guides, lookbooks & generate AI SEO metadata</p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-500 font-bold">✕</button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Article Title *</label>
                  <input
                    value={form.title}
                    onChange={e => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      setForm(p => ({ ...p, title, slug: p.slug ? p.slug : slug }));
                    }}
                    placeholder="e.g. 10 Essential Wardrobe Staples for Autumn 2026"
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">URL Slug</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                    placeholder="autumn-wardrobe-staples"
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono bg-neutral-50 dark:bg-neutral-800 text-[#e02020] focus:outline-none focus:border-[#e02020]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Author Name</label>
                  <input
                    value={form.author}
                    onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Cloudinary Image Upload */}
              <CloudinaryUpload
                label="Featured Header Image"
                mode="single"
                value={form.featured_image}
                onChange={v => setForm(p => ({ ...p, featured_image: v as string }))}
              />

              {/* Excerpt & Content */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Short Excerpt (Summary)</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Brief 2-sentence article teaser for cards & search results..."
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020] resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">Full Article Content (HTML / Markdown) *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="<p>Write your article here...</p>"
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#e02020] resize-none"
                  rows={8}
                />
              </div>

              {/* ── AI SEO Assistant Card ── */}
              <div className="bg-gradient-to-br from-red-500/10 via-purple-500/5 to-blue-500/10 p-6 rounded-2xl border border-purple-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-[#e02020] animate-pulse" size={20} />
                    <h3 className="font-display font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">AI SEO Assistant & SERP Generator</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiSeoGenerate}
                    disabled={generatingSeo}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e02020] to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                  >
                    <Sparkles size={14} /> {generatingSeo ? "Generating..." : "✨ AI Generate SEO Meta"}
                  </button>
                </div>

                {seoScore !== null && (
                  <div className="flex items-center gap-3 p-3 bg-white/80 dark:bg-neutral-900/80 rounded-xl border border-purple-500/30">
                    <span className={`text-lg font-black ${seoScore >= 80 ? "text-green-600" : "text-amber-500"}`}>{seoScore}/100</span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">AI SEO Quality Score — Ready for Google indexing</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Meta Title (50–60 chars)</label>
                    <input
                      value={form.meta_title || ""}
                      onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Focus Keywords</label>
                    <input
                      value={form.meta_keywords || ""}
                      onChange={e => setForm(p => ({ ...p, meta_keywords: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Meta Description (140–160 chars)</label>
                  <textarea
                    value={form.meta_desc || ""}
                    onChange={e => setForm(p => ({ ...p, meta_desc: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white resize-none"
                    rows={2}
                  />
                </div>

                {/* Google SERP Live Card */}
                <div className="p-4 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <p className="text-[10px] text-neutral-400 font-mono">Google Search Preview</p>
                  <p className="text-sm font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-tight">
                    {form.meta_title || form.title || "Article Title"}
                  </p>
                  <p className="text-[11px] text-[#006621] dark:text-[#34a853] font-mono">https://eshop.com/blog/{form.slug || "article-slug"}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {form.meta_desc || form.excerpt || "Article search description will appear here..."}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={savePost}
                disabled={saving}
                className="w-full py-4 bg-[#e02020] hover:bg-[#c01a1a] text-white font-bold rounded-2xl shadow-xl shadow-[#e02020]/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Check size={18} /> {saving ? "Saving Article..." : modal === "add" ? "Publish Article" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
