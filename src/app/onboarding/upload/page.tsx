"use client";
export const dynamic = "force-dynamic";


import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  PinIcon, Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Sparkles,
  RefreshCw, CalendarDays
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, Settings, Library, LogOut } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<"upload" | "review" | "generate">("upload");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      handleUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function handleUpload(file: File) {
    setParsing(true);
    setStep("upload");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/calendar", { method: "POST", body: formData });
      const data = await res.json();
      if (data.calendarId) {
        setParsed(data);
        setStep("review");
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setParsing(false);
    }
  }

  async function handleGenerate() {
    if (!parsed?.calendarId) return;
    setGenerating(true);
    setStep("generate");
    try {
      const res = await fetch("/api/pins/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: parsed.calendarId }),
      });
      const data = await res.json();
      if (data.totalGenerated > 0) {
        setTimeout(() => router.push("/calendar"), 1500);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setGenerating(false);
    }
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
            { icon: Settings, label: "Settings", href: "/settings" },
            { icon: Sparkles, label: "Upload Calendar", href: "/onboarding/upload", active: true },
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

      <div className="flex-1 p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className={step === "upload" ? "text-indigo-600 font-medium" : ""}>Upload</span>
            <ArrowRight className="w-3 h-3" />
            <span className={step === "review" ? "text-indigo-600 font-medium" : ""}>Review</span>
            <ArrowRight className="w-3 h-3" />
            <span className={step === "generate" ? "text-indigo-600 font-medium" : ""}>Generate</span>
          </div>
        </div>

        {step === "upload" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
              <h1 className="text-2xl font-semibold mb-2">Upload Content Calendar</h1>
              <p className="text-gray-500 mb-6">Upload your CSV, Word doc, or PDF with your monthly content plan</p>

              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 cursor-pointer transition ${
                isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
              }`}>
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {parsing ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="text-gray-600">Parsing file...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">{isDragActive ? "Drop your file here" : "Drag & drop your file here"}</p>
                    <p className="text-sm text-gray-400">CSV, DOCX, DOC, PDF, TXT (max 10MB)</p>
                  </>
                )}
              </div>

              {file && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">{file.name}</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-3">CSV Template Format</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Your CSV needs at least these columns:</p>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs">
                  date,topic_or_title,blog_url,board_name<br />
                  2025-07-01,Healthy Breakfast Ideas,https://myblog.com/breakfast,Food & Nutrition<br />
                  2025-07-02,Budgeting Tips,https://myblog.com/budget,Personal Finance
                </div>
                <p>Optional: <code>content_category, extra_notes, preferred_style, brand_colors, pins_per_day</code></p>
                <a href="/templates/csv-template.csv" download className="text-indigo-600 hover:underline text-sm inline-block mt-2">
                  Download CSV Template
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {step === "review" && parsed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Parsed Content</h2>
                  <p className="text-sm text-gray-500">{parsed.totalEntries} entries found</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>

              {parsed.errors?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium mb-1">
                    <AlertCircle className="w-4 h-4" />
                    Warnings
                  </div>
                  {parsed.errors.map((err: string, i: number) => (
                    <p key={i} className="text-sm text-yellow-600">{err}</p>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2 px-2">Topic</th>
                      <th className="text-left py-2 px-2">Board</th>
                      <th className="text-left py-2 px-2">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.entries.slice(0, 10).map((entry: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 px-2">{entry.date}</td>
                        <td className="py-2 px-2 max-w-[200px] truncate">{entry.topic_or_title}</td>
                        <td className="py-2 px-2">{entry.board_name}</td>
                        <td className="py-2 px-2 max-w-[150px] truncate text-gray-400">{entry.blog_url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.entries.length > 10 && (
                  <p className="text-sm text-gray-400 mt-2">...and {parsed.entries.length - 10} more entries</p>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate AI Content
            </button>
          </motion.div>
        )}

        {step === "generate" && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            {generating ? (
              <>
                <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Generating Your Content</h2>
                <p className="text-gray-500">Creating AI-powered titles, descriptions, hashtags, and images...</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Content Generated!</h2>
                <p className="text-gray-500 mb-4">Redirecting to your calendar...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
