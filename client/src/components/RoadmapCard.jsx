const LEVEL_BADGE = {
  Beginner:     "badge-green",
  Intermediate: "badge-yellow",
  Advanced:     "badge-purple",
};

export default function RoadmapCard({ item, rank }) {
  const { skill, level, priority, reason, steps, resources } = item;

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem",
                    marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <span style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 700,
                       minWidth: "1.4rem" }}>#{rank}</span>
        <span style={{ fontWeight: 700, fontSize: "1rem" }}>{skill}</span>
        <span className={`badge ${LEVEL_BADGE[level] ?? "badge-purple"}`}>{level}</span>
        <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--muted)" }}
              title="Priority score: importance x difficulty">
          {priority.toFixed(0)} pts
        </span>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.83rem", marginBottom: "0.9rem" }}>
        {reason}
      </p>

      <ol style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {steps.map((step, i) => (
          <li key={i} style={{ fontSize: "0.88rem", color: "var(--text)" }}>{step}</li>
        ))}
      </ol>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <a href={resources.youtube} target="_blank" rel="noreferrer"
           style={{ fontSize: "0.82rem", background: "#1e1b4b", padding: "0.3rem 0.8rem",
                    borderRadius: "999px", color: "#a78bfa" }}>
          YouTube
        </a>
        <a href={resources.course} target="_blank" rel="noreferrer"
           style={{ fontSize: "0.82rem", background: "#1e1b4b", padding: "0.3rem 0.8rem",
                    borderRadius: "999px", color: "#a78bfa" }}>
          Course
        </a>
      </div>
    </div>
  );
}
