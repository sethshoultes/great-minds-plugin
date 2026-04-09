/**
 * Hindsight — Git Intelligence Report Generator
 * Single function, <100 lines, no classes. Ships opinions, not options.
 * @see rounds/git-intelligence/decisions.md for design rationale
 */
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve } from "path";

export interface HindsightReport {
  generatedAt: string;
  recentChanges: string[];
  highChurnFiles: { file: string; changes: number }[];
  bugProneFiles: string[];
  uncommittedState: { status: string; diffStats: string };
  summary: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

function git(cmd: string, cwd: string): string {
  try {
    return execSync(`git ${cmd}`, { cwd, encoding: "utf-8", maxBuffer: 10_000_000 }).trim();
  } catch { return ""; }
}

function assessRisk(churnCount: number, bugCount: number): "LOW" | "MEDIUM" | "HIGH" {
  if (bugCount > 10 || churnCount > 10) return "HIGH";
  if (bugCount > 5 || churnCount > 5) return "MEDIUM";
  return "LOW";
}

export function generateHindsightReport(repoPath: string, outputPath?: string): HindsightReport {
  const cwd = resolve(repoPath);

  const recentRaw = git("log --oneline -20 --max-count=1000", cwd);
  const recentChanges = recentRaw ? recentRaw.split("\n") : [];

  const churnRaw = git("log --name-only --format= -100 --max-count=1000", cwd);
  const churnMap = new Map<string, number>();
  for (const file of (churnRaw || "").split("\n").filter(Boolean)) {
    churnMap.set(file, (churnMap.get(file) || 0) + 1);
  }
  const highChurnFiles = [...churnMap.entries()]
    .filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([file, changes]) => ({ file, changes }));

  const bugRaw = git('log --grep="fix\\|bug\\|broken\\|revert" -i --name-only --format= -100 --max-count=1000', cwd);
  const bugProneFiles = [...new Set((bugRaw || "").split("\n").filter(Boolean))].slice(0, 20);

  const status = git("status --short", cwd);
  const diffStats = git("diff --stat", cwd);
  const uncommittedCount = status ? status.split("\n").length : 0;

  const riskLevel = assessRisk(highChurnFiles.length, bugProneFiles.length);
  const summary = `Risk: ${riskLevel}. ${highChurnFiles.length} high-churn files, ${bugProneFiles.length} bug-associated files, ${uncommittedCount} uncommitted changes. Tread carefully on flagged files.`;

  const report: HindsightReport = {
    generatedAt: new Date().toISOString(),
    recentChanges, highChurnFiles, bugProneFiles,
    uncommittedState: { status: status || "clean", diffStats: diffStats || "none" },
    summary, riskLevel,
  };

  if (outputPath) writeFileSync(resolve(outputPath), formatMarkdown(report), "utf-8");
  return report;
}

function formatMarkdown(r: HindsightReport): string {
  return `# Hindsight Report
**Generated:** ${r.generatedAt}

## Summary
${r.summary}

## Recent Changes
${r.recentChanges.slice(0, 10).map(c => `- ${c}`).join("\n") || "No recent commits."}

## High-Churn Files
${r.highChurnFiles.map(f => `- \`${f.file}\` (${f.changes} changes)`).join("\n") || "None flagged."}

## Bug-Associated Files
${r.bugProneFiles.map(f => `- \`${f}\``).join("\n") || "None flagged."}

## Uncommitted State
\`\`\`
${r.uncommittedState.status}
\`\`\`

---
*Let this guide your hands. The files marked here have stories—some of them cautionary tales.*
`;
}
