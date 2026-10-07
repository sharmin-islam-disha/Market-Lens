"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-[#ca1551] tracking-tight">Market</span>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">Lens</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#ca1551] transition-colors">
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-white bg-[#ca1551] hover:bg-[#a61142] px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-rose-50 text-[#ca1551] text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-rose-100">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ca1551] inline-block"></span>
          ACI Retail Execution Intelligence
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight max-w-3xl mb-6">
          AI-Powered Shelf Audits,{" "}
          <span className="text-[#ca1551]">In the Field</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mb-10 leading-relaxed">
          Capture shelf images, detect SKUs, track ACI shelf share, and generate
          actionable recommendations — all powered by AI Vision.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
          <Link
            href="/register"
            className="px-8 py-3 bg-[#ca1551] hover:bg-[#a61142] text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Register as Field Rep
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-gray-200 hover:border-[#ca1551] text-gray-700 hover:text-[#ca1551] font-semibold rounded-lg transition-colors text-sm"
          >
            Sign In
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            {
              icon: "📸",
              title: "Shelf Capture",
              desc: "Snap a shelf photo and AI Vision instantly identifies every SKU, brand, and facing count.",
            },
            {
              icon: "📊",
              title: "Share Analytics",
              desc: "Track ACI shelf share vs competitors across outlets, channels, and categories in real time.",
            },
            {
              icon: "⚡",
              title: "Smart Recommendations",
              desc: "Auto-generated stock-out alerts and shelf share gap recommendations for your field team.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-gray-50 rounded-xl p-6 text-left border border-gray-100 hover:border-rose-100 transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100">
        &copy; {new Date().getFullYear()} ACI Limited &mdash; MarketLens
      </footer>
    </div>
  );
}
