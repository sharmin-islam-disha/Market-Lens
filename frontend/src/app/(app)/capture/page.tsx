"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Image as ImageIcon, Box, AlertTriangle, PlayCircle, CheckCircle, RefreshCw, Layers, Edit3, Key, Plus, History, Eye } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

interface Outlet {
  id: number;
  code: string;
  name: string;
  city: string;
}

interface Product {
  id: number;
  sku_code: string;
  name: string;
  brand: string;
  category: string;
  is_aci: boolean;
  mrp: number;
}

interface DetectionItem {
  sku_name: string;
  brand: string;
  is_aci: boolean;
  facing_count: number;
  observed_price: number | null;
  is_out_of_stock: boolean;
  confidence: number;
}

interface VisionResult {
  id: number;
  outlet_id: number;
  outlet_name: string;
  shelf_section: string;
  image_url: string;
  total_facings: number;
  aci_facings: number;
  competitor_facings: number;
  aci_shelf_share: number;
  posm_present: boolean;
  posm_type: string | null;
  detections: DetectionItem[];
  created_at: string;
}

interface ManualFacingState {
  [productId: number]: {
    facing_count: number;
    observed_price: number;
    is_out_of_stock: boolean;
  };
}

export default function CaptureShelf() {
  const [auditMode, setAuditMode] = useState<"ai" | "manual">("ai");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");
  const [section, setSection] = useState<string>("staples");
  const [fieldNotes, setFieldNotes] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [catalogSkus, setCatalogSkus] = useState<Product[]>([]);

  // AI Upload States
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string>("");

  // History & Tabs State
  const [pastCaptures, setPastCaptures] = useState<any[]>([]);
  const [rightTab, setRightTab] = useState<"result" | "history">("result");
  const [loadingPastCapture, setLoadingPastCapture] = useState(false);

  // Manual Audit States
  const [manualFacings, setManualFacings] = useState<ManualFacingState>({});
  const [posmPresent, setPosmPresent] = useState(false);
  const [posmType, setPosmType] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const loadPastCaptures = async (autoSelectFirst = false) => {
    try {
      const res = await fetchWithAuth("/api/captures");
      if (res.ok) {
        const data = await res.json();
        setPastCaptures(data);
        if (autoSelectFirst && data.length > 0) {
          selectPastCapture(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load captures:", e);
    }
  };

  const selectPastCapture = async (id: number) => {
    setLoadingPastCapture(true);
    try {
      const res = await fetchWithAuth(`/api/captures/${id}`);
      if (res.ok) {
        const json = await res.json();
        setAnalysisResult(json);
        setRightTab("result");
      }
    } catch (e) {
      console.error("Failed to load capture details:", e);
    } finally {
      setLoadingPastCapture(false);
    }
  };

  // Load Outlets, Key status, and Past Captures on Mount
  useEffect(() => {
    fetchWithAuth("/api/outlets")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Outlet[]) => {
        setOutlets(data);
        if (data.length > 0) {
          setSelectedOutlet(data[0].id.toString());
        }
      })
      .catch((err) => console.error("Failed to load outlets:", err));

    fetchWithAuth("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((u) => {
        if (u?.has_api_key) {
          setHasApiKey(true);
        }
      })
      .catch(() => {});

    loadPastCaptures(true);
  }, []);

  // Load Catalog SKUs when section changes
  useEffect(() => {
    fetchWithAuth(`/api/products?category=${section}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Product[]) => {
        setCatalogSkus(data);
        // Initialize manual facings state
        const initial: ManualFacingState = {};
        data.forEach((p) => {
          initial[p.id] = {
            facing_count: 0,
            observed_price: p.mrp,
            is_out_of_stock: false,
          };
        });
        setManualFacings(initial);
      })
      .catch((err) => console.error("Failed to load catalog products:", err));
  }, [section]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleAnalyze = async () => {
    setError("");
    if (!selectedOutlet) {
      setError("Please select a registered outlet.");
      return;
    }
    if (!file) {
      setError("Please upload a shelf photo to analyze.");
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("outlet_id", selectedOutlet);
      formData.append("shelf_section", section);
      if (fieldNotes) {
        formData.append("field_notes", fieldNotes);
      }
      if (apiKeyInput.trim()) {
        formData.append("api_key", apiKeyInput.trim());
      }

      const res = await fetchWithAuth("/api/captures/analyze", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        setAnalysisResult(json);
        setRightTab("result");
        loadPastCaptures(false);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.detail || "AI vision detection failed. Please check your Gemini API key.");
      }
    } catch (err: any) {
      setError(err.message || "Network error occurred during vision analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualSubmit = async () => {
    setError("");
    if (!selectedOutlet) {
      setError("Please select a registered outlet.");
      return;
    }
    if (catalogSkus.length === 0) {
      setError("No products exist in this category. Add products first.");
      return;
    }

    setSavingManual(true);
    try {
      const facingsList = catalogSkus.map((p) => {
        const state = manualFacings[p.id] || { facing_count: 0, observed_price: p.mrp, is_out_of_stock: false };
        return {
          product_id: p.id,
          sku_name: p.name,
          brand: p.brand,
          is_aci: p.is_aci,
          facing_count: state.facing_count,
          observed_price: state.observed_price,
          is_out_of_stock: state.is_out_of_stock || state.facing_count === 0,
        };
      });

      const res = await fetchWithAuth("/api/captures/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outlet_id: parseInt(selectedOutlet),
          shelf_section: section,
          field_notes: fieldNotes,
          posm_present: posmPresent,
          posm_type: posmPresent ? posmType || "In-store display" : null,
          facings: facingsList,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setAnalysisResult(json);
        setRightTab("result");
        loadPastCaptures(false);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.detail || "Failed to record manual audit.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit audit.");
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record Shelf Audit</h1>
          <p className="text-sm text-gray-500">
            Perform authentic store audits using AI Vision Analysis or manual facing count entry
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => {
              setAuditMode("ai");
              setError("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              auditMode === "ai"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Camera size={14} /> Gemini 3.8 Flash AI
          </button>
          <button
            onClick={() => {
              setAuditMode("manual");
              setError("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              auditMode === "manual"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Edit3 size={14} /> Manual Count Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Form Column */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                {auditMode === "ai" ? <Camera size={16} /> : <Edit3 size={16} />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {auditMode === "ai" ? "Gemini 3.8 Flash Vision Audit" : "Field Rep Manual Audit"}
                </h2>
                <p className="text-[10px] text-gray-500">
                  {auditMode === "ai"
                    ? "Multimodal VLM (gemini-3.8-flash) analyzes real shelf image"
                    : "Enter verified facing numbers observed in store"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6 flex-1">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Outlet Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-900">Retail Outlet *</label>
                <Link href="/outlets" className="text-xs text-[#ca1551] font-semibold hover:underline">
                  + Add Outlet
                </Link>
              </div>
              {outlets.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                  <span>No outlets registered yet.</span>
                  <Link href="/outlets" className="font-bold underline text-amber-900 ml-2">
                    Create Outlet First →
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code}) - {o.city}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Shelf Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Shelf Category *</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full md:w-1/2 bg-white border border-gray-300 text-gray-900 py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="staples">Staples (Atta, Maida, Sugar)</option>
                <option value="cooking">Cooking (Salt, Edible Oil, Spices)</option>
                <option value="beverages">Beverages (Tea, Juices)</option>
                <option value="spices">Spices & Seasonings</option>
              </select>
            </div>

            {/* AI Vision Mode Content */}
            {auditMode === "ai" ? (
              <>
                {/* Gemini API Key Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Key size={13} /> Gemini API Key
                    </label>
                    {hasApiKey ? (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle size={11} /> Key active from your account
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500">Optional if set in Onboarding or .env</span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder={hasApiKey ? "Using account API key (enter here to override)..." : "AIza... or AQ... (leave blank if set in Onboarding)"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {/* Photo Dropzone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Shelf Photo *</label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center min-h-[170px] ${
                      dragActive ? "border-pink-500 bg-pink-50" : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {preview ? (
                      <div className="flex flex-col items-center">
                        <img src={preview} alt="Preview" className="h-32 object-contain rounded-lg shadow-sm mb-2" />
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle size={13} /> Selected: {file?.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 mb-2">
                          <ImageIcon size={20} />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Drag shelf photo here or browse</p>
                        <p className="text-[11px] text-gray-400">JPEG, PNG, or WebP</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Catalog SKUs Badge List */}
                <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Catalog SKUs Checked ({catalogSkus.length})
                    </p>
                    <Link href="/products" className="text-[10px] text-[#ca1551] font-bold hover:underline">
                      + Add SKU
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {catalogSkus.length === 0 ? (
                      <p className="text-xs text-gray-400">No products registered in this category yet.</p>
                    ) : (
                      catalogSkus.map((sku) => (
                        <span
                          key={sku.id}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                            sku.is_aci
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-rose-100 text-rose-900 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sku.is_aci ? "bg-amber-500" : "bg-rose-500"
                            }`}
                          ></span>
                          {sku.brand} · {sku.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Analysis Notice</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || outlets.length === 0}
                  className="w-full bg-[#ca1551] hover:bg-[#b01346] text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-auto disabled:opacity-50 cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Analyzing Photo with Gemini Vision AI...
                    </>
                  ) : (
                    <>
                      <PlayCircle size={18} /> Run AI Analysis (Gemini 3.8 Flash)
                    </>
                  )}
                </button>
              </>
            ) : (
              /* Manual Count Mode Content */
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Catalog SKUs Facing Counts
                    </label>
                    <Link href="/products" className="text-xs text-[#ca1551] font-semibold hover:underline">
                      + Add New Product
                    </Link>
                  </div>

                  {catalogSkus.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs text-gray-500">
                      No products registered for {section}.
                      <Link href="/products" className="block font-bold text-[#ca1551] mt-1">
                        + Register Products First →
                      </Link>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
                      {catalogSkus.map((sku) => {
                        const current = manualFacings[sku.id] || { facing_count: 0, observed_price: sku.mrp, is_out_of_stock: false };
                        return (
                          <div key={sku.id} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50">
                            <div>
                              <p className="font-bold text-gray-900">{sku.name}</p>
                              <p className="text-[10px] text-gray-400">
                                {sku.brand} {sku.is_aci ? "(ACI)" : "(COMP)"} · Official: ৳{sku.mrp}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div>
                                <label className="block text-[9px] font-bold text-gray-600">Facings</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={current.facing_count}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setManualFacings({
                                      ...manualFacings,
                                      [sku.id]: {
                                        ...current,
                                        facing_count: val,
                                        is_out_of_stock: val === 0,
                                      },
                                    });
                                  }}
                                  className="w-16 px-2 py-1 bg-white border border-gray-300 rounded-md font-bold text-center text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold text-gray-600">Price (৳)</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={current.observed_price}
                                  onChange={(e) => {
                                    setManualFacings({
                                      ...manualFacings,
                                      [sku.id]: {
                                        ...current,
                                        observed_price: parseFloat(e.target.value) || 0,
                                      },
                                    });
                                  }}
                                  className="w-16 px-2 py-1 bg-white border border-gray-300 rounded-md text-xs font-mono font-bold text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* POSM Checkbox */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={posmPresent}
                        onChange={(e) => setPosmPresent(e.target.checked)}
                        className="rounded text-pink-600 focus:ring-pink-500"
                      />
                      <span>Promotional POSM / Banners Present on Shelf</span>
                    </label>
                    {posmPresent && (
                      <input
                        type="text"
                        placeholder="e.g. End-cap display, Shelf-talker"
                        value={posmType}
                        onChange={(e) => setPosmType(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    )}
                  </div>
                </div>

                <button
                  onClick={handleManualSubmit}
                  disabled={savingManual || outlets.length === 0 || catalogSkus.length === 0}
                  className="w-full bg-[#f59e0b] hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-auto disabled:opacity-50"
                >
                  {savingManual ? "Recording Audit..." : "Save Verified Shelf Audit"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Result Column */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setRightTab("result")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rightTab === "result"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Box size={13} /> Active Result
              </button>
              <button
                onClick={() => setRightTab("history")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rightTab === "history"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <History size={13} /> Audit History ({pastCaptures.length})
              </button>
            </div>

            {analysisResult && rightTab === "result" && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle size={11} /> Stored in DB
              </span>
            )}
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-start">
            {loadingPastCapture ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 border-3 border-pink-200 border-t-[#ca1551] rounded-full animate-spin mb-3"></div>
                <p className="text-xs font-semibold text-gray-600">Loading shelf detections...</p>
              </div>
            ) : rightTab === "history" ? (
              /* Audit History Tab */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Previously Captured Shelves ({pastCaptures.length})
                  </h3>
                  <Link href="/audits" className="text-xs font-bold text-[#ca1551] hover:underline">
                    View Full Gallery →
                  </Link>
                </div>

                {pastCaptures.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    No audits recorded yet. Run your first audit to see it here!
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-[480px] overflow-y-auto">
                    {pastCaptures.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectPastCapture(c.id)}
                        className="p-3 flex items-center justify-between hover:bg-pink-50/30 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {c.image_url ? (
                              <img
                                src={c.image_url}
                                alt="Shelf"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Camera size={14} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900">{c.outlet_name}</p>
                            <p className="text-[10px] text-gray-400">
                              {c.created_at} · <span className="capitalize">{c.shelf_section}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-xs text-[#ca1551] block">{c.aci_shelf_share}%</span>
                          <span className="text-[9px] text-gray-500">{c.total_facings} facings</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : analysisResult ? (
              /* Active Result Tab */
              <div className="space-y-6">
                {/* Outlet banner */}
                <div className="p-3 bg-pink-50/50 border border-pink-100 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{analysisResult.outlet_name}</span>
                    <span className="text-gray-400 text-[10px] block">
                      Category: {analysisResult.shelf_section} · {analysisResult.created_at}
                    </span>
                  </div>
                  <button
                    onClick={() => setRightTab("history")}
                    className="text-[11px] font-bold text-[#ca1551] hover:underline"
                  >
                    Change Audit ({pastCaptures.length})
                  </button>
                </div>

                {/* Photo Preview if image exists */}
                {analysisResult.image_url && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={analysisResult.image_url}
                        alt="Audited Shelf"
                        className="h-14 w-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-800">Shelf Photo Verified</p>
                        <p className="text-[10px] text-gray-400">Gemini VLM processed</p>
                      </div>
                    </div>
                    <a
                      href={analysisResult.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-[10px] font-bold text-gray-700"
                    >
                      View Photo ↗
                    </a>
                  </div>
                )}

                {/* Metrics Highlights */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-amber-800">ACI Shelf Share</p>
                    <p className="text-2xl font-black text-amber-600">{analysisResult.aci_shelf_share}%</p>
                    <p className="text-[10px] text-gray-500">{analysisResult.aci_facings} / {analysisResult.total_facings} facings</p>
                  </div>

                  <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-rose-800">Competitors</p>
                    <p className="text-2xl font-black text-rose-600">
                      {round1(100 - analysisResult.aci_shelf_share)}%
                    </p>
                    <p className="text-[10px] text-gray-500">{analysisResult.competitor_facings} facings</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-600">POSM Presence</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">
                      {analysisResult.posm_present ? "✓ Detected" : "None"}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{analysisResult.posm_type || "Standard shelf"}</p>
                  </div>
                </div>

                {/* Detected SKUs List */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-1.5">
                    <Layers size={14} /> Audited Shelf SKUs ({analysisResult.detections?.length || 0})
                  </h3>

                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-[260px] overflow-y-auto">
                    {analysisResult.detections?.map((d, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between hover:bg-gray-50 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              d.is_aci ? "bg-amber-500" : "bg-rose-500"
                            }`}
                          ></span>
                          <div>
                            <p className="font-bold text-gray-900">{d.sku_name}</p>
                            <p className="text-[10px] text-gray-400">{d.brand} {d.is_aci ? "(ACI)" : "(COMP)"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {d.is_out_of_stock ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px] flex items-center gap-1">
                              <AlertTriangle size={10} /> OUT OF STOCK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                              {d.facing_count} facings
                            </span>
                          )}
                          {d.observed_price && (
                            <span className="font-mono text-gray-600 text-[11px]">
                              ৳{d.observed_price}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs">
                  <Link
                    href="/audits"
                    className="text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1"
                  >
                    View in Audit Gallery →
                  </Link>
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      setFile(null);
                      setPreview(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 font-semibold"
                  >
                    Clear Preview
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-2xl w-full h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-4">
                  <ImageIcon size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Record Shelf Audit</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-4">
                  Upload a shelf photo to run Gemini vision detection, or enter manual facing counts to record authentic shelf data.
                </p>
                {pastCaptures.length > 0 && (
                  <button
                    onClick={() => setRightTab("history")}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <History size={13} /> View Past Audits ({pastCaptures.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}
