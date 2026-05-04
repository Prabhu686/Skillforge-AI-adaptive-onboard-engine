import { useLocation, useNavigate } from "react-router-dom";
import RoadmapCard from "../components/RoadmapCard.jsx";

function gradeColor(g) {
  return { A: "#22c55e", B: "#86efac", C: "#f59e0b", D: "#f97316", F: "#ef4444" }[g] ?? "#94a3b8";
}

function ScoreRing({ score, grade }) {
  const r = 48, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 0.5rem" }}>
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={gradeColor(grade)}
                strokeWidth="10" strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontWeight: 900, fontSize: "1.6rem", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.85rem", color: gradeColor(grade), fontWeight: 800 }}>
          Grade {grade}
        </span>
      </div>
    </div>
  );
}

function SkillPill({ skill, variant }) {
  const s = {
    have:    { background: "#14532d", color: "#22c55e" },
    missing: { background: "#450a0a", color: "#ef4444" },
    jd:      { background: "#1e1b4b", color: "#a78bfa" },
  };
  const mark = variant === "have" ? "+" : variant === "missing" ? "-" : "";
  return (
    <span style={{ ...s[variant], padding: "0.3rem 0.75rem", borderRadius: "999px",
                   fontSize: "0.82rem", fontWeight: 600, display: "inline-block", margin: "0.2rem" }}>
      {mark && <span style={{ marginRight: "0.25rem" }}>{mark}</span>}{skill}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1rem",
                   borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function exportPDF(roadmap, resumeScore, salary) {
  const win = window.open("", "_blank");
  const rows = roadmap.map((item, i) => `
    <div style="margin-bottom:18px;padding:14px;border:1px solid #ddd;border-radius:8px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <strong>#${i + 1} ${item.skill}</strong>
        <span style="background:#e9d5ff;color:#6b21a8;padding:2px 10px;border-radius:999px;font-size:12px;">${item.level}</span>
        <span style="margin-left:auto;font-size:12px;color:#666;">${item.priority.toFixed(0)} pts</span>
      </div>
      <p style="color:#555;font-size:13px;margin-bottom:8px;">${item.reason}</p>
      <ol style="padding-left:18px;font-size:13px;">${item.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
      <div style="margin-top:8px;font-size:12px;">
        <a href="${item.resources.youtube}">YouTube</a> &nbsp;|&nbsp;
        <a href="${item.resources.course}">Course</a>
      </div>
    </div>`).join("");

  win.document.write(`<!DOCTYPE html><html><head><title>SkillForge Roadmap</title>
    <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111;max-width:800px;margin:0 auto;}
    a{color:#6c63ff;}</style></head><body>
    <h1 style="margin-bottom:4px;">SkillForge – Learning Roadmap</h1>
    <p style="color:#555;margin-bottom:24px;">Generated ${new Date().toLocaleDateString()}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px;">
      <div style="border:1px solid #ddd;border-radius:8px;padding:14px;">
        <div style="font-size:13px;color:#555;margin-bottom:4px;">Resume Score</div>
        <div style="font-size:28px;font-weight:800;">${resumeScore.score}<span style="font-size:14px;color:#555;">/100</span></div>
        <div style="font-size:16px;font-weight:700;">Grade ${resumeScore.grade}</div>
        <div style="font-size:12px;color:#555;margin-top:4px;">${resumeScore.feedback}</div>
      </div>
      <div style="border:1px solid #ddd;border-radius:8px;padding:14px;">
        <div style="font-size:13px;color:#555;margin-bottom:4px;">Estimated Salary - ${salary.domain}</div>
        <div style="font-size:18px;font-weight:700;">Rs.${salary.candidateRange.min}-${salary.candidateRange.max} LPA</div>
        <div style="font-size:12px;color:#555;">Role range: Rs.${salary.roleRange.min}-${salary.roleRange.max} LPA</div>
      </div>
    </div>
    <h2 style="margin-bottom:16px;">Personalised Roadmap (${roadmap.length} skills)</h2>
    ${rows}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export default function Results() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  if (!state) { navigate("/"); return null; }

  const { resumeSkills, jdSkills, missingSkills, matchedSkills,
          roadmap, salary, resumeScore, interviewTips } = state;

  const totalJd  = jdSkills.length || 1;
  const matched  = matchedSkills?.length ?? (jdSkills.length - missingSkills.length);
  const coverage = Math.round((matched / totalJd) * 100);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Skill Analysis</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "0.3rem" }}>
            Resume vs. Job Description
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button style={{ background: "#0f766e", color: "#fff", border: "none",
                           borderRadius: "var(--radius)", padding: "0.6rem 1.1rem",
                           fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}
                  onClick={() => navigate("/tips", { state })}>
            Interview Tips
          </button>
          <button style={{ background: "#b45309", color: "#fff", border: "none",
                           borderRadius: "var(--radius)", padding: "0.6rem 1.1rem",
                           fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}
                  onClick={() => navigate("/quiz", { state })}>
            Voice Quiz
          </button>
          <button style={{ background: "#dc2626", color: "#fff", border: "none",
                           borderRadius: "var(--radius)", padding: "0.6rem 1.1rem",
                           fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}
                  onClick={() => navigate("/interview", { state })}>
            AI Interview
          </button>
          <button style={{ background: "#7c3aed", color: "#fff", border: "none",
                           borderRadius: "var(--radius)", padding: "0.6rem 1.1rem",
                           fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}
                  onClick={() => navigate("/builder", { state })}>
            Build Resume
          </button>
          <button style={{ background: "#059669", color: "#fff", border: "none",
                           borderRadius: "var(--radius)", padding: "0.6rem 1.1rem",
                           fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}
                  onClick={() => exportPDF(roadmap, resumeScore, salary)}>
            Export PDF
          </button>
          <button className="btn-primary" style={{ fontSize: "0.88rem" }}
                  onClick={() => navigate("/upload")}>
            Analyse Again
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1rem", marginBottom: "2.5rem" }}>

        {/* Score ring */}
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginBottom: "0.75rem" }}>
            Resume Score
          </p>
          <ScoreRing score={resumeScore.score} grade={resumeScore.grade} />
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.5rem", lineHeight: 1.4 }}>
            {resumeScore.feedback}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem",
                        marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--muted)" }}>
            <span>Coverage {resumeScore.breakdown.coverage}%</span>
            <span>Depth {resumeScore.breakdown.depthRaw}</span>
            <span>{resumeScore.breakdown.domainsHit} domains</span>
          </div>
        </div>

        {/* Salary */}
        <div className="card">
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginBottom: "0.5rem" }}>
            Estimated Salary
          </p>
          <p style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
            {salary.domain} Domain
          </p>
          <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--green)", marginBottom: "0.25rem" }}>
            Rs.{salary.candidateRange.min} – {salary.candidateRange.max}
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--muted)" }}> LPA</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
            Your current market value (INR/year)
          </p>
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.75rem",
                        paddingTop: "0.6rem", fontSize: "0.75rem", color: "var(--muted)" }}>
            Full role band: Rs.{salary.roleRange.min} – {salary.roleRange.max} LPA
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.3rem" }}>
            Skill match: {salary.matchRatio}% of JD requirements met
          </div>
        </div>

        {/* Coverage */}
        <div className="card">
          <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginBottom: "0.75rem" }}>
            Skill Coverage
          </p>
          <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "baseline", marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 700, fontSize: "1.8rem" }}>{coverage}%</span>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {matched}/{jdSkills.length} skills
            </span>
          </div>
          <div style={{ background: "var(--border)", borderRadius: "999px", height: 10, marginBottom: "0.5rem" }}>
            <div style={{
              width: `${coverage}%`, height: "100%", borderRadius: "999px",
              background: coverage >= 70 ? "var(--green)" : coverage >= 40 ? "var(--yellow)" : "var(--red)",
              transition: "width 0.8s ease",
            }} />
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
            {coverage >= 70 ? "Strong match for this role." :
             coverage >= 40 ? "Moderate match — focus on the roadmap." :
             "Low match — significant upskilling needed."}
          </p>
        </div>
      </div>

      {/* Matched skills */}
      <Section title={`Matched Skills (${matched})`}>
        <div>
          {matched > 0
            ? (matchedSkills ?? []).map((s) => <SkillPill key={s} skill={s} variant="have" />)
            : <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No JD skills matched in resume.</p>}
        </div>
      </Section>

      {/* All resume skills */}
      <Section title={`All Resume Skills (${resumeSkills.length})`}>
        <div>
          {resumeSkills.length
            ? resumeSkills.map((s) => <SkillPill key={s} skill={s} variant="jd" />)
            : <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No skills detected.</p>}
        </div>
      </Section>

      {/* Missing skills */}
      <Section title={`Missing Skills (${missingSkills.length})`}>
        <div>
          {missingSkills.length
            ? missingSkills.map((s) => <SkillPill key={s} skill={s} variant="missing" />)
            : <p style={{ color: "var(--green)", fontSize: "0.9rem" }}>You have all required skills!</p>}
        </div>
      </Section>

      {/* Roadmap */}
      {roadmap.length > 0 && (
        <Section title={`Personalised Roadmap — by priority (${roadmap.length} skills)`}>
          <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
            Sorted by impact score (importance x difficulty). Learn #1 first.
          </p>
          {roadmap.map((item, i) => (
            <RoadmapCard key={item.skill} item={item} rank={i + 1} />
          ))}
        </Section>
      )}

      {/* Interview tips teaser */}
      {interviewTips && (
        <div className="card" style={{ display: "flex", alignItems: "center",
                                        justifyContent: "space-between", flexWrap: "wrap",
                                        gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontWeight: 700 }}>Ready to prep for the interview?</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              Get {interviewTips.domain}-specific tips tailored to your skill gap.
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/tips", { state })}>
            View Interview Tips
          </button>
        </div>
      )}

      {/* Resume builder CTA */}
      <div className="card" style={{ display: "flex", alignItems: "center",
                                      justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
                                      borderColor: "#4c1d95" }}>
        <div>
          <p style={{ fontWeight: 700 }}>Your resume needs improvement?</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Build a stronger resume with live ATS scoring. Missing skills are auto-injected.
          </p>
        </div>
        <button style={{ background: "#7c3aed", color: "#fff", border: "none",
                         borderRadius: "var(--radius)", padding: "0.6rem 1.2rem",
                         fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}
                onClick={() => navigate("/builder", { state })}>
          Open Resume Builder
        </button>
      </div>
    </div>
  );
}
