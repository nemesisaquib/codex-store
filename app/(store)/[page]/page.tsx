"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Ruler, Truck, RotateCcw, Package, HelpCircle, Mail, Building2,
  Briefcase, Newspaper, Users, Leaf, Shield, FileText, Cookie, ArrowRight, ChevronDown,
} from "lucide-react";

interface PageContent {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  body: React.ReactNode;
}

const FAQS = [
  { q: "How long does shipping take?", a: "Standard shipping takes 3–7 business days. Express (1–3 days) and Premium Overnight options are available at checkout." },
  { q: "What is your return policy?", a: "We accept returns within 30 days of delivery. Items must be unworn with original tags. Returns are free." },
  { q: "Do you ship internationally?", a: "Yes — we deliver to 40+ countries. International shipping rates and times are calculated at checkout." },
  { q: "How do I track my order?", a: "Once your order ships, you'll receive a tracking number by email. You can also view it in your account under Orders." },
  { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, PayPal, Apple Pay, Google Pay, and Klarna (Buy Now, Pay Later)." },
];

const SIZE_TABLE = {
  headers: ["Size", "Bust (in)", "Waist (in)", "Hips (in)"],
  rows: [
    ["XS", "31–32", "24–25", "34–35"],
    ["S",  "33–34", "26–27", "36–37"],
    ["M",  "35–36", "28–29", "38–39"],
    ["L",  "37–39", "30–32", "40–42"],
    ["XL", "40–42", "33–35", "43–45"],
    ["XXL","43–45", "36–38", "46–48"],
  ],
};

function buildContent(slug: string): PageContent | null {
  switch (slug) {
    case "size-guide":
      return {
        icon: Ruler, title: "Size Guide", subtitle: "Find your perfect fit",
        body: (
          <div className="space-y-6">
            <p className="text-neutral-600 dark:text-neutral-400">Measurements are in inches. If you're between sizes, we recommend sizing up for a relaxed fit.</p>
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-900">
                  <tr>{SIZE_TABLE.headers.map(h => <th key={h} className="px-5 py-3 text-left font-semibold text-neutral-900 dark:text-white">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {SIZE_TABLE.rows.map(r => (
                    <tr key={r[0]} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      {r.map((c,i) => <td key={i} className={`px-5 py-3 ${i===0?"font-bold text-[#e02020]":"text-neutral-600 dark:text-neutral-400"}`}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-400">Need help? <Link href="/contact" className="text-[#e02020] hover:underline">Contact our team</Link>.</p>
          </div>
        ),
      };
    case "track":
      return {
        icon: Package, title: "Track Your Order", subtitle: "Where's my package?",
        body: (
          <div className="space-y-5 max-w-md">
            <p className="text-neutral-600 dark:text-neutral-400">Enter your order number and email to see live tracking.</p>
            <input placeholder="Order number (e.g. COD-2026-XXXXX)" className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020]" />
            <input placeholder="Email address" type="email" className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020]" />
            <button className="w-full py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl text-sm transition-colors">Track Order</button>
            <p className="text-xs text-neutral-400">Logged in? View all orders in your <Link href="/account/orders" className="text-[#e02020] hover:underline">account</Link>.</p>
          </div>
        ),
      };
    case "returns":
      return {
        icon: RotateCcw, title: "Returns & Exchanges", subtitle: "Easy 30-day returns",
        body: (
          <div className="space-y-4 text-neutral-600 dark:text-neutral-400">
            <p>We want you to love your CODEX pieces. If something isn't right, return it within <strong className="text-neutral-900 dark:text-white">30 days</strong> for a full refund or exchange.</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Items must be unworn, unwashed, with original tags attached.</li>
              <li>Returns are <strong className="text-neutral-900 dark:text-white">free</strong> — we provide a prepaid label.</li>
              <li>Refunds are processed within 5–7 business days of receipt.</li>
              <li>Exchanges ship as soon as we receive your return.</li>
            </ul>
            <p>Start a return from your <Link href="/account/orders" className="text-[#e02020] hover:underline">order history</Link>.</p>
          </div>
        ),
      };
    case "shipping":
      return {
        icon: Truck, title: "Shipping Information", subtitle: "Fast, tracked delivery worldwide",
        body: (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              {[["Standard","3–7 days","FREE over $150"],["Express","1–3 days","$12.95"],["Overnight","Next day","$24.95"]].map(([n,t,p]) => (
                <div key={n} className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <p className="font-bold text-neutral-900 dark:text-white">{n}</p>
                  <p className="text-sm text-neutral-500 mt-1">{t}</p>
                  <p className="text-sm text-[#e02020] font-semibold mt-2">{p}</p>
                </div>
              ))}
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">We ship to 40+ countries. International duties and taxes are calculated at checkout. All orders are fully tracked.</p>
          </div>
        ),
      };
    case "faq":
      return {
        icon: HelpCircle, title: "Frequently Asked Questions", subtitle: "Answers to common questions",
        body: <FAQAccordion />,
      };
    case "contact":
      return {
        icon: Mail, title: "Contact Us", subtitle: "We're here to help",
        body: (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <input placeholder="Your name" className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020]" />
              <input placeholder="Email address" type="email" className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020]" />
              <textarea placeholder="How can we help?" rows={5} className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-[#e02020] resize-none" />
              <button className="w-full py-3 bg-[#e02020] hover:bg-[#c01a1a] text-white font-semibold rounded-xl text-sm transition-colors">Send Message</button>
            </div>
            <div className="space-y-5 text-sm text-neutral-600 dark:text-neutral-400">
              <div><p className="font-semibold text-neutral-900 dark:text-white mb-1">Email</p><p>support@codex-store.com</p></div>
              <div><p className="font-semibold text-neutral-900 dark:text-white mb-1">Phone</p><p>+1 (800) 555-CODEX</p></div>
              <div><p className="font-semibold text-neutral-900 dark:text-white mb-1">Hours</p><p>Mon–Fri, 9am–6pm EST</p></div>
              <div><p className="font-semibold text-neutral-900 dark:text-white mb-1">Headquarters</p><p>120 Fashion Ave, New York, NY 10001</p></div>
            </div>
          </div>
        ),
      };
    case "about":
      return {
        icon: Building2, title: "About CODEX", subtitle: "Wear the World",
        body: (
          <div className="space-y-4 text-neutral-600 dark:text-neutral-400 max-w-2xl">
            <p>CODEX is a premium global fashion house bringing together the finest designs from around the world. Founded on the belief that great style transcends borders, we curate collections that blend craftsmanship, sustainability, and modern sensibility.</p>
            <p>From our beginnings as a small studio to serving over 2 million customers across 120 countries, our mission remains unchanged: to help you wear the world with confidence.</p>
            <p>Every piece is selected for quality, designed to last, and made with respect for the people and planet behind it.</p>
          </div>
        ),
      };
    case "careers":
      return {
        icon: Briefcase, title: "Careers", subtitle: "Join the CODEX team",
        body: (
          <div className="space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">We're always looking for passionate people to join our growing team. Explore open roles across design, technology, operations, and customer experience.</p>
            <div className="space-y-3">
              {[["Senior Frontend Engineer","Remote · Full-time"],["Fashion Buyer","New York · Full-time"],["Customer Experience Lead","Remote · Full-time"],["Brand Designer","London · Full-time"]].map(([role,meta]) => (
                <div key={role} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#e02020] transition-colors group">
                  <div><p className="font-semibold text-neutral-900 dark:text-white">{role}</p><p className="text-xs text-neutral-400">{meta}</p></div>
                  <ArrowRight size={16} className="text-neutral-400 group-hover:text-[#e02020] group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        ),
      };
    case "press":
      return { icon: Newspaper, title: "Press", subtitle: "News & media",
        body: <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">For press inquiries, interviews, or media assets, reach our communications team at <a href="mailto:press@codex-store.com" className="text-[#e02020] hover:underline">press@codex-store.com</a>. Download our brand kit and latest releases.</p> };
    case "affiliates":
      return { icon: Users, title: "Affiliate Program", subtitle: "Earn with CODEX",
        body: <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">Partner with CODEX and earn up to 12% commission on every sale you refer. Join thousands of creators sharing the styles they love. Apply at <a href="mailto:affiliates@codex-store.com" className="text-[#e02020] hover:underline">affiliates@codex-store.com</a>.</p> };
    case "sustainability":
      return { icon: Leaf, title: "Sustainability", subtitle: "Fashion with a conscience",
        body: (
          <div className="space-y-4 text-neutral-600 dark:text-neutral-400 max-w-2xl">
            <p>We're committed to reducing our environmental footprint at every step. By 2027, we aim for 100% sustainably sourced materials and carbon-neutral shipping.</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Organic and recycled fabrics across 60% of our range</li>
              <li>Plastic-free, recyclable packaging</li>
              <li>Fair-wage partnerships with all manufacturers</li>
              <li>Carbon offset on every order</li>
            </ul>
          </div>
        ) };
    case "privacy":
      return { icon: Shield, title: "Privacy Policy", subtitle: "How we protect your data",
        body: <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">We respect your privacy. We collect only the data needed to process orders and improve your experience. We never sell your personal information. For full details on data collection, cookies, and your rights, contact <a href="mailto:privacy@codex-store.com" className="text-[#e02020] hover:underline">privacy@codex-store.com</a>.</p> };
    case "terms":
      return { icon: FileText, title: "Terms & Conditions", subtitle: "The rules of engagement",
        body: <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">By using CODEX, you agree to our terms of service covering orders, payments, returns, intellectual property, and acceptable use. These terms are governed by the laws of the State of New York. Last updated June 2026.</p> };
    case "cookies":
      return { icon: Cookie, title: "Cookie Policy", subtitle: "How we use cookies",
        body: <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl">We use cookies to keep you signed in, remember your cart, and understand how our site is used. You can manage cookie preferences in your browser settings. Essential cookies are required for the site to function.</p> };
    default:
      return null;
  }
}

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3 max-w-2xl">
      {FAQS.map((f, i) => (
        <div key={i} className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
            <span className="font-medium text-neutral-900 dark:text-white text-sm">{f.q}</span>
            <ChevronDown size={16} className={`text-neutral-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && <div className="px-5 pb-4 text-sm text-neutral-600 dark:text-neutral-400">{f.a}</div>}
        </div>
      ))}
    </div>
  );
}

export default function InfoPage() {
  const { page } = useParams<{ page: string }>();
  const content = buildContent(page);

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-[100px] px-6">
        <div className="text-center">
          <p className="font-display font-black text-5xl text-neutral-900 dark:text-white mb-2">404</p>
          <p className="text-neutral-500 mb-6">This page could not be found.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#e02020] text-white font-semibold rounded-full hover:bg-[#c01a1a] transition-colors">
            Back Home <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const { icon: Icon, title, subtitle, body } = content;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pt-[100px]">
      {/* Hero */}
      <div className="bg-neutral-950 text-white py-16 px-6 lg:px-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="w-12 h-12 rounded-xl bg-[#e02020]/15 flex items-center justify-center mb-4">
            <Icon size={22} className="text-[#e02020]" />
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl">{title}</h1>
          <p className="text-white/50 mt-2">{subtitle}</p>
        </div>
      </div>
      {/* Body */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
        {body}
      </div>
    </div>
  );
}
