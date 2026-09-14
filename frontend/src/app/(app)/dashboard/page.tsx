"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Store, Box, RefreshCw, CheckCircle, ArrowRight, Key } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

interface BrandShare {
  brand: string;
  facings: number;
  share_pct: number;
  is_aci: boolean;
  color: string;
}

interface Recommendation {
  id: number;
  sku_code: string;
  sku_name: string;
  issue_type: string;
  priority: string;
  description: string;
  assigned_to: string;
  outlet_name: string;
  outlet_id: number;
  created_at: string;
}

interface DashboardData {
  aci_shelf_share: number;
  competitor_shelf_share: number;
  open_stock_outs: number;
  outlets_audited: number;
  total_outlets: number;
  total_facings: number;
  total_analyses: number;
  brand_shares: BrandShare[];
  recommendations: Recommendation[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [user, setUser] = useState<{ has_api_key?: boolean; api_key_preview?: string } | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/analytics/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    fetchWithAuth("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u) setUser(u);
      })
      .catch(() => {});
  }, []);

  const handleResolveRecommendation = async (id: number) => {
    setResolvingId(id);
    try {
      const res = await fetchWithAuth(`/api/recommendations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (res.ok) {
        // Optimistically remove from list
        if (data) {
          setData({
            ...data,
            open_stock_outs: Math.max(0, data.open_stock_outs - 1),
            recommendations: data.recommendations.filter((r) => r.id !== id),
          });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const maxBrandShare = data?.brand_shares?.length
    ? Math.max(...data.brand_shares.map((b) => b.share_pct), 30)
    : 40;

  return (
    <div className="p-8">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Execution Overview</h1>
          <p className="text-sm text-gray-500">Live retail audit metrics & SKU shelf share analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Gemini API Key Status Badge */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm ${
            user?.has_api_key
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <span className={`w-2 h-2 rounded-full ${user?.has_api_key ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
            <Key size={14} className={user?.has_api_key ? "text-emerald-600" : "text-amber-600"} />
            <span>{user?.has_api_key ? `Valid API Key (${user.api_key_preview || "Active"})` : "API Key Not Set"}</span>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-rose-600" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/capture"
            className="flex items-center gap-2 px-4 py-2 bg-[#ca1551] hover:bg-[#b01346] text-white font-semibold rounded-xl text-sm shadow-sm transition-colors"
          >
            New Shelf Audit →
          </Link>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">ACI Shelf Share</h3>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
              <span className="font-bold text-sm">%</span>
            </div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              {data ? data.aci_shelf_share : "..."}
              <span className="text-2xl text-gray-400 font-medium">%</span>
            </div>
            <p className="text-xs text-gray-500">
              Competitors: {data ? `${data.competitor_shelf_share}%` : "..."}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Open Stock-Outs</h3>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              {data ? data.open_stock_outs : "..."}
            </div>
            <p className="text-xs text-gray-500">Distinct SKUs flagged out of stock</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Outlets Audited</h3>
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
              <Store size={16} />
            </div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              {data ? data.outlets_audited : "..."}
            </div>
            <p className="text-xs text-gray-500">
              of {data ? data.total_outlets : "..."} active outlets
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Facings</h3>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Box size={16} />
            </div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">
              {data ? data.total_facings : "..."}
            </div>
            <p className="text-xs text-gray-500">
              across {data ? data.total_analyses : "..."} analyses
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                <BarChartIcon />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Shelf Share by Brand</h2>
                <p className="text-xs text-gray-500">ACI in marigold · competitors in plum · derived from active audit facings</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-3 h-3 rounded-sm bg-[#f59e0b]"></span> ACI Brand
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-3 h-3 rounded-sm bg-[#831843]"></span> Competitors
              </span>
            </div>
          </div>
          
          {/* Dynamic Bar Chart */}
          <div className="flex-1 min-h-[260px] border-b border-gray-200 relative pt-8 pb-4">
            {/* Grid lines */}
            <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between pointer-events-none pb-8">
              {[40, 30, 20, 10, 0].map((val, i) => (
                <div key={i} className="flex items-center w-full border-b border-gray-100 border-dashed h-0">
                  <span className="text-[10px] text-gray-400 absolute -left-6 bg-white pr-2">{val}%</span>
                </div>
              ))}
            </div>

            {/* Dynamic Bars */}
            <div className="flex items-end justify-around h-full pl-6 relative z-10 pt-2">
              {data?.brand_shares && data.brand_shares.length > 0 ? (
                data.brand_shares.map((b) => {
                  const barHeight = Math.min(200, Math.max(12, (b.share_pct / maxBrandShare) * 200));
                  return (
                    <div key={b.brand} className="flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-md z-20">
                        {b.share_pct}% ({b.facings} facings)
                      </div>
                      <div
                        className="w-14 rounded-t-md transition-all duration-300 hover:brightness-110 shadow-sm"
                        style={{
                          height: `${barHeight}px`,
                          backgroundColor: b.color,
                        }}
                      ></div>
                      <span className="text-[11px] font-semibold text-gray-600 truncate max-w-[60px] text-center">
                        {b.brand}
                      </span>
                      <span className="text-[10px] text-gray-400 -mt-1 font-medium">{b.share_pct}%</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-center py-8">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                    <BarChartIcon />
                  </div>
                  <p className="text-xs font-bold text-gray-700">No shelf share data yet</p>
                  <p className="text-[11px] text-gray-400 max-w-xs mt-1 mb-3">
                    Add products, register an outlet, and capture your first shelf image to see live brand share.
                  </p>
                  <Link
                    href="/capture"
                    className="px-3.5 py-1.5 bg-[#ca1551] text-white rounded-lg font-semibold text-xs hover:bg-[#b01346] transition-colors"
                  >
                    Start First Audit →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendation Queue */}
        <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Action Queue</h2>
                <p className="text-[10px] text-gray-500">Prioritized field rep replenishment tasks</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
              {data?.recommendations?.length || 0} open
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[380px]">
            {data?.recommendations && data.recommendations.length > 0 ? (
              data.recommendations.map((rec) => (
                <div key={rec.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 flex-shrink-0">
                      <Box size={13} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-gray-900 truncate max-w-[140px]">
                          {rec.sku_name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            rec.priority === "High"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                        {rec.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-medium text-gray-600 truncate max-w-[120px]">
                          📍 {rec.outlet_name}
                        </span>
                        <button
                          onClick={() => handleResolveRecommendation(rec.id)}
                          disabled={resolvingId === rec.id}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <CheckCircle size={12} />
                          {resolvingId === rec.id ? "Saving..." : "Resolve"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                <CheckCircle size={24} className="text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-gray-700">All caught up!</p>
                <p className="text-[11px] text-gray-400">No open replenishment tasks pending.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}
