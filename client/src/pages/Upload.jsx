import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeDocuments } from "../api/analyze.js";

function FileDropZone({ label, accept, file, onFile }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "2rem",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? "#1e1b4b33" : "transparent",
        transition: "all 0.2s",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = ""; }}
      />
      <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
                    color: "var(--muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
        {label}
      </div>
      {file
        ? <p style={{ color: "var(--green)", fontSize: "0.85rem" }}>{file.name}</p>
        : <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>PDF or TXT · max 5 MB</p>
      }
    </div>
  );
}

export default function Upload() {
  const [resume, setResume] = useState(null);
  const [jd,     setJd]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();

  async function handleAnalyze() {
    if (!resume || !jd) return;
    setLoading(true);
    setError("");
    try {
      const data = await analyzeDocuments(resume, jd);
      navigate("/results", { state: data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
          Analyse Your Resume
        </h1>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
          Upload your resume and a job description to get your skill gap and personalised roadmap.
        </p>
      </div>

      <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
        <FileDropZone label="Your Resume"     accept=".pdf,.txt" file={resume} onFile={setResume} />
        <FileDropZone label="Job Description" accept=".pdf,.txt" file={jd}     onFile={setJd}     />
      </div>

      {error && (
        <p style={{ color: "var(--red)", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>
      )}

      <button
        className="btn-primary"
        style={{ width: "100%", padding: "0.85rem" }}
        onClick={handleAnalyze}
        disabled={!resume || !jd || loading}
      >
        {loading ? "Analysing..." : "Analyse My Skills"}
      </button>
    </div>
  );
}
