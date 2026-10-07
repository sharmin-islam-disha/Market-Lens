"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-black text-[#ca1551] tracking-tight">Market</span>
          <span className="text-2xl font-black text-gray-900 tracking-tight">Lens</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-[#ca1551] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#ca1551] transition-colors">How It Works</a>
          <a href="#about" className="hover:text-[#ca1551] transition-colors">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-[#ca1551] transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/register" className="text-sm font-semibold text-white bg-[#ca1551] hover:bg-[#a61142] px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white pt-20 pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-[#ca1551] bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ca1551]"></span>
              ACI Retail Execution Intelligence
            </span>
            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
              Smarter Shelf<br />
              Audits.{" "}
              <span className="text-[#ca1551]">Faster</span><br />
              Decisions.
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              MarketLens empowers ACI field teams to capture shelf data, detect SKUs with AI Vision, track shelf share, and act on real-time recommendations — all from a single platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="px-7 py-3.5 bg-[#ca1551] hover:bg-[#a61142] text-white font-bold rounded-xl transition-colors text-sm shadow-md shadow-rose-200">
                Start for Free
              </Link>
              <Link href="/login" className="px-7 py-3.5 border border-gray-200 hover:border-[#ca1551] text-gray-700 hover:text-[#ca1551] font-bold rounded-xl transition-colors text-sm">
                Sign In →
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">For ACI field representatives and supervisors.</p>
          </div>

          {/* Right — hero image */}
          <div className="relative">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative shadow-xl">
              <Image src="/image.png" alt="ACI field rep auditing shelf with MarketLens" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
            {/* Floating stat cards */}
            <div className="absolute -bottom-4 -left-4 bg-white border border-gray-100 shadow-lg rounded-2xl px-4 py-3 text-left">
              <p className="text-xs text-gray-400 font-medium">ACI Shelf Share</p>
              <p className="text-2xl font-black text-[#ca1551]">68%</p>
              <p className="text-[10px] text-emerald-500 font-semibold">↑ +12% this week</p>
            </div>
            <div className="absolute -top-4 -right-4 bg-white border border-gray-100 shadow-lg rounded-2xl px-4 py-3 text-left">
              <p className="text-xs text-gray-400 font-medium">Audits Today</p>
              <p className="text-2xl font-black text-gray-900">24</p>
              <p className="text-[10px] text-blue-500 font-semibold">Across 8 outlets</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos / trust bar ── */}
      <section className="border-y border-gray-100 py-6 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Built for ACI brands across channels</p>
          {/* Image placeholder for brand/channel logos */}
          <div className="w-full h-12 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
            <p className="text-xs text-gray-400">Brand / Channel Logos — e.g. Supermarket · Hypermarket · General Trade</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#ca1551] uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Everything your field team needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              From shelf capture to actionable insights — MarketLens covers the full retail execution cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                ),
                title: "AI Shelf Capture",
                desc: "Upload a shelf photo and AI Vision instantly detects every SKU, brand, and facing count — no manual counting required.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
                title: "Shelf Share Analytics",
                desc: "Real-time ACI vs. competitor shelf share tracking across outlets, cities, and product categories.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Smart Recommendations",
                desc: "Auto-generated stock-out alerts, shelf share gap flags, and missing distribution warnings assigned to your field team.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
                title: "Outlet Management",
                desc: "Manage your entire outlet universe — supermarkets, hypermarkets, general trade — with full visit history.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                ),
                title: "SKU Catalog",
                desc: "Maintain your full ACI and competitor SKU master catalog with MRP, category, and target shelf share targets.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
                title: "Field Rep Tracking",
                desc: "Log field visits, assign audits, and track rep performance across outlets and territories.",
              },
            ].map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-gray-100 hover:border-rose-100 hover:shadow-md transition-all bg-white">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#ca1551] flex items-center justify-center mb-4 group-hover:bg-[#ca1551] group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#ca1551] uppercase tracking-widest mb-3">Workflow</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">How MarketLens works</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              A simple, repeatable process for consistent retail execution across every outlet visit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Log Visit", desc: "Field rep checks in at the outlet and logs the visit with outlet and date." },
              { step: "02", title: "Capture Shelf", desc: "Take a photo of the shelf. AI Vision detects all SKUs, brands, and facings instantly." },
              { step: "03", title: "Review Insights", desc: "Shelf share, stock-outs, and POSM compliance are calculated automatically." },
              { step: "04", title: "Take Action", desc: "Act on AI-generated recommendations to improve ACI shelf presence." },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-rose-200 to-transparent z-0" />
                )}
                <div className="relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="text-4xl font-black text-rose-100 mb-4">{s.step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Screenshot */}
          <div className="mt-16 w-full aspect-video rounded-2xl overflow-hidden relative shadow-lg">
            <Image src="/image copy.png" alt="MarketLens analytics dashboard" fill sizes="100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ── About / Mission ── */}
      <section id="about" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* About / Team Image */}
          <div className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-xl">
            <Image src="/images/image.png" alt="ACI field team" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>

          {/* Copy */}
          <div>
            <p className="text-xs font-bold text-[#ca1551] uppercase tracking-widest mb-4">About MarketLens</p>
            <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
              Built by ACI.<br />For ACI field teams.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              MarketLens was purpose-built for ACI Limited's retail execution teams to bring precision and speed to in-store auditing. Our platform replaces manual clipboard counts with AI-powered shelf intelligence — giving field reps and supervisors real-time visibility into shelf performance across Bangladesh.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              From Dhaka's supermarket chains to general trade outlets in Chittagong, MarketLens ensures ACI's products are always visible, available, and winning on the shelf.
            </p>
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "100+", label: "Outlets Tracked" },
                { value: "500+", label: "Audits per Month" },
                { value: "98%", label: "Detection Accuracy" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-black text-[#ca1551]">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-[#ca1551]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to transform your shelf execution?</h2>
          <p className="text-rose-100 text-sm leading-relaxed mb-10 max-w-xl mx-auto">
            Join ACI's field teams already using MarketLens to drive smarter in-store decisions every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-4 bg-white text-[#ca1551] font-black rounded-xl hover:bg-rose-50 transition-colors text-sm shadow-lg">
              Get Started Free
            </Link>
            <Link href="/login" className="px-8 py-4 border-2 border-white/40 text-white font-bold rounded-xl hover:border-white transition-colors text-sm">
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 px-8 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xl font-black text-[#ca1551]">Market</span>
              <span className="text-xl font-black text-white">Lens</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              AI-powered retail execution intelligence for ACI field teams.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Platform</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Company</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              <li><span className="text-gray-600">ACI Limited, Bangladesh</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} ACI Limited. All rights reserved.</p>
          <p className="text-xs text-gray-600">MarketLens &mdash; Retail Execution Intelligence</p>
        </div>
      </footer>

    </div>
  );
}
