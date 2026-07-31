"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Settings, Bell, LogOut, Search, Tag, Globe, Shield,
  Warehouse, Mail, ChevronDown, ChevronRight, Store,
  X, Menu, AlertTriangle, UserPlus, Check, MapPin, FolderTree, Bookmark, FileText, Image as ImageIcon
} from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";

const NOTIF_ICON: Record<string, typeof Bell> = {
  "shopping-cart": ShoppingCart, "alert-triangle": AlertTriangle,
  "user-plus": UserPlus, "mail": Mail,
};

interface Notif { id:string; type:string; title:string; body:string; time:string; href:string; icon:string }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

const NAV = [
  { href:"/admin",             icon:LayoutDashboard, label:"Dashboard",   badge:null },
  { href:"/admin/orders",      icon:ShoppingCart,    label:"Orders",      badge:"3"  },
  { href:"/admin/products",    icon:Package,         label:"Products",    badge:null },
  { href:"/admin/groceries",   icon:Store,           label:"Fresh Groceries", badge:"Fresh" },
  { href:"/admin/categories",  icon:FolderTree,      label:"Categories",  badge:null },
  { href:"/admin/brands",      icon:Bookmark,        label:"Brands",      badge:null },
  { href:"/admin/media",       icon:ImageIcon,       label:"Media Library", badge:"New" },
  { href:"/admin/blog",        icon:FileText,        label:"Blog CMS",    badge:null },
  { href:"/admin/inventory",   icon:Warehouse,       label:"Inventory",   badge:"12" },
  { href:"/admin/customers",   icon:Users,           label:"Customers",   badge:null },
  { href:"/admin/countries",   icon:MapPin,          label:"Countries",   badge:null },
  { href:"/admin/promotions",  icon:Tag,             label:"Promotions",  badge:null },
  { href:"/admin/seo",         icon:Globe,           label:"SEO & AI",    badge:null },
  { href:"/admin/crm",         icon:Mail,            label:"CRM & Email", badge:null },
  { href:"/admin/analytics",   icon:BarChart3,       label:"Analytics",   badge:null },
  { href:"/admin/firewall",    icon:Shield,          label:"Firewall",    badge:null },
  { href:"/admin/settings",    icon:Settings,        label:"Settings",    badge:null },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { settings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState("Aquib");
  const [notifs, setNotifs]   = useState<Notif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_read_notifs");
      if (saved) setReadIds(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const saveReadIds = (newSet: Set<string>) => {
    setReadIds(newSet);
    try {
      localStorage.setItem("admin_read_notifs", JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  useEffect(() => {
    fetch("/api/auth/admin").then(r=>r.json()).then(d=>{ if(d.admin?.name) setAdminName(d.admin.name); }).catch(()=>{});
  },[]);

  // Poll notifications every 5s
  useEffect(() => {
    const load = () => fetch("/api/admin/notifications").then(r=>r.json()).then(d=>setNotifs(d.notifications??[])).catch(()=>{});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const unreadCount = notifs.filter(n => !readIds.has(n.id)).length;
  const markAllRead = () => saveReadIds(new Set(notifs.map(n=>n.id)));

  const logout = async () => {
    await fetch("/api/auth/admin", { method:"DELETE" });
    window.location.href = "/admin/login";
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b border-neutral-800 ${collapsed?"justify-center":""}`}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-neutral-900">
          <img src={settings.store_logo || (settings as any).logo_url || "/Logo/Eshop.png"} alt="Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-display font-black text-white text-base leading-none">{settings.store_name || "E-shop"}</p>
            <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mt-0.5">Admin</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {NAV.map(({ href, icon:Icon, label, badge }) => {
          const active = path === href || (href !== "/admin" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative
                ${active
                  ? "bg-[#e02020] text-white"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }
                ${collapsed ? "justify-center" : ""}
              `}>
              <Icon size={16} className="flex-shrink-0"/>
              {!collapsed && <span className="flex-1 font-medium">{label}</span>}
              {!collapsed && badge && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active?"bg-white/20 text-white":"bg-[#e02020] text-white"}`}>
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#e02020] rounded-full"/>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={`p-3 border-t border-neutral-800 space-y-1 ${collapsed?"items-center flex flex-col":""}`}>
        <div className={`flex items-center gap-3 px-3 py-2.5 ${collapsed?"justify-center":""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e02020] to-[#7d1111] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {adminName[0]}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{adminName}</p>
              <p className="text-[10px] text-neutral-500">Super Admin</p>
            </div>
          )}
        </div>
        <button onClick={logout}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full ${collapsed?"justify-center":""}`}>
          <LogOut size={15}/>
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </>
  );

  if (path === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="admin-scope min-h-screen bg-neutral-100 dark:bg-neutral-950 flex">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-neutral-950 transition-all duration-300 flex-shrink-0 ${collapsed?"w-16":"w-56"}`}
        style={{position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
        <SidebarContent/>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[500] lg:hidden flex">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setMobileOpen(false)}/>
          <div className="relative w-64 bg-neutral-950 flex flex-col h-full shadow-2xl">
            <SidebarContent/>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-5 sticky top-0 z-40 gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button onClick={()=>setMobileOpen(!mobileOpen)} className="lg:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl">
              {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
            </button>
            {/* Collapse toggle */}
            <button onClick={()=>setCollapsed(!collapsed)} className="hidden lg:flex p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-400">
              {collapsed ? <ChevronRight size={16}/> : <ChevronDown size={16} style={{transform:"rotate(-90deg)"}}/>}
            </button>
            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm text-neutral-500">
              <Link href="/admin" className="hover:text-[#e02020] transition-colors font-medium">Admin</Link>
              {path !== "/admin" && (
                <>
                  <span>/</span>
                  <span className="text-neutral-900 dark:text-white capitalize font-medium">
                    {path.split("/admin/")[1]?.split("/")[0] ?? ""}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Global search */}
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/>
              <input placeholder="Search…" className="pl-8 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs w-48 focus:outline-none focus:border-[#e02020] transition-colors"/>
            </div>
            {/* Notifications */}
            <div className="relative">
              <button onClick={()=>setNotifOpen(!notifOpen)}
                className="relative p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                <Bell size={17}/>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#e02020] text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={()=>setNotifOpen(false)}/>
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-[#e02020] hover:underline font-medium">
                          <Check size={11}/> Mark all read
                        </button>
                      )}
                    </div>
                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={28} className="mx-auto text-neutral-200 mb-2"/>
                          <p className="text-xs text-neutral-400">No notifications</p>
                        </div>
                      ) : notifs.map(n => {
                        const Icon = NOTIF_ICON[n.icon] ?? Bell;
                        const unread = !readIds.has(n.id);
                        const tone = n.type==="stock" ? "#f59e0b" : n.type==="order" ? "#e02020" : n.type==="customer" ? "#22c55e" : "#3b82f6";
                        return (
                          <Link key={n.id} href={n.href} onClick={()=>{setNotifOpen(false); saveReadIds(new Set(readIds).add(n.id));}}
                            className={`flex gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-50 dark:border-neutral-800/50 ${unread?"bg-[#e02020]/[0.03]":""}`}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:`${tone}18`}}>
                              <Icon size={14} style={{color:tone}}/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-neutral-900 dark:text-white leading-snug">{n.title}</p>
                              <p className="text-[11px] text-neutral-400 truncate">{n.body}</p>
                              <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-0.5">{timeAgo(n.time)}</p>
                            </div>
                            {unread && <span className="w-2 h-2 bg-[#e02020] rounded-full flex-shrink-0 mt-1.5"/>}
                          </Link>
                        );
                      })}
                    </div>
                    {/* Footer */}
                    <Link href="/admin/orders" onClick={()=>setNotifOpen(false)}
                      className="block px-4 py-3 text-center text-xs font-semibold text-[#e02020] hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-t border-neutral-100 dark:border-neutral-800">
                      View all activity
                    </Link>
                  </div>
                </>
              )}
            </div>
            {/* View store */}
            <Link href="/" target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-[#e02020] hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors">
              <Store size={14}/> View Store
            </Link>
            {/* Top Logout Button */}
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
