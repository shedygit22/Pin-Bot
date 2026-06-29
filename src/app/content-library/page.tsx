"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PinIcon, LayoutDashboard, CalendarDays, Settings, Sparkles, LogOut,
  Search, Filter, ExternalLink, RefreshCw, Trash2, Clock, CheckCircle2, XCircle
} from "lucide-react";

export default function ContentLibraryPage() {
  const router = useRouter();
  const [pins, setPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPins, setSelectedPins] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPins();
  }, []);

  async function fetchPins() {
    try {
      const res = await fetch("/api/pins/schedule");
      if (res.ok) {
        const data = await res.json();
        setPins(data.pins || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filteredPins = pins.filter((pin) => {
    const matchesSearch = pin.generatedTitle?.toLowerCase().includes(search.toLowerCase()) ||
      pin.boardName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || pin.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleBulkDelete() {
    if (selectedPins.size === 0) return;
    if (!confirm(`Delete ${selectedPins.size} pins?`)) return;
    await fetch("/api/pins/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinIds: Array.from(selectedPins) }),
    });
    setSelectedPins(new Set());
    fetchPins();
  }

  async function handleRegenerate(pinId: string, element: string) {
    await fetch("/api/pins/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId, element }),
    });
    fetchPins();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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
            { icon: PinIcon, label: "Content Library", href: "/content-library", active: true },
            { icon: Settings, label: "Settings", href: "/settings" },
            { icon: Sparkles, label: "Upload Calendar", href: "/onboarding/upload" },
          ].map(({ icon: Icon, label, href, active }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Content Library</h1>
          <div className="flex items-center gap-3">
            {selectedPins.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 text-red-600 text-sm hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedPins.size})
              </button>
            )}
            <button
              onClick={fetchPins}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pins..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Scheduled</option>
            <option value="processing">Processing</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPins.map((pin) => (
            <div
              key={pin.id}
              className={`bg-white rounded-xl border overflow-hidden transition hover:shadow-md ${
                selectedPins.has(pin.id) ? "ring-2 ring-indigo-500" : "border-gray-200"
              }`}
            >
              <div
                onClick={() => {
                  const newSet = new Set(selectedPins);
                  if (newSet.has(pin.id)) newSet.delete(pin.id);
                  else newSet.add(pin.id);
                  setSelectedPins(newSet);
                }}
                className="relative cursor-pointer"
              >
                {pin.imageUrl ? (
                  <img src={pin.imageUrl} alt={pin.generatedTitle} className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <PinIcon className="w-8 h-8 text-indigo-300" />
                  </div>
                )}
                <div className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-medium ${
                  pin.status === "published" ? "bg-green-500 text-white" :
                  pin.status === "processing" ? "bg-yellow-500 text-white" :
                  pin.status === "failed" ? "bg-red-500 text-white" :
                  "bg-blue-500 text-white"
                }`}>
                  {pin.status}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{pin.generatedTitle}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(pin.scheduledAt).toLocaleDateString()}
                  {pin.boardName && <span>| {pin.boardName}</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {pin.pinterestPinUrl && (
                    <a href={pin.pinterestPinUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => handleRegenerate(pin.id, "title")}
                    className="text-xs text-gray-500 hover:text-indigo-600"
                  >
                    Regen Title
                  </button>
                  <button
                    onClick={() => handleRegenerate(pin.id, "image")}
                    className="text-xs text-gray-500 hover:text-indigo-600"
                  >
                    Regen Image
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPins.length === 0 && (
          <div className="text-center py-16">
            <PinIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No pins found</h3>
            <p className="text-sm text-gray-400 mb-4">Upload a content calendar to generate pins</p>
            <Link href="/onboarding/upload" className="text-indigo-600 hover:underline text-sm">
              Upload Calendar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
