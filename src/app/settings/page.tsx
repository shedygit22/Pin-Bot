"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PinIcon, LayoutDashboard, CalendarDays, Library, Sparkles, LogOut,
  Save, RefreshCw, CheckCircle2
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({ brand: {}, user: {}, pinterest: { connected: false } });

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: settings.brand, user: settings.user }),
      });
    } catch (error) { console.error(error); }
    finally { setSaving(false); }
  }

  async function connectPinterest() {
    try {
      const res = await fetch("/api/pinterest/connect");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) { console.error(error); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <PinIcon className="w-7 h-7 text-indigo-600" />
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PinBot</span>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
            { icon: CalendarDays, label: "Calendar", href: "/calendar" },
            { icon: Library, label: "Content Library", href: "/content-library" },
            { icon: PinIcon, label: "Settings", href: "/settings", active: true },
            { icon: Sparkles, label: "Upload Calendar", href: "/onboarding/upload" },
          ].map(({ icon: Icon, label, href, active }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <button onClick={saveSettings} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Pinterest Connection</h2>
            <div className="flex items-center justify-between">
              <div>
                {settings.pinterest?.connected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Connected to Pinterest</span>
                  </div>
                ) : (
                  <p className="text-gray-500">Connect your Pinterest business account</p>
                )}
              </div>
              <button onClick={connectPinterest}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600">
                {settings.pinterest?.connected ? "Reconnect" : "Connect Pinterest"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Brand Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input type="text" value={settings.brand?.brandName || ""}
                  onChange={(e) => setSettings((s: any) => ({ ...s, brand: { ...s.brand, brandName: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Voice</label>
                <select value={settings.brand?.brandVoice || "professional"}
                  onChange={(e) => setSettings((s: any) => ({ ...s, brand: { ...s.brand, brandVoice: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="professional">Professional & Authority</option>
                  <option value="educational">Educational & Informative</option>
                  <option value="motivational">Motivational & Inspirational</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="creative">Creative & Playful</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Niche Description</label>
                <textarea value={settings.brand?.nicheDescription || ""}
                  onChange={(e) => setSettings((s: any) => ({ ...s, brand: { ...s.brand, nicheDescription: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Colors</label>
                <div className="flex gap-2 flex-wrap">
                  {(settings.brand?.brandColors || ["#667eea"]).map((color: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="color" value={color}
                        onChange={(e) => {
                          const colors = [...(settings.brand?.brandColors || [])];
                          colors[i] = e.target.value;
                          setSettings((s: any) => ({ ...s, brand: { ...s.brand, brandColors: colors } }));
                        }}
                        className="w-10 h-10 rounded cursor-pointer" />
                      <button onClick={() => setSettings((s: any) => ({ ...s, brand: { ...s.brand, brandColors: s.brand.brandColors.filter((_: any, idx: number) => idx !== i) } }))}
                        className="text-red-500 text-sm">&times;</button>
                    </div>
                  ))}
                  {(settings.brand?.brandColors || []).length < 5 && (
                    <button onClick={() => setSettings((s: any) => ({ ...s, brand: { ...s.brand, brandColors: [...(s.brand.brandColors || []), "#000000"] } }))}
                      className="px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400">+ Add Color</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Automation Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Pins Per Day</label>
                <select value={settings.brand?.defaultPinsPerDay || 4}
                  onChange={(e) => setSettings((s: any) => ({ ...s, brand: { ...s.brand, defaultPinsPerDay: parseInt(e.target.value) } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value={3}>3 pins</option>
                  <option value={4}>4 pins</option>
                  <option value={5}>5 pins</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Fill Empty Days</label>
                <select value={settings.brand?.autoFillEnabled ? "yes" : "no"}
                  onChange={(e) => setSettings((s: any) => ({ ...s, brand: { ...s.brand, autoFillEnabled: e.target.value === "yes" } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select value={settings.user?.timezone || "UTC"}
                  onChange={(e) => setSettings((s: any) => ({ ...s, user: { ...s.user, timezone: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Chicago">America/Chicago</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
