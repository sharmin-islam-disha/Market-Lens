"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiUrl } from "@/lib/auth";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", gmail: "", staff_id: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch(apiUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      router.push("/login?registered=true");
    } else {
      try {
        const data = await res.json();
        setError(data.detail || "Registration failed");
      } catch (err) {
        setError("Registration failed: Server returned an invalid response.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Register Staff</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <input
              type="text" required placeholder="Full Name"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#ca1551] focus:border-[#ca1551] sm:text-sm"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="email" required placeholder="Gmail Address"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#ca1551] focus:border-[#ca1551] sm:text-sm"
              onChange={(e) => setFormData({ ...formData, gmail: e.target.value })}
            />
            <input
              type="text" required placeholder="Staff ID"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#ca1551] focus:border-[#ca1551] sm:text-sm"
              onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
            />
          </div>
          <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#ca1551] hover:bg-[#a61142]">
            Register
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Already registered? <Link href="/login" className="text-[#ca1551] hover:text-[#a61142]">Log in</Link>
        </p>
      </div>
    </div>
  );
}
