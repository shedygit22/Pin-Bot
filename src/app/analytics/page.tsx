"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PinIcon, LayoutDashboard, CalendarDays, Settings, Library, Sparkles, LogOut,
  TrendingUp, BarChart3, PieChart, Eye, MousePointer2, Bookmark, RefreshCw
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartPie, Pie, Cell
} from "recharts";

const COLORS = ["#E60023", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) { router.push("/"); return; }
      const result = await res.json();
      setData(result);
    } catch { router.push("/"); }
    finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const summaryCards = [
    { label: "Impressions", value: (data?.summary?.impressions || 0).toLocaleString(), icon: Eye, color: "bg-blue-50 text-blue-600" },
    { label: "Saves", value: (data?.summary?.saves || 0).toLocaleString(), icon: Bookmark, color: "bg-green-50 text-green-600" },
    { label: "Clicks", value: (data?.summary?.clicks || 0).toLocaleString(), icon: MousePointer2, color: "bg-purple-50 text-purple-600" },
    { label: "Engagement Rate", value: `${(data?.summary?.engagementRate || 0).toFixed(1)}%`, icon: TrendingUp, color: "bg-pink-50 text-pink-600" },
  ];

  const dailyStats = data?.dailyPins ? Object.entries(data.dailyPins).map(([date, count]) => ({ date, count })) : [];
  const boardData = data?.categoryDistribution ? Object.entries(data.categoryDistribution).map(([name, value]) => ({ name, value })) : [];

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
            { icon: TrendingUp, label: "Analytics", href: "/analytics", active: true },
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
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition mt-auto">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {["week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  period === p ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Pins Published Per Day
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartPie>
                <Pie
                  data={boardData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {boardData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </RechartPie>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Top Performing Pins</h3>
          <div className="space-y-3">
            {(data?.topPins || []).slice(0, 10).map((pin: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {pin.imageUrl && (
                    <img src={pin.imageUrl} alt="" className="w-10 h-14 object-cover rounded" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{pin.title || "Pin"}</p>
                    {pin.pinterestPinUrl && (
                      <a href={pin.pinterestPinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">
                        View on Pinterest
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{(pin.analytics?.[0]?.impressions || 0).toLocaleString()} impressions</span>
                  <span>{(pin.analytics?.[0]?.saves || 0).toLocaleString()} saves</span>
                </div>
              </div>
            ))}
            {(!data?.topPins || data.topPins.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">No analytics data yet. Publish some pins first!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
