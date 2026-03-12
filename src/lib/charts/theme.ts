/** Shared color palette and chart tokens for all visualizations. */

export const palette = {
  blue: "#7a9ec7",
  green: "#8ab4a0",
  amber: "#c4956a",
  rose: "#c47a7a",
  purple: "#9a7ec7",
  teal: "#7ac4b4",
  slate: "#686878",
  muted: "#2a2a3a",
} as const;

/** Ordered array for categorical color scales. */
export const categoricalColors = [
  palette.blue,
  palette.green,
  palette.amber,
  palette.rose,
  palette.purple,
  palette.teal,
  "#c7c47a",
  "#7ac4c4",
  "#c47ab4",
  "#a07ac4",
  "#c4a07a",
] as const;

/** Severity-keyed colors matching Mislink_Agent severity levels. */
export const severityColors: Record<string, string> = {
  critical: palette.rose,
  high: palette.amber,
  low: palette.blue,
  none: palette.slate,
};

/** Pipeline stage colors for Sankey / timeline views. */
export const stageColors: Record<string, string> = {
  tag: palette.blue,
  analyze: palette.purple,
  solve: palette.green,
  notify_slack: palette.amber,
  execute: palette.teal,
  handle_feedback: palette.rose,
  classify: palette.blue,
  propose: palette.green,
  review: palette.amber,
};

/** Decision outcome colors. */
export const decisionColors: Record<string, string> = {
  approved: palette.green,
  rejected: palette.rose,
  modified: palette.amber,
  pending: palette.slate,
};

export const chartDefaults = {
  bgPrimary: "#0a0a0f",
  bgCard: "#1a1a24",
  border: "#2a2a3a",
  textPrimary: "#e8e8ef",
  textSecondary: "#9898a8",
  textMuted: "#686878",
  transitionMs: 600,
  tooltipOffset: 12,
} as const;
