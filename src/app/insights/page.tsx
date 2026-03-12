"use client";

import Tabs from "@/components/ui/Tabs";
import { SankeyFlow, SessionTimeline, ChordDiagram, PackedCircleExplorer, MemoryFlowMap } from "@/components/charts";
import {
  pipelineSankeyData,
  sessionTimelineData,
  systemChordData,
  codebaseCircleData,
} from "@/lib/charts/sample-data";

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
    </div>
  );
}

function PipelineFlowTab() {
  return (
    <div>
      <SectionHeader
        title="Pipeline Flow"
        subtitle="Ticket flow through classification cascade to human decisions"
      />
      <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6">
        <SankeyFlow data={pipelineSankeyData} height={560} />
      </div>
    </div>
  );
}

function SessionReplayTab() {
  return (
    <div>
      <SectionHeader
        title="Session Replay"
        subtitle="Timeline view of pipeline stage execution across recent runs"
      />
      <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6">
        <SessionTimeline data={sessionTimelineData} rowHeight={44} />
      </div>
      <div className="mt-4 flex gap-4 flex-wrap">
        {[
          { label: "Tag", color: "var(--color-accent-blue)" },
          { label: "Analyze", color: "var(--color-accent-purple)" },
          { label: "Solve", color: "var(--color-accent-green)" },
          { label: "Notify", color: "var(--color-accent-amber)" },
          { label: "Execute", color: "var(--color-accent-teal)" },
          { label: "Feedback", color: "var(--color-accent-rose)" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CodebaseMapTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <SectionHeader
          title="System Architecture"
          subtitle="Module interaction patterns across the Pikkit stack"
        />
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6">
          <ChordDiagram data={systemChordData} />
        </div>
      </div>
      <div>
        <SectionHeader
          title="Codebase Explorer"
          subtitle="Click to zoom into modules. Size = lines of code."
        />
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6">
          <PackedCircleExplorer data={codebaseCircleData} />
        </div>
      </div>
    </div>
  );
}

function MemoryContextTab() {
  return (
    <div>
      <SectionHeader
        title="Memory Flow Map"
        subtitle="How context flows through gateway, classifiers, RAG bridge, and memory stores"
      />
      <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6">
        <MemoryFlowMap height={540} />
      </div>
      <div className="mt-4 flex gap-6 flex-wrap">
        {[
          { label: "Input", color: "var(--color-accent-blue)" },
          { label: "Process", color: "var(--color-accent-purple)" },
          { label: "Store", color: "var(--color-accent-green)" },
          { label: "Decide", color: "var(--color-accent-amber)" },
          { label: "Feedback loop", color: "var(--color-accent-teal)", dashed: true },
        ].map(({ label, color, dashed }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: dashed ? "transparent" : color,
                border: dashed ? `2px dashed ${color}` : "none",
              }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-primary)] px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Insights</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Pikkit AI Pipeline — Visualization Dashboard
        </p>
      </header>
      <Tabs
        tabs={[
          { id: "pipeline", label: "Pipeline Flow", content: <PipelineFlowTab /> },
          { id: "session", label: "Session Replay", content: <SessionReplayTab /> },
          { id: "codebase", label: "Codebase / System Map", content: <CodebaseMapTab /> },
          { id: "memory", label: "Memory / Context", content: <MemoryContextTab /> },
        ]}
      />
    </main>
  );
}
