"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  Camera,
  Store,
  Package,
  MapPin,
  LogOut,
  CheckCircle,
  AlertCircle,
  Layers,
  Settings
} from "lucide-react";
import { logout, fetchWithAuth } from "@/lib/auth";
import InstallPrompt from "@/components/InstallPrompt";

interface UserProfile {
  name: string;
  gmail: string;
  staff_id: string;
  has_api_key?: boolean;
  api_key_status?: string;
  api_key_preview?: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchWithAuth("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Insights", href: "/insights", icon: Lightbulb },
    { name: "Capture Shelf", href: "/capture", icon: Camera },
    { name: "Audit History", href: "/audits", icon: Layers },
    { name: "Outlets", href: "/outlets", icon: Store },
    { name: "Products", href: "/products", icon: Package },
    { name: "Visits", href: "/visits", icon: MapPin },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-gradient-to-b from-[#ca1551] to-[#e03729] text-white flex flex-col justify-between shadow-2xl z-10 relative">
        <div>
          {/* Logo */}
          <div className="p-6 pb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Camera size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-wide">MarketLens</h1>
                <p className="text-[10px] tracking-widest text-white/80 font-medium uppercase">Execution Intelligence</p>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? "bg-white/20 text-white shadow-sm backdrop-blur-sm" 
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon size={18} className={isActive ? "text-white" : "text-white/70"} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

        </div>

        <InstallPrompt />

        {/* Bottom User Section */}
        <div className="p-4 bg-black/10 backdrop-blur-md border-t border-white/10 flex items-center justify-between">
          <div className="overflow-hidden mr-2">
            <p className="text-sm font-semibold text-white truncate">{user?.name || "Field Officer"}</p>
            <p className="text-xs text-white/70 truncate">{user?.gmail || (user?.staff_id ? `ID: ${user.staff_id}` : "rep@aci.com")}</p>
          </div>
          <button onClick={logout} title="Sign out" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white flex-shrink-0">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex flex-col">
        {children}
        
        {/* Footer */}
        <footer className="mt-auto px-8 py-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500 bg-white">
          <p>ACI Retail Execution Intelligence — vision pipeline + deterministic analytics</p>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Beta · Version 1.0
            </span>
            <p>© 2026 ACI PLC - demo environment</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
