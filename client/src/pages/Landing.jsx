import { useNavigate } from "react-router-dom";

const STEPS = [
  { num: "01", title: "Upload Resume + JD",  desc: "Drop your PDF resume and the job description you are targeting." },
  { num: "02", title: "AI Skill Extraction", desc: "GPT-4o-mini (or O*NET taxonomy) pulls every skill from both documents." },
  { num: "03", title: "Gap Analysis",        desc: "We diff JD skills against your resume — missing skills surface instantly." },
  { num: "04", title: "Adaptive Roadmap",    desc: "Each gap skill gets a Beginner / Intermediate / Advanced path with curated resources." },
];

const FEATURES = [
  { title: "Resume Score",      desc: "0-100 score + letter grade based on real JD match, domain depth, and breadth." },
  { title: "Salary Estimate",   desc: "INR LPA range for your current skill set vs. the full role band." },
  { title: "Priority Ranking",  desc: "Skills sorted by importance x difficulty so you learn what matters most first." },
  { title: "Resume Comparator", desc: "Upload two resumes against the same JD and see who wins — and why." },
  { title: "Interview Tips",    desc: "Domain-specific interview prep tips generated from your skill gap." },
  { title: "PDF Export",        desc: "Download your full personalised roadmap as a clean PDF in one click." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <div style={{
        textAlign: "center", padding: "5rem 1.5rem 4rem",
        background: "linear-gradient(160deg, #0f1117 0%, #1a1040 100%)",
        borderBottom: "1px solid var(--border)",
      }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900,
                     letterSpacing: "-1px", lineHeight: 1.15, marginBottom: "1.2rem" }}>
          Know your skill gap.<br />
          <span style={{ color: "var(--accent)" }}>Build your roadmap.</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.1rem", maxWidth: 520,
                    margin: "0 auto 2rem" }}>
          Upload a resume and a job description. Get extracted skills, a gap analysis,
          salary estimate in INR, and a personalised learning roadmap — instantly.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}
                  onClick={() => navigate("/upload")}>
            Get Started
          </button>
          <button onClick={() => navigate("/compare")}
                  style={{ padding: "0.85rem 2rem", fontSize: "1rem", fontWeight: 600,
                           background: "transparent", border: "1px solid var(--border)",
                           borderRadius: "var(--radius)", color: "var(--text)", cursor: "pointer" }}>
            Compare Resumes
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 800,
                     marginBottom: "2.5rem" }}>How It Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1.5rem" }}>
          {STEPS.map((s) => (
            <div key={s.num} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent)",
                            marginBottom: "0.6rem" }}>{s.num}</div>
              <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{s.title}</div>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1.5rem" }}>
          <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 800,
                       marginBottom: "2.5rem" }}>Everything You Need</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "1rem" }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ padding: "1rem", borderRadius: "var(--radius)",
                                          border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{f.title}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.83rem", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem" }}>
          Ready to close your skill gap?
        </h2>
        <button className="btn-primary" style={{ padding: "0.85rem 2.5rem", fontSize: "1rem" }}
                onClick={() => navigate("/upload")}>
          Analyse My Resume
        </button>
      </div>
    </div>
  );
}
