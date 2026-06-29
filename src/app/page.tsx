"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { PinIcon, SparklesIcon, CalendarDaysIcon, ChartBarIcon, MessageCircleIcon } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isRegister) {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Registration failed");
          return;
        }
      } catch {
        setError("Registration failed");
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <PinIcon className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PinBot</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsRegister(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!isRegister ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isRegister ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              Get Started
            </button>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Automate Your{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Pinterest</span>{" "}
              Content with AI
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Upload a content calendar once. Our AI generates optimized pins, creates stunning images, and publishes them automatically. Set it and forget it.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: SparklesIcon, text: "AI-Generated Pins" },
                { icon: CalendarDaysIcon, text: "Auto Schedule" },
                { icon: ChartBarIcon, text: "Smart Analytics" },
                { icon: MessageCircleIcon, text: "AI Chat Assistant" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon className="w-4 h-4 text-indigo-600" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold mb-6">{isRegister ? "Create Account" : "Sign In"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your name"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={isRegister ? "Min 8 characters" : "Your password"}
                  required
                  minLength={8}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
              >
                {isRegister ? "Create Account" : "Sign In"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
