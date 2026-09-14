"use client";

import { useState, useEffect } from "react";
import { X, Layers, AlertTriangle, CheckCircle, Image as ImageIcon, Eye, Store, Calendar, Tag } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

export interface DetectionItem {
  id?: number;
  sku_name: string;
  brand: string;
  is_aci: boolean;
  facing_count: number;
  observed_price: number | null;
  is_out_of_stock: boolean;
  confidence: number;
}

export interface CaptureDetail {
  id: number;
  outlet_name: string;
  shelf_section: string;
  image_url: string;
  field_notes?: string | null;
  total_facings: number;
  aci_facings: number;
  competitor_facings: number;
  aci_shelf_share: number;
  posm_present: boolean;
  posm_type: string | null;
  created_at: string;
  detections: DetectionItem[];
}

interface AuditDetailModalProps {
  captureId: number | null;
  onClose: () => void;
}

export default function AuditDetailModal({ captureId, onClose }: AuditDetailModalProps) {
  const [data, setData] = useState<CaptureDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!captureId) return;
    setLoading(true);
    setError("");

    fetchWithAuth(`/api/captures/${captureId}`)
      .then(async (res) => {
        if (res.ok) {
          return res.json();
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to load audit details");
      })
      .then((json: CaptureDetail) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [captureId]);

  if (!captureId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#ca1551] font-bold">
              <Eye size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {data ? `${data.outlet_name} — Shelf Audit #${data.id}` : `Audit #${captureId}`}
              </h2>
              <p className="text-xs text-gray-500">
                {data ? `${data.created_at} · Category: ${data.shelf_section}` : "Loading audit details..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-4 border-pink-200 border-t-[#ca1551] rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-gray-700">Loading audit & VLM detections...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Top Overview Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-amber-800">ACI Shelf Share</p>
                  <p className="text-2xl font-black text-amber-600">{data.aci_shelf_share}%</p>
                  <p className="text-[10px] text-gray-500">{data.aci_facings} / {data.total_facings} facings</p>
                </div>

                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-rose-800">Competitors</p>
                  <p className="text-2xl font-black text-rose-600">
                    {Math.round((100 - data.aci_shelf_share) * 10) / 10}%
                  </p>
                  <p className="text-[10px] text-gray-500">{data.competitor_facings} facings</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-600">Total Detections</p>
                  <p className="text-2xl font-black text-gray-800">{data.detections?.length || 0}</p>
                  <p className="text-[10px] text-gray-500">SKUs identified</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-600">POSM Branding</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {data.posm_present ? "✓ Present" : "Standard Shelf"}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{data.posm_type || "No banner"}</p>
                </div>
              </div>

              {/* Image & Field Notes */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 flex flex-col items-center justify-center">
                  <p className="text-xs font-bold text-gray-700 self-start mb-2 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-gray-500" /> Captured Shelf Photo
                  </p>
                  {data.image_url ? (
                    <div className="relative group w-full flex justify-center bg-black/5 rounded-lg overflow-hidden max-h-[320px]">
                      <img
                        src={data.image_url}
                        alt="Shelf Capture"
                        className="object-contain max-h-[320px] rounded-lg shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <a
                        href={data.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm transition-colors"
                      >
                        Open Full Image ↗
                      </a>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      No photo attached (manual entry audit)
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between">
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 flex-1">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Audit Metadata</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-500">Retail Outlet:</span>
                        <span className="font-semibold text-gray-900">{data.outlet_name}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-500">Shelf Category:</span>
                        <span className="font-semibold text-gray-900 capitalize">{data.shelf_section}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-500">Timestamp:</span>
                        <span className="font-semibold text-gray-900">{data.created_at}</span>
                      </div>
                      {data.field_notes && (
                        <div className="pt-2">
                          <span className="text-gray-500 block mb-1">Field Rep Notes:</span>
                          <p className="bg-white p-2.5 rounded-lg border border-gray-200 text-gray-700 italic">
                            "{data.field_notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected SKUs Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers size={14} className="text-[#ca1551]" /> Detected SKUs & Facing Counts ({data.detections?.length || 0})
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  <div className="bg-gray-50/80 px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase grid grid-cols-12 gap-2">
                    <span className="col-span-6">SKU / Product</span>
                    <span className="col-span-2 text-center">Brand</span>
                    <span className="col-span-2 text-center">Facings</span>
                    <span className="col-span-2 text-right">Price / Status</span>
                  </div>

                  {data.detections && data.detections.length > 0 ? (
                    data.detections.map((d, idx) => (
                      <div key={idx} className="px-4 py-3 text-xs grid grid-cols-12 gap-2 items-center hover:bg-gray-50/60 transition-colors">
                        <div className="col-span-6 flex items-center gap-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              d.is_aci ? "bg-amber-500" : "bg-rose-500"
                            }`}
                          ></span>
                          <span className="font-bold text-gray-900 truncate">{d.sku_name}</span>
                        </div>

                        <div className="col-span-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.is_aci ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {d.brand} {d.is_aci ? "(ACI)" : ""}
                          </span>
                        </div>

                        <div className="col-span-2 text-center font-bold text-gray-900">
                          {d.is_out_of_stock ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px] inline-flex items-center gap-1">
                              <AlertTriangle size={10} /> 0 (OOS)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                              {d.facing_count} facings
                            </span>
                          )}
                        </div>

                        <div className="col-span-2 text-right">
                          {d.observed_price ? (
                            <span className="font-mono font-semibold text-gray-800 text-[11px]">
                              ৳{d.observed_price}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-500">
                      No distinct SKUs recorded for this capture.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
