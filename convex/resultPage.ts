import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get the current result page configuration
// If no configuration exists, returns null
// The client should handle default values
// This is used by the ResultPage component to display dynamic content
export const getResultPageConfig = query({
  args: {},
  handler: async (ctx: any) => {
    const configs = await ctx.db
      .query("resultPageConfig")
      .withIndex("by_createdAt")
      .order("desc")
      .first();
    
    return configs;
  },
});

// Update the result page configuration
// Creates a new entry if one doesn't exist
// This is used by the admin CMS to update content
export const updateResultPageConfig = mutation({
  args: {
    ctaText: v.optional(v.string()),
    aiPromptConfig: v.optional(v.string()),
    fallbackMessage: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Get the current config if it exists
    const currentConfig = await ctx.db
      .query("resultPageConfig")
      .withIndex("by_createdAt", (q: any) => q.order("desc"))
      .first();
    
    const now = Date.now();
    
    if (currentConfig) {
      // Update existing config
      await ctx.db.patch(currentConfig._id, {
        ...args,
        updatedAt: now,
      });
      return currentConfig._id;
    } else {
      // Create new config if none exists
      return await ctx.db.insert("resultPageConfig", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Create a new result page configuration entry
// This is used for versioning or when needed
export const createResultPageConfig = mutation({
  args: {
    ctaText: v.optional(v.string()),
    aiPromptConfig: v.optional(v.string()),
    fallbackMessage: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("resultPageConfig", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get all result page configurations (for admin view)
export const listResultPageConfigs = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db
      .query("resultPageConfig")
      .withIndex("by_createdAt", (q: any) => q.order("desc"))
      .collect();
  },
});

// Delete a result page configuration entry (for admin use)
export const deleteResultPageConfig = mutation({
  args: {
    configId: v.id("resultPageConfig"),
  },
  handler: async (ctx: any, { configId }: any) => {
    await ctx.db.delete(configId);
    return { ok: true };
  },
});