import { v } from "convex/values";
import { loadRulesServer, evaluateWithRules } from "./utils/rules";
import { v } from "convex/values";
import { listScholarships } from "./scholarships";
import type { ScholarshipEvaluationSummary } from "./shared/eligibility";

// Evaluate form responses against all active scholarships
// Returns eligibility status for each scholarship
// This is used by the BrandedDynamicWizard to determine which scholarships to show on ResultPage
export const evaluateFormResponses = query({
  args: {
    responses: v.object({}), // Dynamic object containing all form responses
  },
  handler: async (ctx, { responses }) => {
    // Get all available scholarships
    const scholarships = await listScholarships.handler(ctx, {});
    
    // Filter active scholarships
    const activeScholarships = scholarships.filter(s => s.isEnabled);
    
    // Process each scholarship to determine eligibility
    const eligibilityResults: ScholarshipEvaluationSummary[] = [];
    
    for (const scholarship of activeScholarships) {
      try {
        // Load rules for this scholarship
        const rules = await loadRulesServer(ctx, scholarship.id);
        
        // Evaluate eligibility using the rules
        const evaluation = evaluateWithRules(responses, rules);
        
        // Format the result for this scholarship
        eligibilityResults.push({
          id: scholarship.id,
          name: scholarship.name,
          eligible: evaluation.passed,
          reasons: evaluation.failedRules.map(r => r.message),
        });
      } catch (error) {
        console.error(`Failed to evaluate scholarship ${scholarship.id}:`, error);
        // In case of error, mark as not eligible with an error message
        eligibilityResults.push({
          id: scholarship.id,
          name: scholarship.name,
          eligible: false,
          reasons: ["Lỗi trong quá trình đánh giá đủ điều kiện"],
        });
      }
    }
    
    return eligibilityResults;
  },
});

// Submit form responses and evaluate eligibility
// This function handles the full submission flow
// 1. Save responses (if needed)
// 2. Evaluate eligibility
// 3. Return results
// This is called from the BrandedDynamicWizard when the user clicks "Hoàn thành"
export const submitAndEvaluateForm = mutation({
  args: {
    responses: v.object({}), // Dynamic object containing all form responses
    fullName: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { responses, fullName, email }) => {
    // TODO: In the future, we might want to save the full form submission to the database
    // For now, we'll just evaluate the responses
    
    // Evaluate eligibility against all active scholarships
    const eligibilityResults = await evaluateFormResponses.handler(ctx, { responses });
    
    // Log the results for debugging
    console.log("Form submission results:", {
      fullName,
      email,
      responses,
      eligibilityResults,
    });
    
    // Return only eligible scholarships for display on ResultPage
    const eligibleScholarships = eligibilityResults.filter(s => s.eligible);
    
    return {
      eligibleScholarships,
      allResults: eligibilityResults,
    };
  },
});