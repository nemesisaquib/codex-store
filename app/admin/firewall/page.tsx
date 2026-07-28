"use client";
import { useEffect, useState } from "react";
import { 
  Shield, ShieldAlert, ShieldCheck, Activity, Trash2, Plus, 
  RefreshCw, Globe, AlertOctagon, CheckCircle2, Sliders, Filter 
} from "lucide-react";

interface FirewallLog {
  id: number;
  ip: string;
  method: string;
  url: string;
  country: string;
  rule: string;
  action: string;
  created_at: string;
}

interface CustomRule {
  id: number;
  type: string;
  target: string;
  value: string;
  reason: string;
  created_at: string;
}

interface FirewallStats {
  totalBlocked: number;
  totalChallenged: number;
  wafCount: number;
  botCount: number;
  rateCount: number;
  geoDistribution: { country: string; count: number }[];
}

export default function AdminFirewallPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<FirewallLog[]>([]);
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [stats, setStats] = useState<FirewallStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState<string | null>(null);
  
  // Custom rule form state
  const [newRule, setNewRule] = useState({
    type: "blacklist",
    target: "ip",
    value: "",
    reason: ""
  });
  const [addingRule, setAddingRule] = useState(false);
  const [searchLogQuery, setSearchLogQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/firewall");
      const data = await res.json();
      if (!data.error) {
        setSettings(data.settings || {});
        setLogs(data.logs || []);
        setRules(data.rules || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    setSavingSettings(key);
    try {
      const res = await fetch("/api/admin/firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", key, value: newValue })
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: newValue }));
        // Refresh statistics to keep sync
        const resStats = await fetch("/api/admin/firewall");
        const freshData = await resStats.json();
        setStats(freshData.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(null);
    }
  };

  const handleTextChange = async (key: string, value: string) => {
    setSavingSettings(key);
    try {
      const res = await fetch("/api/admin/firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", key, value })
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(null);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.value) return;
    setAddingRule(true);
    try {
      const res = await fetch("/api/admin/firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_rule", rule: newRule })
      });
      if (res.ok) {
        setNewRule({ type: "blacklist", target: "ip", value: "", reason: "" });
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      const res = await fetch("/api/admin/firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_rule", ruleId })
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all firewall logs?")) return;
    try {
      const res = await fetch("/api/admin/firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_logs" })
      });
      if (res.ok) {
        setLogs([]);
        if (stats) {
          setStats({
            ...stats,
            totalBlocked: 0,
            totalChallenged: 0,
            wafCount: 0,
            botCount: 0,
            rateCount: 0,
            geoDistribution: []
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const query = searchLogQuery.toLowerCase();
    return (
      log.ip.toLowerCase().includes(query) ||
      log.country.toLowerCase().includes(query) ||
      log.rule.toLowerCase().includes(query) ||
      log.url.toLowerCase().includes(query)
    );
  });

  // Security score builder
  const getSecurityScore = () => {
    let score = 100;
    if (settings.waf_enabled !== "true") score -= 25;
    if (settings.bot_block_enabled !== "true") score -= 25;
    if (settings.ddos_shield_enabled !== "true") score -= 25;
    if (settings.api_limit_enabled !== "true") score -= 15;
    return score;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw size={24} className="text-[#e02020] animate-spin" />
        <p className="text-xs text-neutral-400 font-bold tracking-wider uppercase">Loading security gateway config...</p>
      </div>
    );
  }

  const score = getSecurityScore();

  return (
    <div className="space-y-6 w-full">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Shield size={24} className="text-[#e02020]" />
            GlobalShield Firewall
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Configure Web Application Firewall rules, DDoS shields, and block intrusion attempts globally.</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all font-semibold"
        >
          <RefreshCw size={12} />
          Refresh Stats
        </button>
      </div>

      {/* Grid: Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Score */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Security Score</p>
            <p className="text-2xl font-black font-display text-neutral-900 dark:text-white">{score}/100</p>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
              score >= 90 ? "bg-green-500/10 text-green-500" : score >= 60 ? "bg-orange-500/10 text-orange-500" : "bg-red-500/10 text-red-500"
            }`}>
              {score >= 90 ? "Excellent" : score >= 60 ? "Warning" : "Critical Risk"}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            score >= 90 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          }`}>
            {score >= 90 ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </div>
        </div>

        {/* Card 2: Total Blocked */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Total Intrusions Blocked</p>
            <p className="text-2xl font-black font-display text-[#e02020]">{stats?.totalBlocked || 0}</p>
            <span className="text-[10px] text-neutral-400 font-bold">Active in past 30 days</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
            <AlertOctagon size={24} />
          </div>
        </div>

        {/* Card 3: Rate Limiter challenged */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">DDoS Shield Challenges</p>
            <p className="text-2xl font-black font-display text-neutral-900 dark:text-white">{stats?.totalChallenged || 0}</p>
            <span className="text-[10px] text-neutral-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              Auto-Scaling Enabled
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#e02020]/10 text-[#e02020] flex items-center justify-center flex-shrink-0">
            <Activity size={24} />
          </div>
        </div>

        {/* Card 4: Top Geo Origin */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Top Threat Source</p>
            <p className="text-2xl font-black font-display text-neutral-900 dark:text-white">
              {stats?.geoDistribution?.[0]?.country || "None"}
            </p>
            <span className="text-[10px] text-neutral-400 font-bold">
              {stats?.geoDistribution?.[0] ? `${stats.geoDistribution[0].count} blocked hits` : "No attacks logged"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center flex-shrink-0">
            <Globe size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Settings (Left) & Custom Rules (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Firewall Settings Controls */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Sliders size={16} className="text-[#e02020]" />
            <h2 className="text-sm font-bold tracking-wide uppercase text-neutral-900 dark:text-white">Firewall Protection Toggles</h2>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: WAF */}
            <div className="flex items-center justify-between p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl hover:border-neutral-200 dark:hover:border-neutral-700 transition-all">
              <div className="space-y-1 pr-4">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Web Application Firewall (WAF)</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">Blocks common OWASP Top 10 exploits, including SQL Injections, Cross-Site Scripting (XSS), and Local Path Traversal.</p>
              </div>
              <button 
                onClick={() => handleToggle("waf_enabled", settings.waf_enabled)}
                disabled={savingSettings === "waf_enabled"}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors flex-shrink-0 ${
                  settings.waf_enabled === "true" ? "bg-[#e02020]" : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              >
                <span className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  settings.waf_enabled === "true" ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Toggle 2: Bot Blocker */}
            <div className="flex items-center justify-between p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl hover:border-neutral-200 dark:hover:border-neutral-700 transition-all">
              <div className="space-y-1 pr-4">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Bot Management & Crawler Shield</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">Instantly blocks malicious web crawlers, search scanners, headless bots, and credential stuffing vectors.</p>
              </div>
              <button 
                onClick={() => handleToggle("bot_block_enabled", settings.bot_block_enabled)}
                disabled={savingSettings === "bot_block_enabled"}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors flex-shrink-0 ${
                  settings.bot_block_enabled === "true" ? "bg-[#e02020]" : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              >
                <span className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  settings.bot_block_enabled === "true" ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Toggle 3: DDoS Shield */}
            <div className="flex items-center justify-between p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl hover:border-neutral-200 dark:hover:border-neutral-700 transition-all">
              <div className="space-y-1 pr-4">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">DDoS Mitigation & Rate Limiter</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">Challenges or rejects requests from IPs that exceed safe request thresholds, preserving origin server resources during spikes.</p>
              </div>
              <button 
                onClick={() => handleToggle("ddos_shield_enabled", settings.ddos_shield_enabled)}
                disabled={savingSettings === "ddos_shield_enabled"}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors flex-shrink-0 ${
                  settings.ddos_shield_enabled === "true" ? "bg-[#e02020]" : "bg-neutral-200 dark:bg-neutral-800"
                }`}
              >
                <span className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  settings.ddos_shield_enabled === "true" ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Config Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Rate Limit Throttle (Requests / Min)</label>
                <input 
                  type="number"
                  defaultValue={settings.rate_limit_rpm || "60"}
                  onBlur={(e) => handleTextChange("rate_limit_rpm", e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 px-4 py-2.5 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 focus:bg-white dark:focus:bg-neutral-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Geographic Ban (Country Codes)</label>
                <input 
                  type="text"
                  placeholder="e.g. KP, IR, SY"
                  defaultValue={settings.blocked_countries || ""}
                  onBlur={(e) => handleTextChange("blocked_countries", e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 px-4 py-2.5 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 focus:bg-white dark:focus:bg-neutral-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Rules Builder */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Plus size={16} className="text-[#e02020]" />
            <h2 className="text-sm font-bold tracking-wide uppercase text-neutral-900 dark:text-white">Custom Guard Rules</h2>
          </div>

          <form onSubmit={handleAddRule} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select 
                value={newRule.type}
                onChange={(e) => setNewRule(p => ({ ...p, type: e.target.value }))}
                className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 px-3 py-2 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
              >
                <option value="blacklist">Blacklist</option>
                <option value="whitelist">Whitelist</option>
              </select>

              <select 
                value={newRule.target}
                onChange={(e) => setNewRule(p => ({ ...p, target: e.target.value }))}
                className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 px-3 py-2 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
              >
                <option value="ip">IP Address</option>
                <option value="country">Country Code</option>
              </select>
            </div>

            <input 
              type="text" 
              placeholder={newRule.target === "ip" ? "e.g. 192.168.1.50" : "e.g. CN"}
              value={newRule.value}
              onChange={(e) => setNewRule(p => ({ ...p, value: e.target.value }))}
              required
              className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 px-3 py-2 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
            />

            <input 
              type="text" 
              placeholder="Reason / Notes"
              value={newRule.reason}
              onChange={(e) => setNewRule(p => ({ ...p, reason: e.target.value }))}
              className="w-full bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 px-3 py-2 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
            />

            <button 
              type="submit" 
              disabled={addingRule || !newRule.value}
              className="w-full py-2 bg-[#e02020] hover:bg-[#c01a1a] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              {addingRule ? "Deploying..." : "Add Firewall Rule"}
            </button>
          </form>

          {/* Active Rules List */}
          <div className="space-y-2 max-h-[170px] overflow-y-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <h3 className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Active Custom Rules</h3>
            {rules.length === 0 ? (
              <p className="text-[11px] text-neutral-400 italic">No custom whitelist or blacklist rules added.</p>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black uppercase px-1 rounded-sm ${
                        rule.type === "whitelist" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {rule.type}
                      </span>
                      <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                        {rule.target.toUpperCase()}: {rule.value}
                      </p>
                    </div>
                    {rule.reason && <p className="text-[10px] text-neutral-400">{rule.reason}</p>}
                  </div>
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                    title="Delete Rule"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Section: Live Threats Map List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-6">
        
        {/* Title & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-[#e02020]" />
            <h2 className="text-sm font-bold tracking-wide uppercase text-neutral-900 dark:text-white">Intrusion Logs & Block Records</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-2.5 text-neutral-400" size={12} />
              <input 
                type="text" 
                placeholder="Filter logs by IP, Country, Rule..."
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 w-64 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl text-[11px] focus:outline-none focus:border-neutral-400 text-neutral-900 dark:text-white"
              />
            </div>
            <button 
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-xl text-[11px] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-950 dark:hover:bg-red-950/20"
            >
              <Trash2 size={11} />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Table of logs */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CheckCircle2 size={32} className="text-green-500 mx-auto" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">System Secure</h3>
              <p className="text-[11px] text-neutral-400">No malicious threats detected or matching the active filter.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Country</th>
                  <th className="pb-3">IP Address</th>
                  <th className="pb-3">Request URL</th>
                  <th className="pb-3">Triggered Rule</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="text-xs hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-all">
                    <td className="py-3.5 pl-2 font-bold text-neutral-500 flex items-center gap-2">
                      <span className="w-5 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm text-[9px] flex items-center justify-center font-black">
                        {log.country}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-neutral-950 dark:text-neutral-50">
                      {log.ip}
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate text-neutral-400" title={log.url}>
                      <span className="text-[10px] font-black uppercase text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded-sm mr-1.5">{log.method}</span>
                      {log.url}
                    </td>
                    <td className="py-3.5 font-semibold text-neutral-800 dark:text-neutral-200">
                      {log.rule}
                    </td>
                    <td className="py-3.5 text-neutral-400 text-[10px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        log.action === "BLOCKED" ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-orange-500/10 text-orange-500"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
