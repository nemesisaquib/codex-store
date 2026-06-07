"use client";
import { useState, useEffect } from "react";
import { Bell, Globe, Shield, Save } from "lucide-react";

interface Profile { id: string; email: string; first_name: string; last_name: string; phone: string; country: string }

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customer/profile").then(r => r.json()).then(d => { setProfile(d.profile); setLoading(false); });
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    await fetch("/api/customer/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    setSaving(false);
  };

  if (loading) return <div className="py-16 text-center text-neutral-400">Loading…</div>;
  if (!profile) return <div className="py-16 text-center text-red-500">Not logged in</div>;

  const tabs = [
    { label: "Profile", icon: null },
    { label: "Security", icon: Shield },
    { label: "Notifications", icon: Bell },
    { label: "Privacy", icon: Globe },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white mb-6">Settings</h1>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6">
        <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-6">Profile Information</h2>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1.5">First Name</label>
              <input type="text" value={profile.first_name} onChange={e => setProfile(p => p ? {...p, first_name: e.target.value} : null)} className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1.5">Last Name</label>
              <input type="text" value={profile.last_name} onChange={e => setProfile(p => p ? {...p, last_name: e.target.value} : null)} className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1.5">Email</label>
            <input type="email" value={profile.email} disabled className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1.5">Phone</label>
              <input type="tel" value={profile.phone} onChange={e => setProfile(p => p ? {...p, phone: e.target.value} : null)} className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1.5">Country</label>
              <select value={profile.country} onChange={e => setProfile(p => p ? {...p, country: e.target.value} : null)} className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]">
                <option>United States</option><option>United Kingdom</option><option>Canada</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
          <Save size={14}/> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mt-6">
        <h2 className="font-semibold text-lg text-neutral-900 dark:text-white mb-4">Change Password</h2>
        <div className="space-y-4 mb-6">
          <input type="password" placeholder="Current password" className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
          <input type="password" placeholder="New password" className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
          <input type="password" placeholder="Confirm password" className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
        </div>
        <button className="px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-semibold hover:bg-neutral-300 transition-colors">Update Password</button>
      </div>
    </div>
  );
}
