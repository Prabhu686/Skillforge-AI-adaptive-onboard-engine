import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE = import.meta.env.VITE_API_URL ?? "";

// ── ATS Ring ────────────────────────────────────────────────────────────────
function ATSRing({ score }) {
  const r = 44, circ = 2 * Math.PI * r;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Strong" : score >= 50 ? "Fair" : "Weak";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 0.5rem" }}>
        <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
          <circle cx="55" cy="55" r={r} fill="none" stroke={color}
                  strokeWidth="9" strokeDasharray={`${(score/100)*circ} ${circ}`}
                  strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontWeight: 900, fontSize: "1.5rem", lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: "0.7rem", color, fontWeight: 700 }}>{label}</span>
        </div>
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>ATS Score</p>
    </div>
  );
}

function ScoreBar({ label, value, max }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.25rem" }}>
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}/{max}</span>
      </div>
      <div style={{ background: "var(--border)", borderRadius: "999px", height: 6 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "999px", background: color, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ── Field helpers ────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: "8px", padding: "0.55rem 0.8rem", color: "var(--text)",
  fontSize: "0.85rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
function Field({ label, value, onChange, rows, hint, placeholder }) {
  return (
    <div style={{ marginBottom: "0.9rem" }}>
      {label && <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600,
        color: "var(--muted)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>}
      {rows > 1
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                 style={inputStyle} />}
      {hint && <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.25rem" }}>{hint}</p>}
    </div>
  );
}

function SectionLabel({ children }) {
  return <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--accent)",
                     margin: "1.2rem 0 0.75rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" }}>
    {children}
  </p>;
}

function AddBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "8px", padding: "0.35rem 0.9rem", fontSize: "0.78rem", color: "var(--muted)",
      cursor: "pointer", marginBottom: "0.75rem" }}>
      + {label}
    </button>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "transparent", border: "none", color: "#ef4444",
      cursor: "pointer", fontSize: "0.78rem", padding: "0 0.4rem" }}>
      Remove
    </button>
  );
}

// ── Default form state ───────────────────────────────────────────────────────
const EMPTY = {
  name: "", email: "", phone: "", linkedin: "", github: "", portfolio: "", collegeLogo: "",
  education: [{ degree: "", institution: "", score: "", year: "" }],
  experience: [{ company: "", year: "", description: "" }],
  skillsAcquired: "Frontend: \nBackend: \nCloud: ",
  projects: [{ title: "", status: "", techStack: "", github: "", date: "", description: "" }],
  achievements: [{ text: "", year: "" }],
  codingProfiles: "",
  certifications: [{ name: "", platform: "", year: "" }],
  technicalSkills: [
    { category: "Languages", value: "" },
    { category: "Technologies/Frameworks", value: "" },
    { category: "Database", value: "" },
    { category: "Tools", value: "" },
    { category: "Core Concepts", value: "" },
  ],
};

// ── array helpers ────────────────────────────────────────────────────────────
function addItem(arr, template) { return [...arr, { ...template }]; }
function removeItem(arr, i) { return arr.filter((_, idx) => idx !== i); }
function updateItem(arr, i, key, val) { return arr.map((item, idx) => idx === i ? { ...item, [key]: val } : item); }

export default function Builder() {
  const { state } = useLocation();
  const gapSkills = state?.missingSkills ?? [];

  const [form,       setForm]       = useState(EMPTY);
  const [ats,        setAts]        = useState({ total: 0, breakdown: {}, warnings: [] });
  const [injected,   setInjected]   = useState(false);
  const [tab,        setTab]        = useState("form");
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [fileName,    setFileName]    = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Live ATS scoring
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}/api/analyze/build`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(flattenForATS(form)),
        });
        const data = await res.json();
        if (data.ats) setAts(data.ats);
      } catch { /* server offline */ }
    }, 300);
    return () => clearTimeout(t);
  }, [form]);

  // Flatten structured form to flat strings for ATS scoring
  function flattenForATS(f) {
    return {
      summary:    f.experience.map(e => e.description).join("\n"),
      experience: f.experience.map(e => e.description).join("\n"),
      education:  f.education.map(e => `${e.degree} ${e.institution}`).join("\n"),
      skills:     f.technicalSkills.map(t => t.value).join(", "),
      projects:   f.projects.map(p => p.description).join("\n"),
    };
  }

  function injectGapSkills() {
    const ts = form.technicalSkills.map((t, i) =>
      i === 0 ? { ...t, value: t.value ? t.value + ", " + gapSkills.join(", ") : gapSkills.join(", ") } : t
    );
    setF("technicalSkills", ts);
    setInjected(true);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    setDownloadUrl("");
    try {
      const res = await fetch(`${BASE}/api/analyze/build/download`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const name = `${form.name || "resume"}.docx`;
      setDownloadUrl(url);
      setFileName(name);
      setShowPreview(true);
    } catch (e) {
      setGenError(e.message || "Could not reach server.");
    } finally { setGenerating(false); }
  }

  const { breakdown = {} } = ats;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Resume Builder</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "0.3rem" }}>
            Fill in each section. Click Generate Resume to download a formatted Word document.
          </p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
                style={{ padding: "0.6rem 1.6rem", borderRadius: "10px", border: "none",
                         fontWeight: 700, fontSize: "0.95rem", cursor: generating ? "not-allowed" : "pointer",
                         background: generating ? "#4f46e5aa" : "#4f46e5", color: "#fff",
                         opacity: generating ? 0.8 : 1, transition: "all 0.15s", whiteSpace: "nowrap" }}>
          {generating ? "Generating..." : "Generate Resume (.docx)"}
        </button>
      </div>

      {genError && (
        <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: "8px",
                      padding: "0.65rem 1rem", marginBottom: "1.5rem", fontSize: "0.82rem", color: "#fca5a5" }}>
          {genError}
        </div>
      )}

      {/* ── Resume Preview Modal ── */}
      {showPreview && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1000,
                      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
             onClick={() => setShowPreview(false)}>
          <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: 780,
                        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
               onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "0.85rem 1.2rem", borderBottom: "1px solid #e5e7eb" }}>
              <span style={{ fontWeight: 700, color: "#111", fontSize: "0.95rem" }}>Resume Preview</span>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <a href={downloadUrl} download={fileName}
                   style={{ background: "#4f46e5", color: "#fff", padding: "0.45rem 1.1rem",
                            borderRadius: "8px", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
                  ⬇ Download .docx
                </a>
                <button onClick={() => setShowPreview(false)}
                        style={{ background: "#f3f4f6", border: "none", borderRadius: "8px",
                                 padding: "0.45rem 0.9rem", cursor: "pointer", fontWeight: 600,
                                 fontSize: "0.82rem", color: "#374151" }}>✕ Close</button>
              </div>
            </div>

            {/* Resume HTML preview */}
            <div style={{ overflowY: "auto", padding: "2rem 2.5rem", color: "#111",
                          fontFamily: "'Times New Roman', serif", fontSize: "11pt", lineHeight: 1.5 }}>

              {/* Header: logo left, name+contact right */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                {form.collegeLogo && <img src={form.collegeLogo} alt="college logo" style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }} />}
                <div style={{ textAlign: "right", flex: 1 }}>
                  <div style={{ fontSize: "20pt", fontWeight: 700, lineHeight: 1.2 }}>{form.name || "Your Name"}</div>
                  <div style={{ fontSize: "9pt", color: "#444", marginTop: "4px" }}>
                    {[form.phone, form.email, form.linkedin && "LinkedIn", form.github && "GitHub", form.portfolio && "Portfolio"]
                      .filter(Boolean).join("  |  ")}
                  </div>
                </div>
              </div>

              {/* Section helper */}
              {["EDUCATION", "INTERNSHIP EXPERIENCES", "SKILLS ACQUIRED", "PROJECTS",
                "ACHIEVEMENTS", "CODING PROFILES", "CERTIFICATIONS", "TECHNICAL SKILLS"]
                .map(sec => {
                  const hr = <div style={{ borderBottom: "1.5px solid #111", margin: "6px 0 8px" }} />;
                  const heading = <div style={{ fontWeight: 700, fontSize: "11pt", marginBottom: 0 }}>{sec}</div>;

                  if (sec === "EDUCATION" && form.education.length) return (
                    <div key={sec}>{heading}{hr}
                      {form.education.map((ed, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span><b>{ed.degree}</b>  {ed.institution}  {ed.score && `| ${ed.score}`}</span>
                          <span style={{ fontWeight: 700 }}>{ed.year}</span>
                        </div>
                      ))}
                    </div>);

                  if (sec === "INTERNSHIP EXPERIENCES" && form.experience.some(e => e.company)) return (
                    <div key={sec} style={{ marginTop: 12 }}>{heading}{hr}
                      {form.experience.map((exp, i) => exp.company ? (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <b>{exp.company}</b><span style={{ fontWeight: 700 }}>{exp.year}</span>
                          </div>
                          {exp.description && exp.description.split("\n").filter(Boolean).map((l, j) => (
                            <div key={j} style={{ paddingLeft: 16, fontSize: "10pt" }}>• {l.replace(/\[.*?\]/g, "").trim()}</div>
                          ))}
                        </div>
                      ) : null)}
                    </div>);

                  if (sec === "SKILLS ACQUIRED" && form.skillsAcquired) return (
                    <div key={sec} style={{ marginTop: 12 }}>{heading}{hr}
                      {form.skillsAcquired.split("\n").filter(Boolean).map((l, i) => {
                        const [cat, ...rest] = l.split(":");
                        return <div key={i} style={{ fontSize: "10pt", marginBottom: 3 }}><b>{cat}:</b> {rest.join(":")}</div>;
                      })}
                    </div>);

                  if (sec === "PROJECTS" && form.projects.some(p => p.title)) return (
                    <div key={sec} style={{ marginTop: 12 }}>{heading}{hr}
                      {form.projects.map((p, i) => p.title ? (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span><b>{p.title}</b>{p.status ? ` (${p.status})` : ""}</span>
                            <span style={{ fontWeight: 700 }}>{p.date}</span>
                          </div>
                          {p.techStack && <div style={{ fontSize: "10pt" }}><b>Tech Stack:</b> {p.techStack}</div>}
                          {p.description && p.description.split("\n").filter(Boolean).map((l, j) => (
                            <div key={j} style={{ paddingLeft: 16, fontSize: "10pt" }}>• {l}</div>
                          ))}
                        </div>
                      ) : null)}
                    </div>);

                  if (sec === "ACHIEVEMENTS" && form.achievements.some(a => a.text)) return (
                    <div key={sec} style={{ marginTop: 12 }}>{heading}{hr}
                      {form.achievements.map((a, i) => a.text ? (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <b>{a.text}</b><span style={{ fontWeight: 700 }}>{a.year}</span>
                        </div>
                      ) : null)}
                    </div>);

                  if (sec === "CODING PROFILES" && form.codingProfiles) return (
                    <div key={sec} style={{ marginTop: 12 }}>{heading}{hr}
                      <div style={{ fontSize: "10pt" }}>{form.codingProfiles}</div>
                    </div>);

                  if (sec === "CERTIFICATIONS" && form.certifications.some(c => c.name)) return (
                    <div key={sec} style={{ marginTop: 12 }}>{heading}{hr}
                      {form.certifications.map((c, i) => c.name ? (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span>{c.name}{c.platform ? ` | ${c.platform}` : ""}</span>
                          <span style={{ fontWeight: 700 }}>{c.year}</span>
                        </div>
                      ) : null)}
                    </div>);

                  if (sec === "TECHNICAL SKILLS" && form.technicalSkills.some(t => t.value)) return (
                    <div key={sec} style={{ marginTop: 12 }}>{heading}{hr}
                      {form.technicalSkills.map((t, i) => t.value ? (
                        <div key={i} style={{ fontSize: "10pt", marginBottom: 3 }}>
                          <b>{t.category}  </b>{t.value}
                        </div>
                      ) : null)}
                    </div>);

                  return null;
                })}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem", alignItems: "start" }}>

        {/* ── Left: form ── */}
        <div className="card">

          {/* Contact */}
          <SectionLabel>Contact</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <Field label="Full Name"    value={form.name}      onChange={v => setF("name", v)} />
            <Field label="Email"        value={form.email}     onChange={v => setF("email", v)} />
            <Field label="Phone"        value={form.phone}     onChange={v => setF("phone", v)} />
            <Field label="LinkedIn URL" value={form.linkedin}  onChange={v => setF("linkedin", v)} />
            <Field label="GitHub URL"   value={form.github}    onChange={v => setF("github", v)} />
            <Field label="Portfolio URL" value={form.portfolio} onChange={v => setF("portfolio", v)} />
          </div>
          <div style={{ marginBottom: "0.9rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600,
              color: "var(--muted)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              College Logo (shown beside name)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input type="file" accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setF("collegeLogo", ev.target.result);
                  reader.readAsDataURL(file);
                }}
                style={{ fontSize: "0.78rem", color: "var(--muted)" }} />
              {form.collegeLogo && (
                <>
                  <img src={form.collegeLogo} alt="logo" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 4, border: "1px solid var(--border)" }} />
                  <button onClick={() => setF("collegeLogo", "")}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.78rem" }}>
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Education */}
          <SectionLabel>Education</SectionLabel>
          {form.education.map((ed, i) => (
            <div key={i} style={{ background: "var(--bg)", borderRadius: "8px", padding: "0.75rem",
                                  marginBottom: "0.75rem", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {form.education.length > 1 && <RemoveBtn onClick={() => setF("education", removeItem(form.education, i))} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: "0 0.75rem" }}>
                <Field label="Degree / Level"  value={ed.degree}      onChange={v => setF("education", updateItem(form.education, i, "degree", v))}      placeholder="COLLEGE EDUCATION" />
                <Field label="Institution"      value={ed.institution} onChange={v => setF("education", updateItem(form.education, i, "institution", v))} placeholder="Sri Eshwar College" />
                <Field label="Score / CGPA"     value={ed.score}       onChange={v => setF("education", updateItem(form.education, i, "score", v))}       placeholder="7.6 (Vth sem)" />
                <Field label="Year"             value={ed.year}        onChange={v => setF("education", updateItem(form.education, i, "year", v))}        placeholder="2023-2027" />
              </div>
            </div>
          ))}
          <AddBtn onClick={() => setF("education", addItem(form.education, { degree:"", institution:"", score:"", year:"" }))} label="Add Education" />

          {/* Experience */}
          <SectionLabel>Internship / Experience</SectionLabel>
          {form.experience.map((exp, i) => (
            <div key={i} style={{ background: "var(--bg)", borderRadius: "8px", padding: "0.75rem",
                                  marginBottom: "0.75rem", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {form.experience.length > 1 && <RemoveBtn onClick={() => setF("experience", removeItem(form.experience, i))} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "0 0.75rem" }}>
                <Field label="Company / Organisation" value={exp.company} onChange={v => setF("experience", updateItem(form.experience, i, "company", v))} placeholder="Gilbarco Veeder Root pvt ltd" />
                <Field label="Year" value={exp.year} onChange={v => setF("experience", updateItem(form.experience, i, "year", v))} placeholder="2024" />
              </div>
              <Field label="Description (one line per bullet, add [Link] at end for hyperlink)"
                     value={exp.description} rows={4}
                     onChange={v => setF("experience", updateItem(form.experience, i, "description", v))}
                     placeholder={"Developed a backend automation system... [Link]\nBuilt REST APIs with Node.js and Express."} />
            </div>
          ))}
          <AddBtn onClick={() => setF("experience", addItem(form.experience, { company:"", year:"", description:"" }))} label="Add Experience" />

          {/* Skills Acquired */}
          <SectionLabel>Skills Acquired</SectionLabel>
          <Field label="Skills Acquired (Category: skills, one per line)"
                 value={form.skillsAcquired} rows={4}
                 onChange={v => setF("skillsAcquired", v)}
                 hint="e.g.  Frontend: React, CSS, JS" />

          {/* Projects */}
          <SectionLabel>Projects</SectionLabel>
          {form.projects.map((proj, i) => (
            <div key={i} style={{ background: "var(--bg)", borderRadius: "8px", padding: "0.75rem",
                                  marginBottom: "0.75rem", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {form.projects.length > 1 && <RemoveBtn onClick={() => setF("projects", removeItem(form.projects, i))} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0 0.75rem" }}>
                <Field label="Project Title"  value={proj.title}  onChange={v => setF("projects", updateItem(form.projects, i, "title", v))}  placeholder="TrackOS" />
                <Field label="Status"         value={proj.status} onChange={v => setF("projects", updateItem(form.projects, i, "status", v))} placeholder="Ongoing" />
                <Field label="GitHub URL"     value={proj.github} onChange={v => setF("projects", updateItem(form.projects, i, "github", v))} placeholder="https://github.com/..." />
                <Field label="Date"           value={proj.date}   onChange={v => setF("projects", updateItem(form.projects, i, "date", v))}   placeholder="December 2025" />
              </div>
              <Field label="Tech Stack" value={proj.techStack} onChange={v => setF("projects", updateItem(form.projects, i, "techStack", v))} placeholder="Java (Spring Boot, JVM), eBPF, Hikari pool" />
              <Field label="Description (one line per point)" value={proj.description} rows={3}
                     onChange={v => setF("projects", updateItem(form.projects, i, "description", v))}
                     placeholder={"TrackOS is a real-time rail slot allocation runtime.\nIt highly optimizes JVM execution."} />
            </div>
          ))}
          <AddBtn onClick={() => setF("projects", addItem(form.projects, { title:"", status:"", techStack:"", github:"", date:"", description:"" }))} label="Add Project" />

          {/* Achievements */}
          <SectionLabel>Achievements</SectionLabel>
          {form.achievements.map((ach, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 0.75rem",
                                  alignItems: "end", marginBottom: "0.5rem" }}>
              <Field value={ach.text} onChange={v => setF("achievements", updateItem(form.achievements, i, "text", v))}
                     placeholder="Awarded Best Innovator at the International Startup TN Hackathon" />
              <Field value={ach.year} onChange={v => setF("achievements", updateItem(form.achievements, i, "year", v))}
                     placeholder="2025" />
              {form.achievements.length > 1 && <RemoveBtn onClick={() => setF("achievements", removeItem(form.achievements, i))} />}
            </div>
          ))}
          <AddBtn onClick={() => setF("achievements", addItem(form.achievements, { text:"", year:"" }))} label="Add Achievement" />

          {/* Coding Profiles */}
          <SectionLabel>Coding Profiles</SectionLabel>
          <Field label="Coding Profiles (single line)" value={form.codingProfiles}
                 onChange={v => setF("codingProfiles", v)}
                 placeholder="Leetcode: Max Rating:1560 | Global Rank: 2,32,545 | Problems Solved: 416 | Profile Link: LINK" />

          {/* Certifications */}
          <SectionLabel>Certifications</SectionLabel>
          {form.certifications.map((cert, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr auto", gap: "0 0.75rem",
                                  alignItems: "end", marginBottom: "0.5rem" }}>
              <Field value={cert.name}     onChange={v => setF("certifications", updateItem(form.certifications, i, "name", v))}     placeholder="AWS EC2, S3 & Serverless Deployment for Full-Stack Developers" />
              <Field value={cert.platform} onChange={v => setF("certifications", updateItem(form.certifications, i, "platform", v))} placeholder="Udemy" />
              <Field value={cert.year}     onChange={v => setF("certifications", updateItem(form.certifications, i, "year", v))}     placeholder="2025" />
              {form.certifications.length > 1 && <RemoveBtn onClick={() => setF("certifications", removeItem(form.certifications, i))} />}
            </div>
          ))}
          <AddBtn onClick={() => setF("certifications", addItem(form.certifications, { name:"", platform:"", year:"" }))} label="Add Certification" />

          {/* Technical Skills */}
          <SectionLabel>Technical Skills</SectionLabel>

          {/* Skill gap inject */}
          {gapSkills.length > 0 && (
            <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: "8px",
                          padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex",
                          alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {injected ? "Gap skills injected into Languages." : `${gapSkills.length} missing skills from your analysis.`}
                </p>
                {!injected && <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: "0.2rem" }}>
                  {gapSkills.slice(0,5).join(", ")}{gapSkills.length > 5 ? ` +${gapSkills.length-5} more` : ""}
                </p>}
              </div>
              {!injected && (
                <button onClick={injectGapSkills}
                        style={{ background: "var(--accent)", color: "#fff", border: "none",
                                 borderRadius: "8px", padding: "0.45rem 1rem", fontWeight: 600,
                                 fontSize: "0.82rem", cursor: "pointer" }}>
                  Add to Skills
                </button>
              )}
            </div>
          )}

          {form.technicalSkills.map((ts, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: "0 0.75rem",
                                  alignItems: "end", marginBottom: "0.5rem" }}>
              <Field value={ts.category} onChange={v => setF("technicalSkills", updateItem(form.technicalSkills, i, "category", v))} placeholder="Languages" />
              <Field value={ts.value}    onChange={v => setF("technicalSkills", updateItem(form.technicalSkills, i, "value", v))}    placeholder="C | C++ | Java | HTML | CSS | Scala" />
              {form.technicalSkills.length > 1 && <RemoveBtn onClick={() => setF("technicalSkills", removeItem(form.technicalSkills, i))} />}
            </div>
          ))}
          <AddBtn onClick={() => setF("technicalSkills", addItem(form.technicalSkills, { category:"", value:"" }))} label="Add Skill Row" />

        </div>

        {/* ── Right: ATS panel ── */}
        <div style={{ position: "sticky", top: "72px" }}>
          <div className="card" style={{ marginBottom: "1rem", textAlign: "center" }}>
            <ATSRing score={ats.total} />
            <div style={{ marginTop: "1rem" }}>
              <ScoreBar label="Section completeness" value={breakdown.completeness ?? 0} max={30} />
              <ScoreBar label="Keyword density"      value={breakdown.keywordScore  ?? 0} max={25} />
              <ScoreBar label="Action verbs"         value={breakdown.verbScore     ?? 0} max={25} />
              <ScoreBar label="Quantified impact"    value={breakdown.quantScore    ?? 0} max={20} />
            </div>
          </div>
          <div className="card">
            <p style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>Section Feedback</p>
            {ats.warnings?.length > 0 ? (
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {ats.warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: "0.78rem", color: "#fbbf24", background: "#451a03",
                                       borderRadius: "6px", padding: "0.4rem 0.65rem", lineHeight: 1.4 }}>
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: "0.82rem", color: "var(--green)" }}>All sections look good. Your resume is ATS-ready.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
