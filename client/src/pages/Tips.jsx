import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const STATIC_TIPS = {
  Frontend: [
    "Revise browser rendering pipeline and virtual DOM internals.",
    "Practice building a small React app with hooks and context from scratch.",
    "Be ready to explain CSS specificity, flexbox vs grid, and responsive design.",
    "Expect live coding: FizzBuzz, array manipulation, and DOM manipulation.",
    "Study accessibility (ARIA roles, keyboard navigation) — often asked at senior level.",
  ],
  Backend: [
    "Understand REST vs GraphQL trade-offs and when to use each.",
    "Practice designing a RESTful API with proper status codes and error handling.",
    "Revise database indexing, query optimisation, and N+1 problem.",
    "Be ready to explain authentication flows: JWT, OAuth2, session cookies.",
    "Study concurrency models: event loop (Node), threads (Java/Go), async/await.",
  ],
  Database: [
    "Practice writing complex SQL: JOINs, CTEs, window functions.",
    "Understand ACID properties and when to use NoSQL vs SQL.",
    "Be ready to design a schema for a given use case (e.g. e-commerce, social feed).",
    "Study indexing strategies: B-tree, composite indexes, covering indexes.",
    "Know CAP theorem and how MongoDB/Redis handle consistency.",
  ],
  DevOps: [
    "Explain the difference between Docker and a VM — interviewers love this.",
    "Walk through a CI/CD pipeline you have built or would build.",
    "Study Kubernetes core objects: Pod, Deployment, Service, Ingress.",
    "Be ready to debug a failing container or a high-CPU pod.",
    "Know IAM roles, VPC, and security groups for AWS/GCP/Azure.",
  ],
  AI: [
    "Revise bias-variance trade-off, overfitting, and regularisation.",
    "Be ready to explain gradient descent and backpropagation intuitively.",
    "Practice feature engineering and handling imbalanced datasets.",
    "Study transformer architecture — attention mechanism is frequently asked.",
    "Know how to evaluate a model: precision, recall, F1, AUC-ROC.",
  ],
  General: [
    "Prepare a concise 2-minute introduction covering your stack and projects.",
    "Practice STAR method for behavioural questions.",
    "Review your resume projects — expect deep dives on anything listed.",
    "Study time complexity (Big-O) for common algorithms and data structures.",
    "Prepare 3 thoughtful questions to ask the interviewer.",
  ],
};

const DOMAINS = Object.keys(STATIC_TIPS);

const DOMAIN_ICONS = {
  Frontend: "", Backend: "", Database: "",
  DevOps: "", AI: "", General: "",
};

const GENERAL_TIPS = [
  { title: "Research the company", desc: "Spend 30 min on their product, tech blog, and recent news before the interview." },
  { title: "Write code by hand", desc: "Practice on paper or a whiteboard — many interviews still use this format." },
  { title: "Think out loud", desc: "Interviewers want to hear your reasoning, not just the final answer." },
  { title: "Mock interviews", desc: "Use Pramp, Interviewing.io, or ask a friend to simulate real pressure." },
  { title: "Sleep well the night before", desc: "Cognitive performance drops 20–40% with poor sleep. Prioritise rest." },
];

export default function Tips() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const fromAnalysis = state?.interviewTips;

  const [selected, setSelected] = useState(fromAnalysis?.domain ?? "General");
  const tips = STATIC_TIPS[selected] ?? STATIC_TIPS.General;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: "0.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Interview Prep</h1>
        {fromAnalysis && (
          <button className="btn-primary" onClick={() => navigate("/results", { state })}>
            ← Back to Results
          </button>
        )}
      </div>
      <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
        {fromAnalysis
          ? `Tips tailored to your ${fromAnalysis.domain} skill gap. Switch domain below to explore others.`
          : "Select a domain to get targeted interview preparation tips."}
      </p>

      {/* Domain selector */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {DOMAINS.map((d) => (
          <button key={d} onClick={() => setSelected(d)}
                  style={{
                    padding: "0.45rem 1rem", borderRadius: "999px", border: "1px solid var(--border)",
                    background: selected === d ? "var(--accent)" : "var(--surface)",
                    color: selected === d ? "#fff" : "var(--muted)",
                    fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.15s",
                  }}>
            {d}
          </button>
        ))}
      </div>

      {/* Domain tips */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontWeight: 700, marginBottom: "1.2rem", fontSize: "1rem" }}>
          {selected} Interview Tips
        </h2>
        <ol style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {tips.map((tip, i) => (
            <li key={i} style={{ fontSize: "0.92rem", lineHeight: 1.6 }}>{tip}</li>
          ))}
        </ol>
      </div>

      {/* General tips */}
      <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>
        Universal Tips
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1rem" }}>
        {GENERAL_TIPS.map((t, i) => (
          <div key={i} className="card">
            <div style={{ fontWeight: 700, marginBottom: "0.3rem", fontSize: "0.9rem" }}>{t.title}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.83rem", lineHeight: 1.5 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {!fromAnalysis && (
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <p style={{ color: "var(--muted)", marginBottom: "1rem", fontSize: "0.9rem" }}>
            Want tips tailored to your actual skill gap?
          </p>
          <button className="btn-primary" onClick={() => navigate("/upload")}>
            Analyse My Resume →
          </button>
        </div>
      )}
    </div>
  );
}
