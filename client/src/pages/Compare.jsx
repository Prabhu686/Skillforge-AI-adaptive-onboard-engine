import { useState, useRef } from "react";

function FileZone({ label, file, onFile }) {
  const ref = useRef();
  return (
    <div onClick={() => ref.current.click()}
         style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius)",
                  padding: "1.5rem", textAlign: "center", cursor: "pointer" }}>
      <input ref={ref} type="file" accept=".pdf,.txt" style={{ display: "none" }}
             onChange={(e) => onFile(e.target.files[0])} />
      <div style={{ fontSize: "1.5rem" }}>📄</div>
      <p style={{ fontWeight: 600, fontSize: "0.9rem", marginTop: "0.4rem" }}>{label}</p>
      {file
        ? <p style={{ color: "var(--green)", fontSize: "0.8rem", marginTop: "0.3rem" }}>✓ {file.name}</p>
        : <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>PDF or TXT</p>}
    </div>
  );
}

function gradeColor(g) {
  return { A: "#22c55e", B: "#86efac", C: "#f59e0b", D: "#f97316", F: "#ef4444" }[g] ?? "#94a3b8";
}

function ScoreRing({ score, grade }) {
  const r = 40, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto" }}>
      <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={gradeColor(grade)}
                strokeWidth="8" strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontWeight: 900, fontSize: "1.3rem", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.75rem", color: gradeColor(grade), fontWeight: 700 }}>
          {grade}
        </span>
      </div>
    </div>
  );
}

function ResumeColumn({ label, data, jdSkills, winner }) {
  if (!data) return null;
  const { skills, score, salary, missing } = data;
  const matched = jdSkills.filter((s) =>
    skills.map((r) => r.toLowerCase()).includes(s.toLowerCase())
  );
  return (
    <div className="card" style={{ flex: 1, minWidth: 260,
                                    border: winner ? "2px solid var(--accent)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: "1rem" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        {winner && <span className="badge badge-purple">🏆 Better Match</span>}
      </div>

      <ScoreRing score={score.score} grade={score.grade} />
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.8rem",
                  marginTop: "0.5rem", marginBottom: "1rem" }}>
        {score.feedback}
      </p>

      {/* Salary */}
      <div style={{ background: "var(--bg)", borderRadius: "8px", padding: "0.75rem",
                    marginBottom: "1rem" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>💰 Est. Salary ({salary.domain})</p>
        <p style={{ fontWeight: 700, color: "var(--green)", fontSize: "1rem" }}>
          ₹{salary.candidateRange.min}–{salary.candidateRange.max} LPA
        </p>
      </div>

      {/* Coverage bar */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
                      fontSize: "0.8rem", marginBottom: "0.3rem" }}>
          <span>Coverage</span>
          <span style={{ fontWeight: 700 }}>{score.breakdown.coverage}%</span>
        </div>
        <div style={{ background: "var(--border)", borderRadius: "999px", height: 7 }}>
          <div style={{ width: `${score.breakdown.coverage}%`, height: "100%",
                        background: "var(--accent)", borderRadius: "999px",
                        transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Matched */}
      <p style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>
        ✅ Matched ({matched.length})
      </p>
      <div style={{ marginBottom: "0.75rem" }}>
        {matched.map((s) => (
          <span key={s} style={{ display: "inline-block", margin: "0.15rem",
                                  background: "#14532d", color: "#22c55e",
                                  padding: "0.2rem 0.6rem", borderRadius: "999px",
                                  fontSize: "0.75rem", fontWeight: 600 }}>✓ {s}</span>
        ))}
      </div>

      {/* Missing */}
      <p style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>
        ❌ Missing ({missing.length})
      </p>
      <div>
        {missing.map((s) => (
          <span key={s} style={{ display: "inline-block", margin: "0.15rem",
                                  background: "#450a0a", color: "#ef4444",
                                  padding: "0.2rem 0.6rem", borderRadius: "999px",
                                  fontSize: "0.75rem", fontWeight: 600 }}>✗ {s}</span>
        ))}
      </div>
    </div>
  );
}

export default function Compare() {
  const [r1, setR1] = useState(null);
  const [r2, setR2] = useState(null);
  const [jd, setJd] = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleCompare() {
    if (!r1 || !r2 || !jd) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const form = new FormData();
      form.append("resume1", r1);
      form.append("resume2", r2);
      form.append("jd", jd);
      const res = await fetch("/api/analyze/compare", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error ?? `Error ${res.status}`);
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const winner = result
    ? (result.resume1.score.score >= result.resume2.score.score ? "resume1" : "resume2")
    : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.4rem" }}>
        🆚 Resume Comparator
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
        Upload two resumes against the same job description to see who's the better match.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem",
                    marginBottom: "1.5rem" }}>
        <FileZone label="Resume A" file={r1} onFile={setR1} />
        <FileZone label="Resume B" file={r2} onFile={setR2} />
        <FileZone label="Job Description" file={jd} onFile={setJd} />
      </div>

      {error && <p style={{ color: "var(--red)", marginBottom: "1rem" }}>{error}</p>}

      <button className="btn-primary" style={{ width: "100%", padding: "0.85rem" }}
              onClick={handleCompare} disabled={!r1 || !r2 || !jd || loading}>
        {loading ? "Comparing…" : "Compare →"}
      </button>

      {result && (
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
          <ResumeColumn label="Resume A" data={result.resume1}
                        jdSkills={result.jdSkills} winner={winner === "resume1"} />
          <ResumeColumn label="Resume B" data={result.resume2}
                        jdSkills={result.jdSkills} winner={winner === "resume2"} />
        </div>
      )}
    </div>
  );
}
