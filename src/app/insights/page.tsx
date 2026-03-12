"use client";

import Tabs from "@/components/ui/Tabs";
import {
  SankeyFlow,
  SessionTimeline,
  ChordDiagram,
  PackedCircleExplorer,
  MemoryFlowMap,
  EcosystemMap,
  RequestLifecycle,
} from "@/components/charts";
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

/* -- Shared layout helpers -- */

function InfoCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-5 ${className}`}>
      {children}
    </div>
  );
}

function AccentBar({ color }: { color: string }) {
  return <div className="w-1 rounded-full self-stretch mr-4 flex-shrink-0" style={{ backgroundColor: color }} />;
}

/* -- Existing tabs (unchanged) -- */

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

/* -- New tabs -- */

function EcosystemTab() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Ecosystem Architecture"
        subtitle="Two-layer design: Runtime handles live support, Knowledge keeps agents aligned"
      />

      {/* Philosophy callout */}
      <InfoCard className="border-l-2 border-l-[var(--color-accent-blue)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">The Two-Layer Philosophy</h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          The <strong className="text-[var(--color-text-primary)]">Runtime Layer</strong> handles live support
          and mislink resolution triggered by Slack and Linear.
          The <strong className="text-[var(--color-text-primary)]">Knowledge &amp; Tooling Layer</strong> keeps
          humans and coding agents aligned without risking production breakages.
        </p>
      </InfoCard>

      {/* Architecture diagram */}
      <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6">
        <EcosystemMap height={620} />
      </div>

      {/* Agent inventory cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mislink_Agent */}
        <InfoCard className="border-t-2 border-t-[var(--color-accent-amber)]">
          <h3 className="text-sm font-semibold text-[var(--color-accent-amber)] mb-3">Mislink_Agent</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                Runtime Pipeline
              </h4>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>Orchestration</span>
                  <span className="text-[var(--color-accent-amber)] font-medium">LangGraph</span>
                </li>
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>Provider</span>
                  <span className="text-[var(--color-text-primary)]">ChatAnthropic / OpenAI</span>
                </li>
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>LLM Tagging</span>
                  <span className="text-[var(--color-text-muted)] font-medium">Feature Gated</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                Key Capabilities
              </h4>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5">
                <li>State machine with human-in-the-loop pause</li>
                <li>CascadeClassifier (4-level deterministic)</li>
                <li>RAG search via ChromaDB</li>
                <li>OpenAI QC helper (fallback)</li>
              </ul>
            </div>
          </div>
        </InfoCard>

        {/* Dummy_Agent */}
        <InfoCard className="border-t-2 border-t-[var(--color-accent-green)]">
          <h3 className="text-sm font-semibold text-[var(--color-accent-green)] mb-3">Dummy_Agent</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                Runtime Pipeline
              </h4>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>Orchestration</span>
                  <span className="text-[var(--color-accent-green)] font-medium">Custom CLI</span>
                </li>
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>Provider</span>
                  <span className="text-[var(--color-text-primary)]">Vercel AI SDK (Node)</span>
                </li>
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>Tagger Priority</span>
                  <span className="text-[var(--color-text-muted)] font-medium">Known-Issue 1st</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                Key Capabilities
              </h4>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5">
                <li>Tagger &rarr; Analyzer &rarr; Solver pipeline</li>
                <li>Known-issues registry check first</li>
                <li>Specialist routing to Mislink_Agent</li>
                <li>Deterministic pipeline wrapper</li>
              </ul>
            </div>
          </div>
        </InfoCard>

        {/* Vault */}
        <InfoCard className="border-t-2 border-t-[var(--color-accent-teal)]">
          <h3 className="text-sm font-semibold text-[var(--color-accent-teal)] mb-3">Vault (Knowledge)</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                Automation Layer
              </h4>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>Interface</span>
                  <span className="text-[var(--color-accent-teal)] font-medium">Claude Code</span>
                </li>
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>Primary Model</span>
                  <span className="text-[var(--color-text-primary)]">Sonnet / Opus</span>
                </li>
                <li className="flex justify-between bg-[var(--color-bg-secondary)] px-2 py-1.5 rounded">
                  <span>Skills</span>
                  <span className="text-[var(--color-text-muted)] font-medium">16 Skills + Hooks</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                Core Pipeline Skills
              </h4>
              <div className="bg-[var(--color-bg-secondary)] rounded p-2 text-xs font-mono text-[var(--color-text-secondary)] space-y-0.5">
                <div><span className="text-[var(--color-accent-teal)]">/seed</span> &rarr; Capture source</div>
                <div><span className="text-[var(--color-accent-teal)]">/extract</span> &rarr; Extract specs</div>
                <div><span className="text-[var(--color-accent-teal)]">/cross-reference</span> &rarr; Find connections</div>
                <div><span className="text-[var(--color-accent-teal)]">/sync</span> &rarr; Update old specs</div>
                <div><span className="text-[var(--color-accent-teal)]">/audit</span> &rarr; Verify quality</div>
              </div>
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}

function RequestFlowTab() {
  return (
    <div>
      <SectionHeader
        title="Request Lifecycle"
        subtitle="How events flow from Slack through the gateway to agent backends"
      />
      <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-6">
        <RequestLifecycle height={540} />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard>
          <div className="flex items-start">
            <AccentBar color="var(--color-accent-blue)" />
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Service_B Gateway Properties
              </h4>
              <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5">
                <li>Validates Slack request signatures (HMAC)</li>
                <li>Feature gates via NEW_CHAT_LAYER_ENABLED</li>
                <li>Uses Vercel <code className="text-[var(--color-accent-blue)]">waitUntil</code> for async</li>
                <li>Zero pipeline logic &mdash; pure translation layer</li>
              </ul>
            </div>
          </div>
        </InfoCard>
        <InfoCard>
          <div className="flex items-start">
            <AccentBar color="var(--color-accent-amber)" />
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">
                Loose Coupling Design
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Dummy_Agent never calls Mislink_Agent directly. When mislink-related keywords are detected,
                Dummy_Agent applies the <code className="text-[var(--color-accent-amber)]">mislink-agent</code> label
                in Linear and exits. Mislink_Agent independently filters for labeled tickets, preventing
                cascading runtime failures.
              </p>
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}

function SystemHealthTab() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="System Health"
        subtitle="Architecture invariants, safety properties, and documentation pipeline"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Golden Invariant */}
        <InfoCard className="border-l-2 border-l-[var(--color-accent-green)]">
          <h3 className="text-sm font-semibold text-[var(--color-accent-green)] mb-3">The Golden Invariant</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
            The strongest architectural invariant across the ecosystem:
            <strong className="text-[var(--color-text-primary)]"> Human Approval + DRY_RUN defaults</strong>.
            This is why a multi-agent system can run safely.
          </p>
          <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-accent-green)] mt-0.5">&#x2713;</span>
              Mislink_Agent pauses LangGraph execution entirely until Slack callback
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-accent-green)] mt-0.5">&#x2713;</span>
              Dummy_Agent requires human review and checks DRY_RUN explicitly
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-accent-green)] mt-0.5">&#x2713;</span>
              Copilot instructions prohibit autonomous PRs or bypassing reviews
            </li>
          </ul>
        </InfoCard>

        {/* LLM Resilience */}
        <InfoCard className="border-l-2 border-l-[var(--color-accent-purple)]">
          <h3 className="text-sm font-semibold text-[var(--color-accent-purple)] mb-3">LLM Resilience</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
            The system ensures business-critical classification can proceed deterministically.
            LLMs refine results but the system <strong className="text-[var(--color-text-primary)]">gracefully
            degrades</strong> if the LLM provider fails.
          </p>
          <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-accent-purple)] mt-0.5">&#x2713;</span>
              Tagger: CascadeClassifier result returned without LLM refinement
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-accent-purple)] mt-0.5">&#x2713;</span>
              Analyzer: Template summary returned as fallback
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-accent-purple)] mt-0.5">&#x2713;</span>
              Solver: Rule-based proposal is final when LLM unavailable
            </li>
          </ul>
        </InfoCard>

        {/* Documentation Supply Chain */}
        <InfoCard>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Documentation Supply Chain</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
            All service repos (Dummy_Agent, Mislink_Agent, Service_B) have CI actions that open PRs
            in the shared Documentation repo. Documentation is mounted back via
            <code className="text-[var(--color-accent-teal)]"> kb/</code> submodule.
          </p>
          <div className="bg-[var(--color-bg-secondary)] rounded p-3 text-xs text-[var(--color-text-secondary)]">
            <strong className="text-[var(--color-text-primary)]">Stable branch names</strong> &mdash;
            Doc PRs use fixed branch names (e.g. <code className="text-[var(--color-accent-blue)]">docs/update-dummy-agent</code>)
            to reuse a single long-lived review branch per service, preventing PR spam.
          </div>
        </InfoCard>

        {/* Architecture Properties */}
        <InfoCard>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Architecture Properties</h3>
          <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-blue)] mt-1.5 flex-shrink-0" />
              <span>
                <strong className="text-[var(--color-text-primary)]">Service_B is a thin gateway</strong> &mdash;
                zero pipeline logic, all classification and execution stays in Python repos
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-amber)] mt-1.5 flex-shrink-0" />
              <span>
                <strong className="text-[var(--color-text-primary)]">Linear writes are minimal</strong> &mdash;
                Mislink_Agent reads ticket data via GraphQL (read-only); Dummy_Agent writes routing labels only
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-green)] mt-1.5 flex-shrink-0" />
              <span>
                <strong className="text-[var(--color-text-primary)]">Uniform backend API</strong> &mdash;
                both agents expose POST /api/process, POST /api/decision, GET /api/runs/&#123;run_id&#125;
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-rose)] mt-1.5 flex-shrink-0" />
              <span>
                <strong className="text-[var(--color-text-primary)]">Feature gates control rollout</strong> &mdash;
                NEW_CHAT_LAYER_ENABLED, LLM_FALLBACK_ENABLED, LEGACY_SLACK_ENABLED
              </span>
            </li>
          </ul>
        </InfoCard>
      </div>
    </div>
  );
}

/* -- Page -- */

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-primary)] px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Insights</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Pikkit AI Pipeline &mdash; Visualization Dashboard
        </p>
      </header>
      <Tabs
        tabs={[
          { id: "pipeline", label: "Pipeline Flow", content: <PipelineFlowTab /> },
          { id: "session", label: "Session Replay", content: <SessionReplayTab /> },
          { id: "codebase", label: "Codebase / System Map", content: <CodebaseMapTab /> },
          { id: "memory", label: "Memory / Context", content: <MemoryContextTab /> },
          { id: "ecosystem", label: "Ecosystem", content: <EcosystemTab /> },
          { id: "lifecycle", label: "Request Flow", content: <RequestFlowTab /> },
          { id: "health", label: "System Health", content: <SystemHealthTab /> },
        ]}
      />
    </main>
  );
}
