import type { Metadata } from "next";
import rawDossier from "@/data/semaglutide-dossier.json";

export const metadata: Metadata = {
  title: "Semaglutide Evidence Dossier",
  description:
    "A read-only evidence dossier covering semaglutide claims, perspectives, contradictions, gaps, and sources.",
};

type EvidenceStatus =
  | "corroborated"
  | "single_source"
  | "disputed"
  | "unsupported";
type Confidence = "high" | "medium" | "low";

interface Source {
  id: string;
  url: string;
  title: string;
  publisher: string;
  published_at: string | null;
  source_kind: string;
  evidence_role: string;
  authority_notes: string;
  freshness_notes: string;
}

interface Claim {
  id: string;
  statement: string;
  classification: string;
  source_ids: string[];
  evidence_status: EvidenceStatus;
  confidence: Confidence;
  selected_for_script: boolean;
}

interface Perspective {
  id: string;
  speaker_name: string;
  speaker_type: string;
  role: string;
  position: string;
  source_ids: string[];
  statement_kind: string;
  confidence: Confidence;
  bias_notes: string;
  selected_for_script: boolean;
}

interface Contradiction {
  id: string;
  claim_ids: string[];
  summary: string;
  requires_resolution: boolean;
  resolution: string | null;
}

interface Gap {
  id: string;
  category: string;
  description: string;
  severity: "high" | "medium";
}

interface AngleScores {
  novelty: number;
  importance: number;
  evidence_strength: number;
  human_stakes: number;
  tension: number;
  audience_relevance: number;
  visual_potential: number;
  timeliness: number;
}

interface AngleCandidate {
  id: string;
  title: string;
  hook: string;
  central_question: string;
  why_interesting: string;
  angle_kind: string;
  lens_ids: string[];
  source_ids: string[];
  claim_ids: string[];
  perspective_ids: string[];
  evidence_status: EvidenceStatus;
  confidence: Confidence;
  scores: AngleScores;
  editorial_score: number;
  counterargument: string;
  unknowns: string;
  risk_notes: string;
  overclaiming_risk: "high" | "medium" | "low";
  selected_for_story: boolean;
}

interface Dossier {
  schema_version: number;
  version: number;
  status: string;
  summary: string;
  created_at: string;
  sources: Source[];
  claims: Claim[];
  perspectives: Perspective[];
  contradictions: Contradiction[];
  gaps: Gap[];
  angle_candidates: AngleCandidate[];
  partial_project_audit: {
    represented_perspective_lenses: string[];
    missing_perspective_lenses: string[];
    warnings: string[];
  };
}

const dossier = rawDossier as Dossier;
const sourceById = new Map(
  dossier.sources.map((source): [string, Source] => [source.id, source]),
);

const statusOrder: EvidenceStatus[] = [
  "corroborated",
  "single_source",
  "disputed",
  "unsupported",
];

const statusLabels: Record<EvidenceStatus, string> = {
  corroborated: "Corroborated",
  single_source: "Single source",
  disputed: "Disputed",
  unsupported: "Unsupported",
};

const statusDescriptions: Record<EvidenceStatus, string> = {
  corroborated: "Supported by multiple independent or authoritative sources.",
  single_source: "Supported here by one source and needs further corroboration.",
  disputed: "Conflicting evidence or interpretations require explicit treatment.",
  unsupported: "Present in public discourse but not supported by this source set.",
};

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function sourceLabel(id: string): string {
  const normalized = id.replace(/^source-/, "").replace(/^s/i, "");
  return `S${normalized}`;
}

function formatDate(value: string | null): string {
  if (value === null) {
    return "Date not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function SourceRefs({ ids }: { ids: string[] }): React.ReactNode {
  if (ids.length === 0) {
    return <span className="no-sources">No source attached</span>;
  }

  return (
    <span className="source-refs" aria-label="Supporting sources">
      {ids.map((id) => {
        const source = sourceById.get(id);
        return (
          <a href={`#${id}`} key={id} title={source?.title ?? id}>
            {sourceLabel(id)}
          </a>
        );
      })}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  count,
  children,
}: {
  eyebrow: string;
  title: string;
  count: number;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <header className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>
          {title}
          <span className="section-count">{count}</span>
        </h2>
      </div>
      <p>{children}</p>
    </header>
  );
}

export default function Home(): React.ReactNode {
  const generatedDate = formatDate(dossier.created_at);
  const statusCounts = Object.fromEntries(
    statusOrder.map((status) => [
      status,
      dossier.claims.filter((claim) => claim.evidence_status === status).length,
    ]),
  ) as Record<EvidenceStatus, number>;

  return (
    <main>
      <nav className="topbar" aria-label="Dossier navigation">
        <a className="brand" href="#top" aria-label="SpecCraft dossier home">
          <span className="brand-mark">S</span>
          <span>
            <strong>SpecCraft</strong>
            <small>Research dossier</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#angles">Angles</a>
          <a href="#claims">Claims</a>
          <a href="#perspectives">Perspectives</a>
          <a href="#contradictions">Contradictions</a>
          <a href="#gaps">Gaps</a>
          <a href="#sources">Sources</a>
        </div>
        <span className="read-only">Read-only snapshot</span>
      </nav>

      <div className="page-shell" id="top">
        <header className="hero">
          <div className="hero-main">
            <div className="status-row">
              <span className="review-status">
                <span aria-hidden="true" />
                Awaiting human review
              </span>
              <span>Dossier v{dossier.version}</span>
              <span>Generated {generatedDate}</span>
            </div>

            <p className="kicker">Evidence map · clinical and public discourse</p>
            <h1>Semaglutide</h1>
            <p className="hero-subtitle">
              What is established, what different people and institutions say,
              where the evidence conflicts, and what still needs research.
            </p>

            <div className="metrics" aria-label="Dossier totals">
              <div>
                <strong>{dossier.sources.length}</strong>
                <span>Sources</span>
              </div>
              <div>
                <strong>{dossier.claims.length}</strong>
                <span>Claims</span>
              </div>
              <div>
                <strong>{dossier.perspectives.length}</strong>
                <span>Perspectives</span>
              </div>
              <div>
                <strong>{dossier.angle_candidates.length}</strong>
                <span>Story angles</span>
              </div>
              <div>
                <strong>{dossier.contradictions.length}</strong>
                <span>Contradictions</span>
              </div>
              <div>
                <strong>{dossier.gaps.length}</strong>
                <span>Evidence gaps</span>
              </div>
            </div>
          </div>

          <aside className="hero-aside" aria-label="Review state">
            <p className="eyebrow">Review gate</p>
            <h2>Research is complete. Judgment is not.</h2>
            <p>
              Nothing in this dossier has been selected for a script or approved
              for publication. Unsupported and disputed claims are intentionally
              visible.
            </p>
            <div className="status-key">
              {statusOrder.map((status) => (
                <div key={status}>
                  <span className={`dot ${status}`} />
                  <span>{statusLabels[status]}</span>
                  <strong>{statusCounts[status]}</strong>
                </div>
              ))}
            </div>
          </aside>
        </header>

        <section className="summary-panel" id="summary">
          <div className="summary-number">01</div>
          <div>
            <p className="eyebrow">Executive summary</p>
            <h2>The current evidence, in one view</h2>
            <p className="summary-copy">{dossier.summary}</p>
          </div>
        </section>

        <section className="section" id="angles">
          <SectionHeading
            eyebrow="02 · Editorial discovery"
            title="Ranked story angles"
            count={dossier.angle_candidates.length}
          >
            Potential narratives are ranked by evidence, importance, human
            stakes, tension, relevance, visual potential, and timeliness. These
            are candidates for human selection, not approved story directions.
          </SectionHeading>

          <div className="angle-list">
            {dossier.angle_candidates.map((angle, index) => (
              <article className="angle-card" key={angle.id}>
                <header className="angle-header">
                  <div className="angle-rank">
                    <span>Rank</span>
                    <strong>{String(index + 1).padStart(2, "0")}</strong>
                  </div>
                  <div className="angle-title">
                    <div className="angle-meta">
                      <span>{humanize(angle.angle_kind)}</span>
                      <span className={`confidence ${angle.confidence}`}>
                        {angle.confidence} confidence
                      </span>
                      <span className={`risk ${angle.overclaiming_risk}`}>
                        {angle.overclaiming_risk} overclaiming risk
                      </span>
                    </div>
                    <h3>{angle.title}</h3>
                  </div>
                  <div className="angle-score">
                    <span>Editorial score</span>
                    <strong>{angle.editorial_score}</strong>
                  </div>
                </header>

                <p className="angle-hook">{angle.hook}</p>

                <div className="angle-question">
                  <span>Central question</span>
                  <p>{angle.central_question}</p>
                </div>

                <div className="angle-details">
                  <div>
                    <span>Why it matters</span>
                    <p>{angle.why_interesting}</p>
                  </div>
                  <div>
                    <span>Counterargument</span>
                    <p>{angle.counterargument}</p>
                  </div>
                  <div>
                    <span>Still unknown</span>
                    <p>{angle.unknowns}</p>
                  </div>
                  <div>
                    <span>Editorial risk</span>
                    <p>{angle.risk_notes}</p>
                  </div>
                </div>

                <footer className="angle-footer">
                  <div className="angle-lenses">
                    {angle.lens_ids.map((lens) => (
                      <span key={lens}>{humanize(lens)}</span>
                    ))}
                  </div>
                  <SourceRefs ids={angle.source_ids} />
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="claims">
          <SectionHeading
            eyebrow="03 · Evidence map"
            title="Evidence claims"
            count={dossier.claims.length}
          >
            Each claim retains its evidence status, confidence, classification,
            and direct links to the source register.
          </SectionHeading>

          <div className="evidence-groups">
            {statusOrder.map((status) => {
              const claims = dossier.claims.filter(
                (claim) => claim.evidence_status === status,
              );

              return (
                <section className="evidence-group" key={status}>
                  <header>
                    <div>
                      <span className={`dot ${status}`} />
                      <h3>{statusLabels[status]}</h3>
                      <span>{claims.length}</span>
                    </div>
                    <p>{statusDescriptions[status]}</p>
                  </header>
                  <div className="claim-list">
                    {claims.map((claim, index) => (
                      <article
                        className={`claim-card ${status}`}
                        id={`claim-${claim.id}`}
                        key={claim.id}
                      >
                        <div className="claim-index">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="claim-body">
                          <p>{claim.statement}</p>
                          <div className="claim-meta">
                            <span>{humanize(claim.classification)}</span>
                            <span className={`confidence ${claim.confidence}`}>
                              {claim.confidence} confidence
                            </span>
                            <SourceRefs ids={claim.source_ids} />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="section" id="perspectives">
          <SectionHeading
            eyebrow="04 · Who says what"
            title="Attributed perspectives"
            count={dossier.perspectives.length}
          >
            Institutional positions, expert interpretations, research findings,
            industry messaging, and affected-community testimony remain distinct.
          </SectionHeading>

          <div className="perspective-grid">
            {dossier.perspectives.map((perspective) => (
              <article className="perspective-card" key={perspective.id}>
                <div className="speaker-row">
                  <span className="speaker-type">
                    {humanize(perspective.speaker_type)}
                  </span>
                  <span className={`confidence ${perspective.confidence}`}>
                    {perspective.confidence}
                  </span>
                </div>
                <h3>{perspective.speaker_name}</h3>
                <p className="role">{perspective.role}</p>
                <blockquote>{perspective.position}</blockquote>
                <div className="perspective-footer">
                  <span>{humanize(perspective.statement_kind)}</span>
                  <SourceRefs ids={perspective.source_ids} />
                </div>
                <details>
                  <summary>Context and bias notes</summary>
                  <p>{perspective.bias_notes}</p>
                </details>
              </article>
            ))}
          </div>

          <aside className="coverage-note">
            <div>
              <span>Represented lenses</span>
              <p>
                {dossier.partial_project_audit.represented_perspective_lenses
                  .map(humanize)
                  .join(" · ")}
              </p>
            </div>
            <div>
              <span>Still missing</span>
              <p>
                {dossier.partial_project_audit.missing_perspective_lenses
                  .map(humanize)
                  .join(" · ")}
              </p>
            </div>
          </aside>
        </section>

        <section className="section" id="contradictions">
          <SectionHeading
            eyebrow="05 · Editorial decisions"
            title="Contradictions to resolve"
            count={dossier.contradictions.length}
          >
            These tensions should be resolved or framed explicitly before any
            narrative is approved.
          </SectionHeading>

          <div className="contradiction-list">
            {dossier.contradictions.map((contradiction, index) => (
              <article className="contradiction-card" key={contradiction.id}>
                <div className="contradiction-number">
                  C{String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="contradiction-state">
                    {contradiction.requires_resolution
                      ? "Resolution required"
                      : "Context only"}
                  </div>
                  <p>{contradiction.summary}</p>
                  <div className="linked-claims">
                    {contradiction.claim_ids.map((claimId) => (
                      <a href={`#claim-${claimId}`} key={claimId}>
                        {humanize(claimId)} ↗
                      </a>
                    ))}
                  </div>
                  <p className="resolution">
                    <strong>Resolution:</strong>{" "}
                    {contradiction.resolution ?? "Not yet recorded."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="gaps">
          <SectionHeading
            eyebrow="06 · Unknowns"
            title="Evidence gaps"
            count={dossier.gaps.length}
          >
            Missing evidence is part of the dossier, not a footnote. High-severity
            gaps should constrain the final content plan.
          </SectionHeading>

          <div className="gap-grid">
            {dossier.gaps.map((gap, index) => (
              <article className={`gap-card ${gap.severity}`} key={gap.id}>
                <div className="gap-topline">
                  <span>G{String(index + 1).padStart(2, "0")}</span>
                  <span>{gap.severity} priority</span>
                </div>
                <h3>{humanize(gap.category)}</h3>
                <p>{gap.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section sources-section" id="sources">
          <SectionHeading
            eyebrow="07 · Provenance"
            title="Source register"
            count={dossier.sources.length}
          >
            Direct links, source type, evidence role, authority notes, and
            freshness warnings are preserved from the generated dossier.
          </SectionHeading>

          <div className="source-list">
            {dossier.sources.map((source) => (
              <article className="source-card" id={source.id} key={source.id}>
                <div className="source-id">{sourceLabel(source.id)}</div>
                <div className="source-main">
                  <a
                    className="source-title"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.title} <span aria-hidden="true">↗</span>
                  </a>
                  <p>
                    {source.publisher} · {formatDate(source.published_at)}
                  </p>
                  <div className="source-tags">
                    <span>{humanize(source.source_kind)}</span>
                    <span>{humanize(source.evidence_role)} evidence</span>
                  </div>
                </div>
                <details>
                  <summary>Assessment</summary>
                  <p>
                    <strong>Authority:</strong> {source.authority_notes}
                  </p>
                  <p>
                    <strong>Freshness:</strong> {source.freshness_notes}
                  </p>
                </details>
              </article>
            ))}
          </div>
        </section>

        <footer>
          <div>
            <strong>Semaglutide evidence dossier</strong>
            <p>
              A point-in-time research snapshot generated by the Influencer
              SpecCraft pilot.
            </p>
          </div>
          <p className="disclaimer">
            For research and editorial planning only. This is not medical advice
            and is not a substitute for current product labeling, regulatory
            guidance, or consultation with a qualified clinician.
          </p>
        </footer>
      </div>
    </main>
  );
}
