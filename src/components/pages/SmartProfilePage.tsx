import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";

export function SmartProfilePage() {
  const user = useQuery(api.auth.loggedInUser);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-heading font-semibold bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">
            Smart Profile Analysis
          </h1>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete("ui");
              window.location.href = url.toString();
            }}
            className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow hover:bg-slate-700"
          >
            ← Back
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm"
        >
          <div className="mb-4">
            <p className="text-slate-700">
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
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Strength Highlights</h2>
              <ul className="list-disc pl-5 text-sm text-slate-700">
                <li>Strong English proficiency and relevant experience</li>
                <li>Clear career progression and leadership potential</li>
                <li>Well-aligned with scholarship objectives</li>
              </ul>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Areas to Improve</h2>
              <ul className="list-disc pl-5 text-sm text-slate-700">
                <li>Provide more quantified impact in your achievements</li>
                <li>Strengthen community involvement examples</li>
                <li>Clarify long-term goals and alignment with host country</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <h2 className="mb-2 text-sm font-semibold text-green-800">Next Steps</h2>
            <p className="text-sm text-green-700">
              We will soon use your saved form submission to tailor an in-depth analysis. Stay tuned.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}