"use client";
import { useEffect, useState } from "react";
import { Save, Check, Store, Truck, Globe, Zap, Shield, RefreshCw, Mail, Send } from "lucide-react";

interface SettingsGroup { [key: string]: string }

const GROUPS = [
  { key:"general",      icon:Store,       label:"General",       desc:"Store name, email, address, currency" },
  { key:"shipping",     icon:Truck,       label:"Shipping",      desc:"Delivery rates and thresholds" },
  { key:"smtp",         icon:Mail,        label:"Email / SMTP",  desc:"Outgoing email server configuration" },
  { key:"seo",          icon:Globe,       label:"SEO Defaults",  desc:"Default meta tags for the store" },
  { key:"integrations", icon:Zap,         label:"Integrations",  desc:"Analytics, pixels and payment keys" },
  { key:"advanced",     icon:Shield,      label:"Advanced",      desc:"Maintenance mode, feature flags" },
];

const FIELD_LABELS: Record<string,string> = {
  store_name:"Store Name", store_email:"Contact Email", store_phone:"Phone Number", store_address:"Store Address",
  currency:"Currency", free_shipping_threshold:"Free Shipping Over ($)", express_shipping_price:"Express Shipping ($)",
  overnight_shipping_price:"Overnight Shipping ($)", tax_rate:"Tax Rate (%)",
  low_stock_alert:"Low Stock Alert Threshold",
  meta_title:"Default Meta Title", meta_desc:"Default Meta Description", og_image:"Default OG Image URL",
  google_analytics:"Google Analytics ID (G-XXXXX)", facebook_pixel:"Facebook Pixel ID",
  stripe_pk:"Stripe Publishable Key",
  maintenance_mode:"Maintenance Mode", reviews_enabled:"Product Reviews Enabled",
  smtp_host:"SMTP Host", smtp_port:"SMTP Port", smtp_user:"SMTP Username",
  smtp_pass:"SMTP Password", smtp_from_name:"From Name", smtp_from_email:"From Email", smtp_secure:"Use SSL/TLS (port 465)",
};

const SMTP_ORDER = ["smtp_host","smtp_port","smtp_user","smtp_pass","smtp_from_name","smtp_from_email","smtp_secure"];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string,SettingsGroup>>({});
  const [flat,     setFlat]     = useState<Record<string,string>>({});
  const [edits,    setEdits]    = useState<Record<string,string>>({});
  const [activeGroup, setGroup] = useState("general");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const load = () => {
    fetch("/api/settings").then(r=>r.json()).then(d => { setSettings(d.settings??{}); setFlat(d.flat??{}); });
  };
  useEffect(load,[]);

  const change = (key: string, val: string) => setEdits(p => ({...p,[key]:val}));
  const getValue = (key: string) => edits[key] !== undefined ? edits[key] : (flat[key] ?? "");

  const save = async () => {
    if (!Object.keys(edits).length) return;
    setSaving(true);
    await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(edits)});
    setSaving(false); setSaved(true);
    setTimeout(()=>{setSaved(false);setEdits({});load();},800);
  };

  let groupKeys = settings[activeGroup] ? Object.keys(settings[activeGroup]) : [];
  if (activeGroup === "smtp") groupKeys = SMTP_ORDER.filter(k => groupKeys.includes(k));
  const hasChanges = Object.keys(edits).length > 0;

  const isToggle = (key:string) => ["maintenance_mode","reviews_enabled","smtp_secure"].includes(key);
  const isCurrency = (key:string) => ["currency"].includes(key);
  const isPassword = (key:string) => ["smtp_pass"].includes(key);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">Settings</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{hasChanges && <span className="text-orange-500">{Object.keys(edits).length} unsaved change{Object.keys(edits).length>1?"s":""}</span>}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm hover:border-neutral-400 transition-colors">
            <RefreshCw size={13}/>
          </button>
          <button onClick={save} disabled={saving||!hasChanges}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${saved?"bg-green-500 text-white":hasChanges?"bg-[#e02020] hover:bg-[#c01a1a] text-white":"bg-neutral-200 text-neutral-400 cursor-not-allowed"}`}>
            {saved?<><Check size={14}/>Saved!</>:<><Save size={14}/>{saving?"Saving…":"Save Changes"}</>}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <nav className="space-y-1">
          {GROUPS.map(({key,icon:Icon,label,desc}) => (
            <button key={key} onClick={()=>setGroup(key)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all group ${activeGroup===key?"bg-[#e02020] text-white":"hover:bg-white dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400"}`}>
              <div className="flex items-center gap-3">
                <Icon size={15} className={activeGroup===key?"text-white":"group-hover:text-[#e02020] transition-colors"}/>
                <div>
                  <p className={`text-xs font-semibold ${activeGroup===key?"text-white":"text-neutral-900 dark:text-white"}`}>{label}</p>
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Settings fields */}
        <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-6">
            {(() => { const g = GROUPS.find(g=>g.key===activeGroup); return g ? <g.icon size={18} className="text-[#e02020]"/> : null; })()}
            <h2 className="font-semibold text-neutral-900 dark:text-white">{GROUPS.find(g=>g.key===activeGroup)?.label}</h2>
            <span className="text-xs text-neutral-400">— {GROUPS.find(g=>g.key===activeGroup)?.desc}</span>
          </div>

          {groupKeys.map(key => {
            const val = getValue(key);
            const label = FIELD_LABELS[key] ?? key.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
            const changed = edits[key] !== undefined;

            if (isToggle(key)) return (
              <div key={key} className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{val==="true"?"Enabled":"Disabled"}</p>
                </div>
                <button onClick={()=>change(key, val==="true"?"false":"true")}
                  className={`relative w-11 h-6 rounded-full transition-colors ${val==="true"?"bg-[#e02020]":"bg-neutral-200 dark:bg-neutral-700"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${val==="true"?"left-6":"left-1"}`}/>
                </button>
              </div>
            );

            if (isCurrency(key)) return (
              <div key={key}>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{label}</label>
                <select value={val} onChange={e=>change(key,e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none transition-colors ${changed?"border-blue-400":"border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}>
                  {["USD","GBP","EUR","JPY","AED","CNY","AUD","CAD"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            );

            const isMultiline = ["store_address","meta_desc"].includes(key);
            return (
              <div key={key}>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{label}</label>
                {isMultiline ? (
                  <textarea value={val} onChange={e=>change(key,e.target.value)} rows={3}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none resize-none transition-colors ${changed?"border-blue-400 bg-blue-50 dark:bg-blue-950/20":"border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}/>
                ) : (
                  <input value={val} onChange={e=>change(key,e.target.value)}
                    type={isPassword(key)?"password":(key.includes("price")||key.includes("rate")||key.includes("threshold")||key==="smtp_port")?"number":"text"}
                    placeholder={key==="smtp_host"?"smtp.gmail.com":key==="smtp_user"?"you@gmail.com":""}
                    autoComplete="off"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none transition-colors ${changed?"border-blue-400 bg-blue-50 dark:bg-blue-950/20":"border-neutral-200 dark:border-neutral-700 focus:border-[#e02020]"}`}/>
                )}
              </div>
            );
          })}

          {groupKeys.length === 0 && (
            <p className="text-neutral-400 text-sm text-center py-8">No settings in this group</p>
          )}

          {/* SMTP test panel */}
          {activeGroup === "smtp" && <SmtpTestPanel flat={flat} />}
        </div>
      </div>
    </div>
  );
}

function SmtpTestPanel({ flat }: { flat: Record<string,string> }) {
  const [to, setTo]         = useState("");
  const [sending, setSend]  = useState(false);
  const [result, setResult] = useState<{ok:boolean;msg:string}|null>(null);

  const configured = !!flat.smtp_host && !!flat.smtp_user;

  const send = async () => {
    if (!to) return;
    setSend(true); setResult(null);
    const r = await fetch("/api/email/test", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ to }) });
    const d = await r.json();
    setResult(d.ok ? { ok:true, msg:`Sent! Message ID: ${d.messageId?.slice(0,30) ?? "ok"}` } : { ok:false, msg: d.error ?? "Failed" });
    setSend(false);
  };

  return (
    <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center gap-2 mb-3">
        <Send size={15} className="text-[#e02020]"/>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Send Test Email</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${configured?"bg-green-100 text-green-700":"bg-orange-100 text-orange-600"}`}>
          {configured?"Configured":"Save SMTP host & user first"}
        </span>
      </div>
      <p className="text-xs text-neutral-400 mb-3">Save your SMTP settings, then send a test email to verify delivery.</p>
      <div className="flex gap-2">
        <input value={to} onChange={e=>setTo(e.target.value)} placeholder="recipient@email.com" type="email"
          className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
        <button onClick={send} disabled={sending||!to||!configured}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${(!to||!configured)?"bg-neutral-200 text-neutral-400 cursor-not-allowed":"bg-[#e02020] hover:bg-[#c01a1a] text-white"}`}>
          <Send size={14}/>{sending?"Sending…":"Send Test"}
        </button>
      </div>
      {result && (
        <div className={`mt-3 text-xs px-4 py-3 rounded-xl ${result.ok?"bg-green-50 text-green-700 border border-green-200":"bg-red-50 text-red-600 border border-red-200"}`}>
          {result.ok?"✅ ":"❌ "}{result.msg}
        </div>
      )}
    </div>
  );
}
