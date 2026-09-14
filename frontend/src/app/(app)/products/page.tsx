"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Search, Tag, DollarSign, Percent, Trash2, X } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

interface Product {
  id: number;
  sku_code: string;
  name: string;
  brand: string;
  category: string;
  is_aci: boolean;
  mrp: number;
  target_shelf_share: number;
  created_at: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "aci" | "competitors">("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    sku_code: "",
    name: "",
    brand: "ACI",
    category: "staples",
    is_aci: true,
    mrp: 100.0,
    target_shelf_share: 30.0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetchWithAuth("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          sku_code: "",
          name: "",
          brand: "ACI",
          category: "staples",
          is_aci: true,
          mrp: 100.0,
          target_shelf_share: 30.0,
        });
        loadProducts();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.detail || "Failed to create product");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this SKU from the master catalog?")) {
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku_code.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "aci" && p.is_aci) ||
      (activeTab === "competitors" && !p.is_aci);

    const matchesCategory =
      selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesTab && matchesCategory;
  });

  const aciCount = products.filter((p) => p.is_aci).length;
  const compCount = products.filter((p) => !p.is_aci).length;
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product & SKU Master</h1>
          <p className="text-sm text-gray-500">Master product catalog tracking ACI and competitor brand SKUs</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#ca1551] hover:bg-[#b01346] text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total SKUs</p>
            <p className="text-3xl font-extrabold text-gray-900">{products.length}</p>
          </div>
          <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ACI SKUs</p>
            <p className="text-3xl font-extrabold text-[#f59e0b]">{aciCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Portfolio brands</p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-[#f59e0b]">
            <Tag size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Competitor SKUs</p>
            <p className="text-3xl font-extrabold text-[#831843]">{compCount}</p>
            <p className="text-[11px] text-gray-400 mt-1">Monitored peers</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-[#831843]">
            <Tag size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Active Categories</p>
            <p className="text-3xl font-extrabold text-gray-900">{categories.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">{categories.join(", ")}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Percent size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "all"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("aci")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "aci"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            ACI Brands ({aciCount})
          </button>
          <button
            onClick={() => setActiveTab("competitors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "competitors"
                ? "bg-[#831843] text-white shadow-sm"
                : "bg-rose-50 text-[#831843] hover:bg-rose-100"
            }`}
          >
            Competitors ({compCount})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading products catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
              <Package size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No products in catalog yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-6">
              Register your ACI brand products and competitor reference SKUs to begin tracking shelf presence.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#ca1551] hover:bg-[#b01346] text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={15} /> Add First Product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No products found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Official MRP</th>
                  <th className="px-6 py-4">Target Share</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-gray-700">
                      {prod.sku_code}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{prod.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          prod.is_aci
                            ? "bg-amber-100 text-amber-900"
                            : "bg-rose-100 text-rose-900"
                        }`}
                      >
                        {prod.brand} {prod.is_aci ? "(ACI)" : "(COMP)"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      ৳{prod.mrp.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">
                      {prod.target_shelf_share}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add New SKU</h3>
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

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACI-OIL-1L"
                    value={formData.sku_code}
                    onChange={(e) => setFormData({ ...formData, sku_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACI or Pran"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACI Pure Soya Oil 1L"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="staples">Staples</option>
                    <option value="cooking">Cooking</option>
                    <option value="beverages">Beverages</option>
                    <option value="spices">Spices</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Is ACI Portfolio?</label>
                  <label className="flex items-center gap-2 mt-2 text-sm text-gray-800 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_aci}
                      onChange={(e) => setFormData({ ...formData, is_aci: e.target.checked })}
                      className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                    />
                    <span>Yes, this is an ACI product</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Official MRP (৳) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Target Shelf Share (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.target_shelf_share}
                    onChange={(e) => setFormData({ ...formData, target_shelf_share: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
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
                  {submitting ? "Saving..." : "Create SKU"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
