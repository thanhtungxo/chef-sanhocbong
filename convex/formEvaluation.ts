import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { loadRulesServer, evaluateWithRules } from "./utils/rules"
import { listScholarships } from "./scholarships"
import type { ScholarshipEvaluationSummary, EligibilityResult } from "./shared/eligibility"
import { toAnswerSet } from "./shared/mappers"
import { getAuthUserId } from "@convex-dev/auth/server"

// Evaluate form responses against all active scholarships
// Returns eligibility status for each scholarship
// This is used by the BrandedDynamicWizard to determine which scholarships to show on ResultPage
export const evaluateFormResponses = query({
  args: {
    responses: v.object({}), // Dynamic object containing all form responses
  },
  handler: async (ctx, { responses }) => {
    // Get all available scholarships
    // Instead of calling .handler directly, query the database directly
    const scholarships = await ctx.db.query("scholarships").collect()
    
    // Filter active scholarships
    const activeScholarships = scholarships.filter((s: any) => s.isEnabled)
    
    // Map form field names to rule field names to ensure consistency
    const mappedResponses = toAnswerSet(responses)

    // Process each scholarship to determine eligibility
    const eligibilityResults: ScholarshipEvaluationSummary[] = []
    
    for (const scholarship of activeScholarships) {
      try {
        // Load rules for this scholarship
        const rules = await loadRulesServer(ctx, scholarship.id)
        
        // Evaluate eligibility using the rules
        const evaluation = evaluateWithRules(mappedResponses, rules)
        
        // Format the result for this scholarship
        eligibilityResults.push({
          id: scholarship.id,
          name: scholarship.name,
          eligible: evaluation.passed,
          reasons: evaluation.failedRules.map(r => r.message),
        })
      } catch (error) {
        console.error(`Failed to evaluate scholarship ${scholarship.id}:`, error)
        // In case of error, mark as not eligible with an error message
        eligibilityResults.push({
          id: scholarship.id,
          name: scholarship.name,
          eligible: false,
          reasons: ["Lỗi trong quá trình đánh giá đủ điều kiện"],
        })
      }
    }
    
    return eligibilityResults
  },
})

// Submit form responses and evaluate eligibility
// This function handles the full submission flow
// 1. Save responses (if needed)
// 2. Evaluate eligibility
// 3. Return results
// This is called from the BrandedDynamicWizard when the user clicks "Hoàn thành"
export const submitAndEvaluateForm = mutation({ 
    args: { 
        responses: v.any(), 
        fullName: v.string(), 
        email: v.string() 
    }, 
    handler: async (ctx, { responses, fullName, email }) => {
    // Log submission details
    console.log("Form submitted:", {
        fullName,
        email,
        responses
    })
    
    // Get all available scholarships
    const scholarships = await ctx.db.query("scholarships").collect()
    const activeScholarships = scholarships.filter((s: any) => s.isEnabled)
    
    // Map form field names to rule field names to ensure consistency
      // This is crucial for proper eligibility evaluation
      const mappedResponses = toAnswerSet(responses)
    
    const eligibilityResults: ScholarshipEvaluationSummary[] = []
    
    for (const scholarship of activeScholarships) {
        try {
            // Load rules for this scholarship
            const rules = await loadRulesServer(ctx, scholarship.id)
            // Evaluate eligibility
            const evaluation = evaluateWithRules(mappedResponses, rules)
            
            eligibilityResults.push({
                id: scholarship.id,
                name: scholarship.name,
                eligible: evaluation.passed,
                reasons: evaluation.failedRules.map(r => r.message),
            })
        } catch (error) {
            console.error(`Failed to evaluate scholarship ${scholarship.id}:`, error)
            eligibilityResults.push({
                id: scholarship.id,
                name: scholarship.name,
                eligible: false,
                reasons: ["Lỗi trong quá trình đánh giá đủ điều kiện"],
            })
        }
    }
    
    // Log the results for debugging
    console.log("Form submission results:", {
        fullName,
        email,
        eligibilityResults
    })
    
    // Calculate messageType based on eligibility results
    const totalScholarships = eligibilityResults.length
    const passedScholarships = eligibilityResults.filter(result => result.eligible).length
    
    // Debug logging
    console.log(`Form evaluation stats: Total=${totalScholarships}, Passed=${passedScholarships}`)
    console.log(`Scholarship eligibility details:`, eligibilityResults)
    
    let messageType: "fail_all" | "pass_all" | "pass_some" = "pass_some"
    let overallEligible = false
    
    if (passedScholarships === 0) {
        messageType = "fail_all"
        overallEligible = false
        console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`)
    } else if (passedScholarships === totalScholarships) {
        messageType = "pass_all"
        overallEligible = true
        console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`)
    } else {
        messageType = "pass_some"
        overallEligible = true
        console.log(`Calculated messageType: ${messageType}, eligible: ${overallEligible}`)
    }
    
    // Return all evaluation results with messageType
    const result: EligibilityResult = {
        applicationId: "", // This will be populated when saved
        scholarships: eligibilityResults,
        eligible: overallEligible,
        messageType
    }

    // Persist submission to form_submissions table (new normalized storage)
    const userId = await getAuthUserId(ctx)
    const applicationId = await ctx.db.insert("form_submissions", {
      userId: userId ?? undefined,
      fullName,
      email,
      responses,
      normalizedAnswers: mappedResponses,
      result,
      createdAt: Date.now(),
    })

    // Attach the new application id to the result for downstream usage
    result.applicationId = applicationId as unknown as string
    return result
} })