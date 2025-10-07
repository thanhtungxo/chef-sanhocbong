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
    allFailedMessage: v.optional(v.string()),
    allPassedMessage: v.optional(v.string()),
    passedSomeMessage: v.optional(v.string()),
    allFailedSubheading: v.optional(v.string()),
    allPassedSubheading: v.optional(v.string()),
    passedSomeSubheading: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    fallbackMessage: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Get the current config if it exists
    const currentConfig = await ctx.db
      .query("resultPageConfig")
      .withIndex("by_createdAt")
      .order("desc")
      .first();
    
    const now = new Date().toISOString();
    
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
    allFailedMessage: v.optional(v.string()),
    allPassedMessage: v.optional(v.string()),
    passedSomeMessage: v.optional(v.string()),
    allFailedSubheading: v.optional(v.string()),
    allPassedSubheading: v.optional(v.string()),
    passedSomeSubheading: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    fallbackMessage: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("resultPageConfig", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all result page configurations (for admin view)
export const listResultPageConfigs = query({
  args: {},
  handler: async (ctx: any) => {
    return await ctx.db
      .query("resultPageConfig")
      .withIndex("by_createdAt")
      .order("desc")
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