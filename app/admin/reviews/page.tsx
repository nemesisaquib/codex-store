"use client";

import { useState, useEffect } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Plus,
  Globe,
  Calendar,
  AlertCircle,
  Package,
} from "lucide-react";

interface Review {
  id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  customer_name: string;
  customer_email?: string;
  country?: string;
  rating: number;
  title?: string;
  comment: string;
  status: "pending" | "approved" | "rejected";
  admin_reply?: string;
  created_at: string;
}

interface ApiProductOption {
  id: string;
  name: string;
}

const getFlagEmoji = (code: string) => {
  if (!code || code.length !== 2) return "🌐";
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productsList, setProductsList] = useState<ApiProductOption[]>([]);
  const [dbCountries, setDbCountries] = useState<{ code: string; name: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Review Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    productId: "",
    customerName: "",
    customerEmail: "",
    country: "",
    rating: 5,
    title: "",
    comment: "",
    status: "approved",
    createdAt: new Date().toISOString().slice(0, 16),
  });

  // Reply Modal State
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  // Edit Modal State
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: "",
    customer_email: "",
    country: "",
    rating: 5,
    title: "",
    comment: "",
    created_at: "",
  });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${activeTab}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await fetch("/api/products?limit=100");
      const data = await res.json();
      if (data.products) {
        setProductsList(data.products.map((p: any) => ({ id: p.id, name: p.name })));
        if (data.products.length > 0 && !createForm.productId) {
          setCreateForm((prev) => ({ ...prev, productId: data.products[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCountriesList = async () => {
    try {
      const res = await fetch("/api/countries");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const list = data.map((c: { code: string; name: string }) => ({
          code: c.code,
          name: c.name,
          label: `${getFlagEmoji(c.code)} ${c.name}`,
        }));
        setDbCountries(list);
        setCreateForm((prev) => ({ ...prev, country: list[0]?.label || "" }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchProductsList();
    fetchCountriesList();
  }, [activeTab]);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.productId || !createForm.customerName || !createForm.comment) {
      alert("Please fill in Product, Customer Name, and Review Comment.");
      return;
    }

    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          productId: productsList[0]?.id || "",
          customerName: "",
          customerEmail: "",
          country: "🇺🇸 United States",
          rating: 5,
          title: "",
          comment: "",
          status: "approved",
          createdAt: new Date().toISOString().slice(0, 16),
        });
        fetchReviews();
      } else {
        const d = await res.json();
        alert(`Error: ${d.error || "Could not create review"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveReply = async () => {
    if (!replyingReview) return;
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: replyingReview.id, admin_reply: adminReplyText }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === replyingReview.id ? { ...r, admin_reply: adminReplyText } : r
          )
        );
        setReplyingReview(null);
        setAdminReplyText("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveEdit = async () => {
    if (!editingReview) return;
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingReview.id,
          customer_name: editForm.customer_name,
          customer_email: editForm.customer_email,
          country: editForm.country,
          rating: editForm.rating,
          title: editForm.title,
          comment: editForm.comment,
          created_at: editForm.created_at ? new Date(editForm.created_at).toISOString() : editingReview.created_at,
        }),
      });
      if (res.ok) {
        fetchReviews();
        setEditingReview(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.customer_name.toLowerCase().includes(q) ||
      (r.product_name && r.product_name.toLowerCase().includes(q)) ||
      (r.country && r.country.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      r.comment.toLowerCase().includes(q)
    );
  });

  const totalReviews = reviews.length;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6">
      {/* Header & Primary Add Review Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white flex items-center gap-2">
            <Star className="text-amber-500 fill-amber-500" size={24} /> Product Reviews Manager
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Create authentic customer reviews, moderate user feedback, and manage verified buyer ratings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#e02020]/20 flex items-center gap-2"
          >
            <Plus size={16} /> Add Review
          </button>
          <button
            onClick={fetchReviews}
            className="px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Reviews</span>
          <p className="font-sans font-black text-3xl text-neutral-900 dark:text-white mt-1">{totalReviews}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle size={14} /> Pending Approval
          </span>
          <p className="font-sans font-black text-3xl text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={14} /> Approved Live
          </span>
          <p className="font-sans font-black text-3xl text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Store Average</span>
          <p className="font-sans font-black text-3xl text-neutral-900 dark:text-white mt-1 flex items-center gap-1.5">
            {avgRating} <Star className="text-amber-400 fill-amber-400 inline" size={20} />
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: "all", label: "All Reviews" },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, country, review..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:border-[#e02020]"
          />
        </div>
      </div>

      {/* Reviews Table / Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-12 text-center space-y-3">
          <Star size={40} className="mx-auto text-neutral-300 dark:text-neutral-700" />
          <p className="text-sm font-semibold text-neutral-500">No product reviews found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#e02020] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add First Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all space-y-4"
            >
              {/* Top Row */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300 text-sm">
                    {rev.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {rev.customer_name}
                      {rev.country && (
                        <span className="text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                          {rev.country}
                        </span>
                      )}
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                        Verified Purchase
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
                      <span>{rev.customer_email || "No email provided"}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-neutral-500">
                        <Calendar size={12} /> {new Date(rev.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                    <span className="font-extrabold text-xs text-amber-700 dark:text-amber-400">{rev.rating}.0</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={13}
                          className={idx < rev.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-700"}
                        />
                      ))}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                      rev.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                        : rev.status === "pending"
                        ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                        : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="bg-neutral-50/70 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-1.5">
                {rev.title && <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{rev.title}</h4>}
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{rev.comment}</p>
                {rev.product_name && (
                  <p className="text-[11px] font-semibold text-neutral-400 pt-1 flex items-center gap-1">
                    <Package size={13} className="text-[#e02020]" /> Product: <span className="text-neutral-800 dark:text-neutral-200 font-bold">{rev.product_name}</span> (ID: {rev.product_id})
                  </p>
                )}
              </div>

              {/* Admin Reply */}
              {rev.admin_reply && (
                <div className="ml-6 p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border-l-4 border-blue-600 rounded-r-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <MessageSquare size={13} /> Official Store Response
                    </span>
                    <button
                      onClick={() => {
                        setReplyingReview(rev);
                        setAdminReplyText(rev.admin_reply || "");
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Edit Reply
                    </button>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">{rev.admin_reply}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  {rev.status !== "approved" && (
                    <button
                      onClick={() => updateStatus(rev.id, "approved")}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Approve Review
                    </button>
                  )}
                  {rev.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(rev.id, "rejected")}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setReplyingReview(rev);
                      setAdminReplyText(rev.admin_reply || "");
                    }}
                    className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare size={14} /> {rev.admin_reply ? "Edit Reply" : "Reply"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingReview(rev);
                      setEditForm({
                        customer_name: rev.customer_name,
                        customer_email: rev.customer_email || "",
                        country: rev.country || "🇺🇸 United States",
                        rating: rev.rating,
                        title: rev.title || "",
                        comment: rev.comment,
                        created_at: rev.created_at ? new Date(rev.created_at).toISOString().slice(0, 16) : "",
                      });
                    }}
                    className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 size={14} /> Edit Review
                  </button>
                  <button
                    onClick={() => deleteReview(rev.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🚀 Create Authentic Review Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl animate-[scaleIn_.2s_ease-out]">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-[#e02020]" /> Create Authentic Review
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Target Product *</label>
                <select
                  required
                  value={createForm.productId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, productId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                >
                  {productsList.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Name & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Reviewer Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.customerName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, customerName: e.target.value }))}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Country</label>
                  <select
                    value={createForm.country}
                    onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                  >
                    {dbCountries.map((c) => (
                      <option key={c.code} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Reviewer Email (Optional)</label>
                  <input
                    type="email"
                    value={createForm.customerEmail}
                    onChange={(e) => setCreateForm((p) => ({ ...p, customerEmail: e.target.value }))}
                    placeholder="sarah@example.com"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Review Date &amp; Time (Backdate)</label>
                  <input
                    type="datetime-local"
                    value={createForm.createdAt}
                    onChange={(e) => setCreateForm((p) => ({ ...p, createdAt: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Rating (1 to 5 Stars) *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, rating: star }))}
                      className="p-1 text-amber-400 transition-transform hover:scale-125"
                    >
                      <Star
                        size={28}
                        className={star <= createForm.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-700"}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 ml-2">
                    {createForm.rating}.0 / 5.0
                  </span>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Headline / Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Beyond expectations! Perfect fit and premium touch."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Review Body *</label>
                <textarea
                  required
                  rows={4}
                  value={createForm.comment}
                  onChange={(e) => setCreateForm((p) => ({ ...p, comment: e.target.value }))}
                  placeholder="Write realistic review content..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#e02020] hover:bg-[#c01a1a] text-white font-bold rounded-2xl text-xs transition-colors shadow-md shadow-[#e02020]/20"
                >
                  Publish Review Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-600" /> Response to {replyingReview.customer_name}
            </h3>
            <textarea
              value={adminReplyText}
              onChange={(e) => setAdminReplyText(e.target.value)}
              placeholder="e.g. Thank you for your feedback! We're glad you loved the quality..."
              rows={4}
              className="w-full p-3.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-medium focus:outline-none focus:border-blue-600"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={saveReply}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-colors"
              >
                Publish Admin Reply
              </button>
              <button
                onClick={() => setReplyingReview(null)}
                className="px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Edit Customer Review</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm((p) => ({ ...p, customer_name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Country</label>
                  <select
                    value={editForm.country}
                    onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                  >
                    {dbCountries.map((c) => (
                      <option key={c.code} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={editForm.created_at}
                  onChange={(e) => setEditForm((p) => ({ ...p, created_at: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditForm((p) => ({ ...p, rating: star }))}
                      className={`p-2 rounded-xl border text-sm font-bold flex items-center gap-1 ${
                        editForm.rating === star
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 border-neutral-200 dark:border-neutral-700"
                      }`}
                    >
                      {star} <Star size={14} className="fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Comment</label>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium focus:outline-none focus:border-[#e02020]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveEdit}
                className="flex-1 py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white font-bold rounded-2xl text-xs transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingReview(null)}
                className="px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
