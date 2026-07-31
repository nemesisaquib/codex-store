"use client";
import { useEffect, useState } from "react";
import { Users, Mail, Star, TrendingUp, Send, Download } from "lucide-react";

interface Customer { id:string;first_name:string;last_name:string;email:string;tier:string;loyalty_pts:number;country:string|null;total_orders:number;total_spend:number }

const TIER_COLOR: Record<string,string> = {
  vip:"bg-[#d4a017]/15 text-[#d4a017]", loyal:"bg-blue-100 text-blue-700",
  regular:"bg-neutral-100 text-neutral-500", new:"bg-green-100 text-green-700",
};

export default function AdminCrmPage() {
  const [data,      setData]      = useState<{vipCustomers:Customer[];newCustomers:Customer[];atRisk:Customer[];totalSubs:number;newsletter:Array<{email:string;created_at:string}>;messages?:Array<{id:number;name:string;email:string;message:string;status:string;created_at:string}>}|null>(null);
  const [tab,       setTab]       = useState<"segments"|"newsletter"|"inquiries">("segments");
  const [activeSegment, setSegment] = useState("vip");
  const [composeOpen, setComposeOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject:"", heading:"", body:"", ctaLabel:"", ctaUrl:"" });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{sent:number;failed:number}|null>(null);

  useEffect(() => {
    fetch("/api/admin/crm").then(r=>r.json()).then(setData);
  }, []);

  const sendCampaign = async () => {
    if (!emailForm.subject || !emailForm.body) return;
    const recipients = tab === "newsletter"
      ? data?.newsletter?.map(s => s.email) ?? []
      : segmentData[activeSegment]?.customers?.map(c => c.email) ?? [];
    if (recipients.length === 0) return;

    setSending(true);
    setSendResult(null);

    const cta = emailForm.ctaLabel && emailForm.ctaUrl ? { label: emailForm.ctaLabel, url: emailForm.ctaUrl } : undefined;
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients, subject: emailForm.subject, heading: emailForm.heading || emailForm.subject, body: emailForm.body, cta }),
    });
    const d = await res.json();
    setSendResult({ sent: d.sent ?? 0, failed: d.failed ?? 0 });
    setSending(false);
  };

  const segmentData: Record<string, {customers:Customer[];label:string;color:string;desc:string}> = data ? {
    vip:     { customers: data.vipCustomers,  label:"VIP",     color:"#d4a017", desc:"Top 5% by spend · Exclusive benefits & early access" },
    new:     { customers: data.newCustomers,  label:"New",     color:"#22c55e", desc:"Registered ≤30 days · Welcome email series" },
    at_risk: { customers: data.atRisk.slice(0,5), label:"At Risk", color:"#ef4444", desc:"No order in 90+ days · Win-back campaigns" },
  } : {};

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 dark:text-white">CRM &amp; Email</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Customer segments, lifecycle management and newsletter</p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Send size={14}/> Compose Email
        </button>
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setComposeOpen(false)}/>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div style={{maxWidth:"1140px"}} className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900">
                <h2 className="font-semibold text-neutral-900 dark:text-white">Compose Email Campaign</h2>
                <button onClick={() => setComposeOpen(false)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs">
                  <p className="font-semibold text-blue-700 dark:text-blue-400">📨 Recipients</p>
                  <p className="text-blue-600 dark:text-blue-300 mt-1">
                    {tab === "newsletter"
                      ? `${data?.totalSubs ?? 0} newsletter subscribers`
                      : `${segmentData[activeSegment]?.customers?.length ?? 0} ${segmentData[activeSegment]?.label?.toLowerCase()} customers`}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Subject *</label>
                  <input type="text" value={emailForm.subject} onChange={e=>setEmailForm(p=>({...p,subject:e.target.value}))}
                    placeholder="e.g. New collection just dropped"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Heading</label>
                  <input type="text" value={emailForm.heading} onChange={e=>setEmailForm(p=>({...p,heading:e.target.value}))}
                    placeholder="Email body heading (defaults to subject)"
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">Body *</label>
                  <textarea value={emailForm.body} onChange={e=>setEmailForm(p=>({...p,body:e.target.value}))}
                    placeholder="<p>Hi there,</p><p>We have something special for you...</p>"
                    rows={6}
                    className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020] resize-none font-mono-brand"/>
                  <p className="text-[10px] text-neutral-400 mt-1">HTML supported. Wrap paragraphs in &lt;p&gt; tags.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">CTA Label</label>
                    <input type="text" value={emailForm.ctaLabel} onChange={e=>setEmailForm(p=>({...p,ctaLabel:e.target.value}))}
                      placeholder="Shop Now"
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1.5">CTA URL</label>
                    <input type="url" value={emailForm.ctaUrl} onChange={e=>setEmailForm(p=>({...p,ctaUrl:e.target.value}))}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 focus:outline-none focus:border-[#e02020]"/>
                  </div>
                </div>

                {sendResult && (
                  <div className={`p-3 rounded-xl text-xs ${sendResult.failed > 0 ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                    ✓ Sent to {sendResult.sent} {sendResult.failed > 0 && `· ${sendResult.failed} failed`}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setComposeOpen(false)} className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium hover:border-neutral-400 transition-colors">
                    Cancel
                  </button>
                  <button onClick={sendCampaign} disabled={sending || !emailForm.subject || !emailForm.body}
                    className={`flex-1 px-4 py-2.5 ${sending || !emailForm.subject || !emailForm.body ? "bg-neutral-300 text-neutral-500" : "bg-[#e02020] hover:bg-[#c01a1a] text-white"} rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2`}>
                    <Send size={14}/> {sending ? "Sending…" : "Send Campaign"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {Icon:Users,     label:"VIP Customers",    value:String(data?.vipCustomers?.length??0),  color:"#d4a017"},
          {Icon:TrendingUp,label:"Loyal Customers",  value:String(data?.atRisk?.length??0),         color:"#3b82f6"},
          {Icon:Star,      label:"New Customers",    value:String(data?.newCustomers?.length??0),   color:"#22c55e"},
          {Icon:Mail,      label:"Newsletter Subs",  value:String(data?.totalSubs??0),              color:"#e02020"},
        ].map(({Icon,label,value,color}) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:`${color}18`}}>
              <Icon size={18} style={{color}}/>
            </div>
            <p className="font-display font-black text-2xl text-neutral-900 dark:text-white">{value}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {(["segments","newsletter","inquiries"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-colors ${tab===t?"bg-[#e02020] text-white":"bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-700 hover:text-[#e02020]"}`}>
            {t==="segments"?"Customer Segments":t==="newsletter"?"Newsletter List":"Inquiries"}
          </button>
        ))}
      </div>

      {tab === "segments" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Segment selector */}
          <div className="space-y-3">
            {Object.entries(segmentData).map(([key, seg]) => (
              <button key={key} onClick={()=>setSegment(key)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${activeSegment===key?"border-[#e02020] bg-[#e02020]/5":"border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 bg-white dark:bg-neutral-900"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_COLOR[key]??TIER_COLOR.regular}`}>{seg.label}</span>
                  <span className="font-display font-black text-xl text-neutral-900 dark:text-white">{seg.customers.length}</span>
                </div>
                <p className="text-xs text-neutral-500">{seg.desc}</p>
              </button>
            ))}
          </div>

          {/* Segment customers */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-semibold text-neutral-900 dark:text-white capitalize text-sm">{segmentData[activeSegment]?.label} Customers</h3>
              <button className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#e02020] transition-colors">
                <Download size={12}/> Export
              </button>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {(segmentData[activeSegment]?.customers ?? []).map(c => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e02020] to-[#7d1111] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.first_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-neutral-400 truncate">{c.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">${c.total_spend.toLocaleString()}</p>
                    <p className="text-[10px] text-neutral-400">{c.total_orders} orders</p>
                  </div>
                  <button className="p-2 text-neutral-400 hover:text-[#e02020] transition-colors flex-shrink-0">
                    <Send size={13}/>
                  </button>
                </div>
              ))}
              {(segmentData[activeSegment]?.customers ?? []).length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-neutral-400">No customers in this segment</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "newsletter" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Newsletter Subscribers ({data?.totalSubs??0})</h3>
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-[#e02020] transition-colors">
              <Download size={12}/> Export CSV
            </button>
          </div>
          {(data?.newsletter?.length ?? 0) === 0 ? (
            <div className="py-16 text-center">
              <Mail size={36} className="mx-auto text-neutral-200 mb-3"/>
              <p className="text-neutral-400 text-sm">No subscribers yet</p>
              <p className="text-neutral-300 text-xs mt-1">Subscribers will appear here when they sign up via the footer</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>{["Email","Subscribed On","Status"].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data?.newsletter?.map((s,i) => (
                  <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-neutral-900 dark:text-white">{s.email}</td>
                    <td className="px-5 py-3 text-xs text-neutral-500">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3"><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Subscribed</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "inquiries" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Customer Inquiries ({data?.messages?.length??0})</h3>
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-[#e02020] transition-colors">
              <Download size={12}/> Export CSV
            </button>
          </div>
          {(data?.messages?.length ?? 0) === 0 ? (
            <div className="py-16 text-center">
              <Mail size={36} className="mx-auto text-neutral-200 mb-3"/>
              <p className="text-neutral-400 text-sm">No messages yet</p>
              <p className="text-neutral-300 text-xs mt-1">Inquiries from the contact form will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {data?.messages?.map((m) => (
                <div key={m.id} className="p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white text-sm font-bold flex-shrink-0">
                        {m.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{m.name}</p>
                        <p className="text-xs text-neutral-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${m.status === 'unread' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {m.status.toUpperCase()}
                      </span>
                      <p className="text-[10px] text-neutral-400 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="pl-13 ml-13 mt-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                      {m.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
