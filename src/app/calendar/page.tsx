"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PinIcon, LayoutDashboard, Settings, Library, Sparkles,
  ChevronLeft, ChevronRight, CalendarDays, Clock, ExternalLink
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pins, setPins] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedPin, setDraggedPin] = useState<any>(null);

  useEffect(() => { fetchPins(); }, [currentMonth]);

  async function fetchPins() {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const res = await fetch(`/api/pins/schedule?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setPins(data.pins || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const pinsByDay = pins.reduce((acc: any, pin: any) => {
    const dayKey = format(new Date(pin.scheduledAt), "yyyy-MM-dd");
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(pin);
    return acc;
  }, {} as Record<string, any[]>);

  async function handleDragEnd(pinId: string, newDate: Date) {
    try {
      await fetch("/api/pins/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinId, scheduledAt: newDate.toISOString() }),
      });
      fetchPins();
    } catch (error) {
      console.error("Reschedule failed:", error);
    }
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
            { icon: CalendarDays, label: "Calendar", href: "/calendar", active: true },
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
      </aside>

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full" /> Published</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Scheduled</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full" /> Processing</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">{d}</div>
            ))}
            {Array.from({ length: new Date(startOfMonth(currentMonth)).getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="bg-white p-3 min-h-[100px]" />
            ))}
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayPins = pinsByDay[dayKey] || [];

              return (
                <div
                  key={dayKey}
                  onClick={() => setSelectedDay(day)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => draggedPin && handleDragEnd(draggedPin.id, day)}
                  className={`bg-white p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 ${
                    isToday(day) ? "ring-2 ring-indigo-500 ring-inset" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isToday(day) ? "text-indigo-600" : "text-gray-700"}`}>
                      {format(day, "d")}
                    </span>
                    {dayPins.length > 0 && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{dayPins.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayPins.slice(0, 3).map((pin: any) => (
                      <div
                        key={pin.id}
                        draggable
                        onDragStart={() => setDraggedPin(pin)}
                        className={`text-xs p-1 rounded truncate ${
                          pin.status === "published" ? "bg-green-100 text-green-700" :
                          pin.status === "processing" ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {pin.generatedTitle?.substring(0, 25)}...
                      </div>
                    ))}
                    {dayPins.length > 3 && (
                      <div className="text-xs text-gray-400">+{dayPins.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center" onClick={() => setSelectedDay(null)}>
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{format(selectedDay, "EEEE, MMMM d, yyyy")}</h3>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
              </div>
              <div className="space-y-3">
                {(pinsByDay[format(selectedDay, "yyyy-MM-dd")] || []).map((pin: any) => (
                  <div key={pin.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    {pin.imageUrl && (
                      <img src={pin.imageUrl} alt="" className="w-16 h-20 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{pin.generatedTitle}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(pin.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {pin.boardName && <span>| {pin.boardName}</span>}
                      </div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                        pin.status === "published" ? "bg-green-100 text-green-700" :
                        pin.status === "processing" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{pin.status}</span>
                    </div>
                    {pin.pinterestPinUrl && (
                      <a href={pin.pinterestPinUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {(!pinsByDay[format(selectedDay, "yyyy-MM-dd")] || pinsByDay[format(selectedDay, "yyyy-MM-dd")].length === 0) && (
                <p className="text-gray-400 text-center py-8">No pins scheduled for this day</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
