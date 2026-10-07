"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, Plus, Search, MapPin, Calendar, Trash2, X, Camera, Eye, Upload, Download, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

interface Outlet {
  id: number;
  code: string;
  name: string;
  channel: string;
  address: string;
  city: string;
  contact_person: string | null;
  phone: string | null;
  audits_count: number;
  last_audited: string;
  created_at: string;
}

export default function Outlets() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    channel: "Supermarket",
    address: "",
    city: "Dhaka",
    contact_person: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const loadOutlets = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/outlets");
      if (res.ok) {
        const data = await res.json();
        setOutlets(data);
      }
    } catch (err) {
      console.error("Failed to load outlets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  const handleAddOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetchWithAuth("/api/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          code: "",
          name: "",
          channel: "Supermarket",
          address: "",
          city: "Dhaka",
          contact_person: "",
          phone: "",
        });
        loadOutlets();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.detail || "Failed to create outlet");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create outlet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOutlet = async (id: number) => {
    if (!confirm("Are you sure you want to delete this outlet and all associated audit data?")) {
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/outlets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOutlets(outlets.filter((o) => o.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete outlet:", err);
    }
  };

  const filteredOutlets = outlets.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.address.toLowerCase().includes(search.toLowerCase());
    const matchesCity = selectedCity === "all" || o.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const downloadSampleCSV = () => {
    const rows = [
      "code,name,channel,address,city,contact_person,phone",
      "OUT-DHK-001,Shwapno Uttara,Supermarket,House 14 Road 2 Sector 3 Uttara,Dhaka,Store Manager,+8801712345678",
      "OUT-CTG-001,Agora Agrabad,Hypermarket,Agrabad Commercial Area,Chittagong,Branch Head,+8801812345678",
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sample_outlets.csv";
    a.click();
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    const form = new FormData();
    form.append("file", importFile);
    try {
      const res = await fetchWithAuth("/api/outlets/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Import failed");
      setImportResult(data);
      loadOutlets();
    } catch (e: unknown) {
      setImportResult({ created: 0, skipped: 0, errors: [e instanceof Error ? e.message : "Import failed"] });
    } finally {
      setImporting(false);
    }
  };

  const auditedCount = outlets.filter((o) => o.audits_count > 0).length;
  const cities = Array.from(new Set(outlets.map((o) => o.city)));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retail Outlets</h1>
          <p className="text-sm text-gray-500">Master database for audited supermarket & trade partner outlets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowImportModal(true); setImportFile(null); setImportResult(null); }}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:border-[#ca1551] text-gray-700 hover:text-[#ca1551] font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Upload size={16} /> Import CSV / Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#ca1551] hover:bg-[#b01346] text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Outlet
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Outlets</p>
            <p className="text-3xl font-extrabold text-gray-900">{outlets.length}</p>
          </div>
          <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600">
            <Store size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Audited Outlets</p>
            <p className="text-3xl font-extrabold text-gray-900">{auditedCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Coverage: {outlets.length > 0 ? Math.round((auditedCount / outlets.length) * 100) : 0}%
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Calendar size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Active Territories</p>
            <p className="text-3xl font-extrabold text-gray-900">{cities.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">{cities.join(", ") || "None"}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <MapPin size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by outlet name, code, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-700">City:</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Outlets Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading outlets...</div>
        ) : outlets.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 mb-4">
              <Store size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No outlets registered yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-6">
              Start building your retail execution territory by adding your first retail store branch.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#ca1551] hover:bg-[#b01346] text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={15} /> Add First Outlet
            </button>
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No matching outlets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Outlet Name</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">City / Address</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Audits</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOutlets.map((outlet) => (
                  <tr key={outlet.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-gray-700">
                      {outlet.code}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{outlet.name}</p>
                      <p className="text-xs text-gray-400">Last audit: {outlet.last_audited}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {outlet.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{outlet.city}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{outlet.address}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {outlet.contact_person && <p className="font-medium">{outlet.contact_person}</p>}
                      {outlet.phone && <p className="text-gray-400">{outlet.phone}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {outlet.audits_count > 0 ? (
                        <Link
                          href={`/audits`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors"
                          title="Click to view audits for this outlet"
                        >
                          <Camera size={12} /> {outlet.audits_count} audits →
                        </Link>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          0 audits
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {outlet.audits_count > 0 && (
                          <Link
                            href={`/audits`}
                            className="p-1.5 text-gray-400 hover:text-[#ca1551] hover:bg-pink-50 rounded-lg transition-colors"
                            title="View audit history"
                          >
                            <Eye size={15} />
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteOutlet(outlet.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete outlet"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">Import Outlets</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {/* Step 1 — Download sample */}
            <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-700 mb-2">Step 1 — Download sample template</p>
              <p className="text-xs text-gray-500 mb-3">Fill in your outlet data using these columns:<br />
                <span className="font-mono text-[11px] text-gray-600">code · name · channel · address · city · contact_person · phone</span>
              </p>
              <button onClick={downloadSampleCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-[#ca1551] text-gray-700 hover:text-[#ca1551] text-xs font-bold rounded-lg transition-colors">
                <Download size={13} /> Download sample_outlets.csv
              </button>
            </div>

            {/* Step 2 — Upload */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-700 mb-2">Step 2 — Upload filled file</p>
              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${importFile ? "border-[#ca1551] bg-rose-50" : "border-gray-200 hover:border-[#ca1551] hover:bg-gray-50"}`}>
                <FileSpreadsheet size={22} className={importFile ? "text-[#ca1551]" : "text-gray-400"} />
                <p className="text-xs font-semibold mt-2 text-gray-600">
                  {importFile ? importFile.name : "Click to upload CSV or Excel (.xlsx)"}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Max 5MB</p>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }} />
              </label>
            </div>

            {/* Result */}
            {importResult && (
              <div className="mb-4 space-y-2">
                {importResult.created > 0 && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                    <CheckCircle2 size={14} /> {importResult.created} outlet{importResult.created > 1 ? "s" : ""} imported successfully.
                  </div>
                )}
                {importResult.skipped > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={14} /> {importResult.skipped} row{importResult.skipped > 1 ? "s" : ""} skipped (duplicate outlet code).
                  </div>
                )}
                {importResult.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {e}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="flex items-center gap-2 px-5 py-2 bg-[#ca1551] hover:bg-[#b01346] text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Outlet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add New Outlet</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl mb-4">{error}</div>
            )}

            <form onSubmit={handleAddOutlet} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Outlet Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OUT-DHK-007"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Channel *</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="Supermarket">Supermarket</option>
                    <option value="Hypermarket">Hypermarket</option>
                    <option value="Departmental Store">Departmental Store</option>
                    <option value="General Trade">General Trade</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Outlet Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shwapno - Uttara Sector 3"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Store Manager"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 14, Road 2, Sector 3, Uttara"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+8801..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#ca1551] hover:bg-[#b01346] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving..." : "Create Outlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
