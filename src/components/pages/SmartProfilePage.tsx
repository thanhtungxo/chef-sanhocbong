import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";

export function SmartProfilePage() {
  const user = useQuery(api.auth.loggedInUser);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with gradient ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5]" aria-hidden="true"></div>
              <div className="relative w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-gray-200">
                {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-heading font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5]">
                Smart Profile Analysis
              </h1>
              <p className="text-xs text-muted-foreground">Khám phá hồ sơ thông minh của bạn với phân tích theo phong cách Sanhocbong</p>
            </div>
          </div>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("ui");
              window.location.href = url.toString();
            }}
            className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow hover:bg-slate-700 dark:bg-gray-800 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d2ff]"
          >
            ← Back
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-6 shadow-sm"
        >
          <div className="mb-4">
            <p className="text-slate-700 dark:text-gray-200">
              {user ? (
                <>
                  Welcome, <span className="font-semibold">{user.name ?? user.email ?? "User"}</span>. Below is a preview of the next-generation analysis page.
                </>
              ) : (
                <>Welcome to Smart Profile Analysis. Sign in to personalize your insights.</>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/50 p-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-gray-100">Strength Highlights</h2>
              <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-gray-300">
                <li>Strong English proficiency and relevant experience</li>
                <li>Clear career progression and leadership potential</li>
                <li>Well-aligned with scholarship objectives</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/50 p-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-gray-100">Areas to Improve</h2>
              <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-gray-300">
                <li>Provide more quantified impact in your achievements</li>
                <li>Strengthen community involvement examples</li>
                <li>Clarify long-term goals and alignment with host country</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/30 p-4">
            <h2 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">Next Steps</h2>
            <p className="text-sm text-green-700 dark:text-green-200">
              We will soon use your saved form submission to tailor an in-depth analysis. Stay tuned.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("ui", "smart-profile");
                window.location.href = url.toString();
              }}
              className="relative overflow-hidden rounded-md px-4 py-2 text-sm font-medium text-white shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d2ff] bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] hover:shadow-[0_0_12px_rgba(58,123,213,0.45)] hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              Continue to Deep Analysis
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}