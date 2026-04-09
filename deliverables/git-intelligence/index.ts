/**
 * Hindsight — Git Intelligence for AI Agents
 *
 * "Protection that doesn't announce itself. Machines with the
 * instinct to know which code is dangerous."
 *
 * @module hindsight
 */

export { generateHindsightReport } from "./hindsight.js";
export type { HindsightReport } from "./hindsight.js";
export {
  generateProjectHindsight,
  trackHindsightOutcome,
  hindsightPlannerContext,
  hindsightExecutorContext,
  shouldRunHindsight,
} from "./hindsight-integration.js";
