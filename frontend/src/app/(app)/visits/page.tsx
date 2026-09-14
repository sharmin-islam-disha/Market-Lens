"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Search, Calendar, User, Clock, CheckCircle2, AlertCircle, X, Camera } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

interface Visit {
  id: number;
  outlet_id: number;
  outlet_name: string;
  outlet_city: string;
  rep_name: string;
  visit_date: string;
  status: string;
  notes: string | null;
  captures_count: number;
}

interface OutletOption {
  id: number;
  code: string;
  name: string;
  city: string;
}

export default function Visits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [outlets, setOutlets] = useState<OutletOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    outlet_id: "",
    rep_name: "",
    status: "completed",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [visitsRes, outletsRes] = await Promise.all([
        fetchWithAuth("/api/visits"),
        fetchWithAuth("/api/outlets"),
      ]);

      if (visitsRes.ok) {
        const data = await visitsRes.json();
        setVisits(data);
      }
      if (outletsRes.ok) {
        const oData = await outletsRes.json();
        setOutlets(oData);
        if (oData.length > 0) {
          setFormData((prev) => ({ ...prev, outlet_id: oData[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error("Failed to load visits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetchWithAuth("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outlet_id: parseInt(formData.outlet_id),
          rep_name: formData.rep_name || "Field Officer",
          status: formData.status,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          outlet_id: outlets[0]?.id?.toString() || "",
          rep_name: "",
          status: "completed",
          notes: "",
        });
        loadData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.detail || "Failed to log visit");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log visit");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVisits = visits.filter((v) => {
    const matchesSearch =
      v.outlet_name.toLowerCase().includes(search.toLowerCase()) ||
      v.rep_name.toLowerCase().includes(search.toLowerCase()) ||
      (v.notes && v.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || v.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const completedCount = visits.filter((v) => v.status === "completed").length;
  const scheduledCount = visits.filter((v) => v.status === "scheduled").length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Visits & Audits</h1>
          <p className="text-sm text-gray-500">Execution schedule and field rep outlet audit registry</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#ca1551] hover:bg-[#b01346] text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Log Field Visit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Visits</p>
            <p className="text-3xl font-extrabold text-gray-900">{visits.length}</p>
          </div>
          <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600">
            <Calendar size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Completed Audits</p>
            <p className="text-3xl font-extrabold text-emerald-600">{completedCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Verified on-shelf</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Scheduled / Upcoming</p>
            <p className="text-3xl font-extrabold text-amber-600">{scheduledCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Route plan pipeline</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by outlet name, rep, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Visits</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading field visits...</div>
        ) : visits.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
              <Calendar size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No field visits logged yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-6">
              Track store visits, route schedules, and in-store audits conducted by your field representatives.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#ca1551] hover:bg-[#b01346] text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={15} /> Log First Visit
            </button>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No visits found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Outlet</th>
                  <th className="px-6 py-4">Territory</th>
                  <th className="px-6 py-4">Field Rep</th>
                  <th className="px-6 py-4">Visit Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Captures</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {visit.outlet_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {visit.outlet_city}
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[10px] font-bold">
                          {visit.rep_name.charAt(0)}
                        </span>
                        <span>{visit.rep_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {visit.visit_date}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          visit.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : visit.status === "scheduled"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {visit.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                        <Camera size={13} className="text-gray-400" />
                        {visit.captures_count} audits
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                      {visit.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Log Field Visit</h3>
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

            <form onSubmit={handleCreateVisit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Select Outlet *</label>
                <select
                  required
                  value={formData.outlet_id}
                  onChange={(e) => setFormData({ ...formData, outlet_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code}) - {o.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Field Rep Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanim Ahmed"
                    value={formData.rep_name}
                    onChange={(e) => setFormData({ ...formData, rep_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="completed">Completed</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Audit Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. End-cap display inspected, competitor activity noted on cooking oil..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                ></textarea>
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
                  {submitting ? "Saving..." : "Log Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
