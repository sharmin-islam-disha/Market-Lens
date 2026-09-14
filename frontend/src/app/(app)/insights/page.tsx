"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, DollarSign, MapPin, BarChart3, RefreshCw, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

interface StockoutItem {
  sku_code: string;
  sku_name: string;
  frequency: number;
  affected_outlets: string[];
  priority: string;
}

interface PriceVarianceItem {
  sku_code: string;
  name: string;
  brand: string;
  is_aci: boolean;
  mrp: number;
  observed_avg: number;
  variance: number;
  status: string;
}

interface DistributionGapItem {
  outlet_name: string;
  outlet_city: string;
  channel: string;
  sku_code: string;
  sku_name: string;
  category: string;
  target_share: string;
}

interface CategoryShareItem {
  category: string;
  total_facings: number;
  aci_facings: number;
  aci_shelf_share: number;
  competitor_share: number;
}

interface InsightsData {
  stockout_frequency: StockoutItem[];
  price_variance: PriceVarianceItem[];
  distribution_gaps: DistributionGapItem[];
  category_breakdown: CategoryShareItem[];
}

export default function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stockouts" | "distribution" | "pricing" | "categories">("stockouts");

  const loadInsights = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/analytics/insights");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Execution Intelligence & Insights</h1>
          <p className="text-sm text-gray-500">
            Stock-out frequency, price variance compliance, and distribution gap analysis
          </p>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-rose-600" : ""} />
          {loading ? "Refreshing..." : "Refresh Insights"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab("stockouts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "stockouts"
              ? "bg-[#ca1551] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <AlertTriangle size={16} />
          Stock-Out Frequency ({data?.stockout_frequency?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("distribution")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "distribution"
              ? "bg-[#ca1551] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <MapPin size={16} />
          Distribution Gaps ({data?.distribution_gaps?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("pricing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "pricing"
              ? "bg-[#ca1551] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <DollarSign size={16} />
          Price Compliance ({data?.price_variance?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === "categories"
              ? "bg-[#ca1551] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <BarChart3 size={16} />
          Category Performance ({data?.category_breakdown?.length || 0})
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center text-gray-400 text-sm">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* TAB 1: Stockout Frequency */}
          {activeTab === "stockouts" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">High-Risk Stock-Out SKUs</h2>
                <p className="text-xs text-gray-500">
                  SKUs detected as repeatedly unavailable on store shelves across recent audit cycles
                </p>
              </div>

              {data?.stockout_frequency && data.stockout_frequency.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">SKU Code</th>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Out-of-Stock Incidents</th>
                        <th className="px-6 py-4">Priority Level</th>
                        <th className="px-6 py-4">Affected Outlets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.stockout_frequency.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-xs text-gray-700">
                            {item.sku_code}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {item.sku_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
                              {item.frequency} times flagged
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.priority === "High"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {item.affected_outlets.map((outlet, oIdx) => (
                                <span key={oIdx} className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-700">
                                  {outlet}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 text-sm">
                  No active stock-out incidents detected!
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Distribution Gaps */}
          {activeTab === "distribution" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Distribution Gaps</h2>
                <p className="text-xs text-gray-500">
                  Target ACI portfolio SKUs completely absent from audited retail outlet shelves
                </p>
              </div>

              {data?.distribution_gaps && data.distribution_gaps.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">Outlet</th>
                        <th className="px-6 py-4">Territory / Channel</th>
                        <th className="px-6 py-4">Missing ACI SKU</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Target Shelf Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.distribution_gaps.map((gap, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {gap.outlet_name}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {gap.outlet_city} · {gap.channel}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-[#ca1551]">{gap.sku_name}</p>
                            <p className="font-mono text-[10px] text-gray-400">{gap.sku_code}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              {gap.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-700 text-xs">
                            {gap.target_share}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 text-sm">
                  Full distribution coverage achieved across all audited outlets.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Pricing Compliance */}
          {activeTab === "pricing" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Shelf Price Compliance</h2>
                <p className="text-xs text-gray-500">
                  Observed store shelf price vs official Maximum Retail Price (MRP)
                </p>
              </div>

              {data?.price_variance && data.price_variance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Brand</th>
                        <th className="px-6 py-4">Official MRP</th>
                        <th className="px-6 py-4">Audited Shelf Price</th>
                        <th className="px-6 py-4">Variance</th>
                        <th className="px-6 py-4">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.price_variance.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                item.is_aci ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-900"
                              }`}
                            >
                              {item.brand}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-700">
                            ৳{item.mrp.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            ৳{item.observed_avg.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-xs">
                            <span
                              className={
                                item.variance > 0
                                  ? "text-red-600"
                                  : item.variance < 0
                                  ? "text-emerald-600"
                                  : "text-gray-500"
                              }
                            >
                              {item.variance > 0 ? `+৳${item.variance}` : `৳${item.variance}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                item.status === "Compliant"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "Overpriced"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 text-sm">
                  No pricing observation data available.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Category Breakdown */}
          {activeTab === "categories" && (
            <div className="grid grid-cols-2 gap-6">
              {data?.category_breakdown?.map((cat) => (
                <div
                  key={cat.category}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{cat.category}</h3>
                      <p className="text-xs text-gray-500">{cat.total_facings} total facings audited</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-extrabold text-xs">
                      ACI {cat.aci_shelf_share}%
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                      <span>ACI Share: {cat.aci_shelf_share}% ({cat.aci_facings} facings)</span>
                      <span>Competitors: {cat.competitor_share}%</span>
                    </div>
                    {/* Share Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                      <div
                        className="bg-[#f59e0b] h-full transition-all duration-500"
                        style={{ width: `${cat.aci_shelf_share}%` }}
                      ></div>
                      <div
                        className="bg-[#831843] h-full transition-all duration-500"
                        style={{ width: `${cat.competitor_share}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                    <span>Target: 30% - 35%</span>
                    <span
                      className={
                        cat.aci_shelf_share >= 30 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"
                      }
                    >
                      {cat.aci_shelf_share >= 30 ? "✓ On Target" : "⚠ Expansion Needed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
