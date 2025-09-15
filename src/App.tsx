import { Toaster } from "sonner";
import { EligibilityChecker } from "@/components/pages/EligibilityChecker";
import { LanguageToggle } from "@/components/LanguageToggle";
import { RulesetRegistry } from "@/components/pages/RulesetRegistry";

export default function App() {
  const admin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1';
  const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL as string | undefined;
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <LanguageToggle />
      {admin ? (
        convexUrl ? (
          <RulesetRegistry />
        ) : (
          <div className="max-w-xl mx-auto mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            Admin features disabled: missing VITE_CONVEX_URL. Configure Convex URL to use the registry.
          </div>
        )
      ) : (
        <EligibilityChecker />
      )}
      <Toaster />
    </div>
  );
}
