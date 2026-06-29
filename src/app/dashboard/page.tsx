"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, CalendarDays, Settings, Library, Sparkles,
  TrendingUp, PinIcon, BarChart3, Clock, CheckCircle2, RefreshCw,
  MessageCircle, Bell, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [analyticsRes, notifRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/notifications"),
      ]);
      if (!analyticsRes.ok) { router.push("/"); return; }
      const analytics = await analyticsRes.json();
      const notifData = await notifRes.json();
      setData(analytics);
      setNotifications(notifData.notifications);
      setUnreadCount(notifData.unreadCount);
    } catch { router.push("/"); }
    finally { setLoading(false); }
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
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
            { icon: CalendarDays, label: "Calendar", href: "/calendar" },
            { icon: Library, label: "Content Library", href: "/content-library" },
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
        <div className="mt-auto" />
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
        </header>

        {notifOpen && (
          <div className="absolute top-16 right-6 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <button onClick={async () => {
                await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
                setUnreadCount(0);
              }} className="text-xs text-indigo-600">Mark all read</button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.slice(0, 10).map((n: any) => (
                <div key={n.id} className={`p-3 border-b border-gray-50 ${!n.isRead ? "bg-indigo-50" : ""}`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-lg ${n.type === "error" ? "text-red-500" : n.type === "warning" ? "text-yellow-500" : "text-blue-500"}`}>!</span>
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Published", value: data?.summary?.published || 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
              { label: "Scheduled", value: data?.summary?.scheduled || 0, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Impressions", value: (data?.summary?.impressions || 0).toLocaleString(), icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Engagement Rate", value: (data?.summary?.engagementRate || 0).toFixed(1) + "%", icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{label}</span>
                  <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {data?.upcomingPins?.slice(0, 5).map((pin: any) => (
                  <div key={pin.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {pin.imageUrl && <img src={pin.imageUrl} alt="" className="w-12 h-16 object-cover rounded" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pin.generatedTitle}</p>
                      <p className="text-xs text-gray-500">{new Date(pin.scheduledAt).toLocaleDateString()} at {new Date(pin.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${pin.status === "published" ? "bg-green-100 text-green-700" : pin.status === "processing" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>{pin.status}</span>
                  </div>
                ))}
                {(!data?.upcomingPins || data.upcomingPins.length === 0) && (
                  <p className="text-gray-500 text-sm text-center py-8">No pins yet. Upload a content calendar!</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Category Distribution</h2>
              {data?.categoryDistribution && Object.keys(data.categoryDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(data.categoryDistribution).map(([cat, count]: [string, any]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 truncate">{cat}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(data.categoryDistribution) as any)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-sm text-center py-8">No data yet</p>}
            </div>
          </div>
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition">
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      </div>
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hi! I'm PinBot, your Pinterest automation assistant." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  async function send() {
    if (!input.trim() || sending) return;
    setMessages((prev) => [...prev, { role: "user", content: input.trim() }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, conversationId: convId }),
      });
      const data = await res.json();
      if (data.conversationId) setConvId(data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
    } finally { setSending(false); }
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">PinBot Assistant</span>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">&times;</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}>{m.content}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask PinBot..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={send} disabled={sending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Send</button>
        </div>
      </div>
    </div>
  );
}
