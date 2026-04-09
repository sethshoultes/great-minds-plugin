/**
 * Hindsight Integration — Pipeline hooks and prompt modifiers
 * Provides the integration points for the Hindsight report generator.
 */
import { generateHindsightReport } from "./hindsight.js";
import type { HindsightReport } from "./hindsight.js";
import { resolve } from "path";

let firstRunAcknowledged = false;

/**
 * Generate Hindsight report for a project.
 * Call this at the start of runBuild() or runPlan().
 */
export async function generateProjectHindsight(
  repoPath: string,
  outputDir: string,
  logger?: { info: (msg: string) => void },
): Promise<HindsightReport> {
  const outputPath = resolve(outputDir, "hindsight-report.md");
  const report = generateHindsightReport(repoPath, outputPath);

  // Board condition: Acknowledgment line on first run (Oprah)
  if (!firstRunAcknowledged) {
    const highRiskCount = report.highChurnFiles.length + report.bugProneFiles.length;
    const msg = `Hindsight: ${highRiskCount} high-risk files identified. Proceed with awareness.`;
    if (logger) logger.info(msg);
    else console.log(msg);
    firstRunAcknowledged = true;
  }

  return report;
}

/**
 * Board condition: Basic outcome tracking (Jensen/Buffett)
 * Call this after a build fails to log if flagged files were modified.
 */
export function trackHindsightOutcome(
  report: HindsightReport,
  modifiedFiles: string[],
  buildFailed: boolean,
  logger?: { warn: (msg: string) => void },
): void {
  if (!buildFailed) return;

  const flaggedFiles = new Set([
    ...report.highChurnFiles.map(f => f.file),
    ...report.bugProneFiles,
  ]);

  const flaggedModified = modifiedFiles.filter(f => flaggedFiles.has(f));
  if (flaggedModified.length > 0) {
    const msg = `Hindsight: Build failed after modifying flagged files: ${flaggedModified.join(", ")}`;
    if (logger) logger.warn(msg);
    else console.warn(msg);
  }
}

/** Prompt modifier for planner agents. */
export function hindsightPlannerContext(reportPath: string): string {
  return `
## Hindsight Report (Git Intelligence)
Read the Hindsight report at ${reportPath}.

This report identifies:
- **High-churn files** — frequently modified, higher risk of conflicts
- **Bug-associated files** — appeared in fix/bug/revert commits
- **Uncommitted changes** — current working state

When planning tasks:
1. Flag tasks that touch high-churn or bug-prone files as higher risk
2. Consider sequencing tasks to minimize conflicts in hot files
3. Note any uncommitted changes that might affect the plan
`;
}

/** Prompt modifier for executor agents. */
export function hindsightExecutorContext(reportPath: string): string {
  return `
## Hindsight Report (Git Intelligence)
Read the Hindsight report at ${reportPath}.

Before modifying any file flagged in the report:
1. Read the file completely first
2. Check recent git log for that specific file
3. Make minimal, focused changes
4. Add extra test coverage if modifying bug-prone files
5. Commit flagged file changes separately for easier rollback

Flagged files warrant extra care. The report provides context, not commands.
`;
}

/** Returns true if the project should run Hindsight. */
export function shouldRunHindsight(_project: string): boolean {
  return true; // v1: Always run. v2: Check for .hindsight-skip or config option.
}

export type { HindsightReport };
