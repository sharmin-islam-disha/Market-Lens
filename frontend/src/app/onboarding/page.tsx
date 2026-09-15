"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth";

export default function Onboarding() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetchWithAuth("/api/auth/api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });

    setLoading(false);
    if (res.ok) {
      setSuccess("✓ Valid API Key! Live Google Gemini verification passed. Redirecting to Dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } else {
      const data = await res.json();
      setError(data.detail || "Failed to validate API Key");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Setup Required</h2>
        <p className="text-center text-sm text-gray-500">
          Please provide your Gemini API key to activate shelf analysis features.
        </p>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && (
          <p className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-lg text-center">
            {success}
          </p>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <input
              type="text" required placeholder="Gemini API Key (AIza... or AQ...)"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#ca1551] focus:border-[#ca1551] sm:text-sm"
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#ca1551] hover:bg-[#a61142] disabled:opacity-50"
          >
            {loading ? "Validating..." : "Save and Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
