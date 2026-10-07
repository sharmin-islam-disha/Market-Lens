"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";
import { User, KeyRound, ShieldCheck, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface UserProfile {
  name: string;
  full_name: string;
  gmail: string;
  email: string;
  staff_id: string;
  is_supervisor: boolean;
  has_api_key: boolean;
  api_key_status: string;
  api_key_preview: string | null;
}

type SaveState = "idle" | "saving" | "success" | "error";

function StatusBadge({ success, message }: { success: boolean; message: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileState, setProfileState] = useState<SaveState>("idle");
  const [profileMsg, setProfileMsg] = useState("");

  // API key form state
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyState, setKeyState] = useState<SaveState>("idle");
  const [keyMsg, setKeyMsg] = useState("");

  useEffect(() => {
    fetchWithAuth("/api/auth/me")
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setUser(data);
        setProfileName(data.full_name || data.name || "");
        setProfileEmail(data.gmail || data.email || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileState("saving");
    setProfileMsg("");
    try {
      const res = await fetchWithAuth("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, gmail: profileEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update profile");
      setUser((prev) => prev ? { ...prev, ...data } : data);
      setProfileState("success");
      setProfileMsg("Profile updated successfully.");
    } catch (err: unknown) {
      setProfileState("error");
      setProfileMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function saveApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setKeyState("saving");
    setKeyMsg("");
    try {
      const res = await fetchWithAuth("/api/auth/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid API key");
      setUser((prev) => prev ? { ...prev, has_api_key: true, api_key_status: "Valid", api_key_preview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` } : prev);
      setApiKey("");
      setKeyState("success");
      setKeyMsg("API key updated and verified successfully.");
    } catch (err: unknown) {
      setKeyState("error");
      setKeyMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#ca1551]" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile, API key, and account details.</p>
      </div>

      <div className="space-y-6">

        {/* ── Profile ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <User size={16} className="text-[#ca1551]" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Profile</h2>
          </div>
          <form onSubmit={saveProfile} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ca1551]/20 focus:border-[#ca1551] transition-colors"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ca1551]/20 focus:border-[#ca1551] transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              {profileState !== "idle" && profileMsg ? (
                <StatusBadge success={profileState === "success"} message={profileMsg} />
              ) : <div />}
              <button
                type="submit"
                disabled={profileState === "saving"}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#ca1551] hover:bg-[#a61142] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
              >
                {profileState === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Profile
              </button>
            </div>
          </form>
        </section>

        {/* ── API Key ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <KeyRound size={16} className="text-[#ca1551]" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Gemini API Key</h2>
            <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full ${user?.has_api_key ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {user?.has_api_key ? "Active" : "Not Configured"}
            </span>
          </div>
          <div className="px-6 py-5 space-y-4">
            {user?.api_key_preview && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-500">Current key</p>
                  <p className="text-sm font-mono font-bold text-gray-800">{user.api_key_preview}</p>
                </div>
              </div>
            )}
            <form onSubmit={saveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  {user?.has_api_key ? "Replace with new key" : "Enter your Gemini API key"}
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ca1551]/20 focus:border-[#ca1551] transition-colors font-mono"
                    placeholder="AIza..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Used for AI shelf vision analysis. Key is validated before saving.</p>
              </div>
              <div className="flex items-center justify-between">
                {keyState !== "idle" && keyMsg ? (
                  <StatusBadge success={keyState === "success"} message={keyMsg} />
                ) : <div />}
                <button
                  type="submit"
                  disabled={keyState === "saving" || !apiKey.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#ca1551] hover:bg-[#a61142] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  {keyState === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {user?.has_api_key ? "Update Key" : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── Account Info ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <ShieldCheck size={16} className="text-[#ca1551]" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Account</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Staff ID</p>
              <p className="text-sm font-bold text-gray-800 font-mono">{user?.staff_id || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Role</p>
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${user?.is_supervisor ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                {user?.is_supervisor ? "Supervisor" : "Field Representative"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">AI Vision</p>
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${user?.has_api_key ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                {user?.api_key_status || "Not Configured"}
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
