// src/lib/evaluator.ts
// Safe evaluator wrapper + rules loader. Avoids string eval entirely.
export { evaluateEligibility } from "../../types/eligibility";
export { loadRules, loadRulesWithIssues } from "./engine/loader";
