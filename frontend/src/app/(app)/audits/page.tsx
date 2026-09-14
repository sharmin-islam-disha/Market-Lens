"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Image as ImageIcon, Search, Eye, Filter, Calendar, Store, Layers, CheckCircle, AlertTriangle, ArrowUpRight, Plus } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import AuditDetailModal from "@/components/AuditDetailModal";

interface CaptureItem {
  id: number;
  outlet_name: string;
  shelf_section: string;
  total_facings: number;
  aci_facings: number;
  competitor_facings: number;
  aci_shelf_share: number;
  posm_present: boolean;
  posm_type: string | null;
  image_url: string;
  created_at: string;
  detections_count: number;
}

export default function AuditsPage() {
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [activeCaptureId, setActiveCaptureId] = useState<number | null>(null);

  const loadCaptures = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/captures");
      if (res.ok) {
        const data = await res.json();
        setCaptures(data);
      }
    } catch (err) {
      console.error("Failed to load captures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaptures();
  }, []);

  const filtered = captures.filter((c) => {
    const matchSearch =
      c.outlet_name.toLowerCase().includes(search.toLowerCase()) ||
      c.shelf_section.toLowerCase().includes(search.toLowerCase());
    const matchSection = selectedSection === "all" || c.shelf_section.toLowerCase() === selectedSection.toLowerCase();
    return matchSearch && matchSection;
  });

  const totalFacingsRecorded = captures.reduce((sum, c) => sum + c.total_facings, 0);
  const avgAciShare = captures.length > 0
    ? Math.round((captures.reduce((sum, c) => sum + c.aci_shelf_share, 0) / captures.length) * 10) / 10
    : 0;

  return (
    <div className="p-8">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shelf Audit History</h1>
          <p className="text-sm text-gray-500">
            Browse, inspect, and verify all past shelf captures and AI VLM detections
          </p>
        </div>

        <Link
          href="/capture"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#ca1551] hover:bg-[#b01346] text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
        >
          <Camera size={15} /> Record New Audit
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Audits Recorded</p>
            <p className="text-3xl font-extrabold text-gray-900">{captures.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">Stored securely in database</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-[#ca1551]">
            <Camera size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Facings Audited</p>
            <p className="text-3xl font-extrabold text-gray-900">{totalFacingsRecorded}</p>
            <p className="text-[11px] text-gray-400 mt-1">Across all store shelves</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Average ACI Shelf Share</p>
            <p className="text-3xl font-extrabold text-gray-900">{avgAciShare}%</p>
            <p className="text-[11px] text-gray-400 mt-1">Competitive market presence</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by outlet name or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-600">Category:</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 py-2 px-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Categories</option>
            <option value="staples">Staples</option>
            <option value="cooking">Cooking</option>
            <option value="beverages">Beverages</option>
            <option value="spices">Spices</option>
          </select>
        </div>
      </div>

      {/* Audit List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-pink-200 border-t-[#ca1551] rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold text-gray-600">Loading audit history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mx-auto mb-3">
              <Camera size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No shelf audits found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {search || selectedSection !== "all"
                ? "No audits matched your search criteria."
                : "No store shelf audits have been conducted yet."}
            </p>
            <Link
              href="/capture"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ca1551] text-white rounded-xl text-xs font-bold hover:bg-[#b01346] transition-colors"
            >
              <Plus size={14} /> Record Your First Audit
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table Header */}
            <div className="bg-gray-50/80 px-6 py-3 text-[11px] font-bold text-gray-500 uppercase grid grid-cols-12 gap-4">
              <span className="col-span-4">Outlet & Photo</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-2 text-center">Total Facings</span>
              <span className="col-span-2 text-center">ACI Share</span>
              <span className="col-span-2 text-right">Action</span>
            </div>

            {/* Audit Rows */}
            {filtered.map((c) => (
              <div
                key={c.id}
                className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/70 transition-colors"
              >
                {/* Outlet & Photo thumbnail */}
                <div className="col-span-4 flex items-center gap-3">
                  <div
                    onClick={() => setActiveCaptureId(c.id)}
                    className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer group relative flex items-center justify-center"
                  >
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt="Shelf"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Camera size={18} className="text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye size={16} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <button
                      onClick={() => setActiveCaptureId(c.id)}
                      className="font-bold text-sm text-gray-900 hover:text-[#ca1551] transition-colors truncate block text-left"
                    >
                      {c.outlet_name}
                    </button>
                    <p className="text-[11px] text-gray-400">{c.created_at}</p>
                    <span className="text-[10px] text-gray-500">
                      Audit #{c.id} · {c.detections_count} SKUs detected
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                    {c.shelf_section}
                  </span>
                  {c.posm_present && (
                    <span className="block text-[10px] font-semibold text-emerald-600 mt-1">
                      ✓ POSM banner
                    </span>
                  )}
                </div>

                {/* Total Facings */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-bold text-gray-900">{c.total_facings}</span>
                  <span className="text-[10px] text-gray-400 block">
                    ({c.aci_facings} ACI / {c.competitor_facings} Comp)
                  </span>
                </div>

                {/* ACI Shelf Share */}
                <div className="col-span-2 text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-sm font-extrabold text-[#ca1551]">{c.aci_shelf_share}%</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-[#f59e0b] rounded-full"
                        style={{ width: `${Math.min(100, c.aci_shelf_share)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="col-span-2 text-right">
                  <button
                    onClick={() => setActiveCaptureId(c.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Eye size={13} /> View Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        captureId={activeCaptureId}
        onClose={() => setActiveCaptureId(null)}
      />
    </div>
  );
}
