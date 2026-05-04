import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STEPS = { INTRO: "intro", INTERVIEW: "interview", REPORT: "report" };

function ScoreRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position: "relative", width: 88, height: 88 }}>
      <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontWeight: 900, fontSize: "1.2rem", lineHeight: 1, color }}>{score}</span>
        <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>/ 100</span>
      </div>
    </div>
  );
}

export default function Interview() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const fromResult = state?.resumeSkills ?? [];
  const domain     = state?.salary?.domain ?? "General";

  const [step,        setStep]        = useState(STEPS.INTRO);
  const [questions,   setQuestions]   = useState([]);
  const [current,     setCurrent]     = useState(0);
  const [userAnswer,  setUserAnswer]  = useState("");
  const [answers,     setAnswers]     = useState([]);
  const [feedback,    setFeedback]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [count,       setCount]       = useState(5);

  // ── Start interview ──────────────────────────────────────────────────────
  async function startInterview() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze/interview/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: fromResult, domain, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load questions");
      setQuestions(data.questions);
      setCurrent(0);
      setAnswers([]);
      setFeedback(null);
      setUserAnswer("");
      setStep(STEPS.INTERVIEW);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Submit answer ────────────────────────────────────────────────────────
  async function submitAnswer() {
    if (!userAnswer.trim()) return;
    setLoading(true);
    try {
      const q = questions[current];
      const res = await fetch("/api/analyze/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question:    q.question,
          idealAnswer: q.idealAnswer,
          userAnswer:  userAnswer.trim(),
        }),
      });
      const fb = await res.json();
      setFeedback(fb);
      setAnswers(prev => [...prev, { ...q, userAnswer: userAnswer.trim(), ...fb }]);
    } catch (e) {
      setError("Evaluation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Next question ────────────────────────────────────────────────────────
  function nextQuestion() {
    if (current + 1 >= questions.length) {
      finishInterview();
    } else {
      setCurrent(c => c + 1);
      setUserAnswer("");
      setFeedback(null);
    }
  }

  // ── Finish & save ────────────────────────────────────────────────────────
  async function finishInterview() {
    setStep(STEPS.REPORT);
    try {
      await fetch("/api/analyze/interview/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: fromResult, domain, answers }),
      });
    } catch { /* non-critical */ }
  }

  const overallScore = answers.length
    ? Math.round(answers.reduce((s, a) => s + (a.score ?? 0), 0) / answers.length)
    : 0;

  const weakAreas = [...new Set(answers.filter(a => (a.score ?? 0) < 50).map(a => a.skill))];

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (step === STEPS.INTRO) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>
        AI Mock Interview
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.92rem" }}>
        {fromResult.length > 0
          ? `Tailored to your ${domain} skill profile — ${fromResult.length} skills detected.`
          : "Answer AI-generated technical questions and get instant feedback."}
      </p>

      <div className="card" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
        <p style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>How it works</p>
        {["AI generates questions based on your skill gap",
          "Answer each question in your own words",
          "Get instant AI feedback and score per answer",
          "Receive a full performance report at the end"].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.6rem",
                                alignItems: "flex-start" }}>
            <span style={{ background: "var(--accent)", color: "#fff", borderRadius: "50%",
                           width: 22, height: 22, display: "flex", alignItems: "center",
                           justifyContent: "center", fontSize: "0.72rem", fontWeight: 700,
                           flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "1rem", marginBottom: "1.5rem" }}>
        <label style={{ fontSize: "0.88rem", color: "var(--muted)" }}>Number of questions:</label>
        {[3, 5, 8, 10].map(n => (
          <button key={n} onClick={() => setCount(n)}
            style={{ padding: "0.35rem 0.9rem", borderRadius: "999px",
                     border: "1px solid var(--border)", cursor: "pointer",
                     background: count === n ? "var(--accent)" : "var(--surface)",
                     color: count === n ? "#fff" : "var(--muted)",
                     fontWeight: 600, fontSize: "0.85rem" }}>
            {n}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "var(--red)", marginBottom: "1rem", fontSize: "0.88rem" }}>{error}</p>}

      <button className="btn-primary" onClick={startInterview} disabled={loading}
              style={{ width: "100%", padding: "0.85rem", fontSize: "1rem" }}>
        {loading ? "Generating questions..." : "Start Interview"}
      </button>

      {state && (
        <button onClick={() => navigate("/results", { state })}
          style={{ marginTop: "1rem", background: "transparent", border: "none",
                   color: "var(--muted)", cursor: "pointer", fontSize: "0.85rem" }}>
          Back to Results
        </button>
      )}
    </div>
  );

  // ── INTERVIEW ────────────────────────────────────────────────────────────
  if (step === STEPS.INTERVIEW) {
    const q = questions[current];
    const progress = Math.round(((current + (feedback ? 1 : 0)) / questions.length) * 100);

    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "3rem 1.5rem" }}>

        {/* Progress */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
            Question {current + 1} of {questions.length}
          </span>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{domain}</span>
        </div>
        <div style={{ background: "var(--border)", borderRadius: "999px", height: 6, marginBottom: "2rem" }}>
          <div style={{ width: `${progress}%`, height: "100%", borderRadius: "999px",
                        background: "var(--accent)", transition: "width 0.4s ease" }} />
        </div>

        {/* Question card */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: "1rem" }}>
            <span className={`badge badge-${q.difficulty === "Easy" ? "green" : q.difficulty === "Hard" ? "red" : "yellow"}`}>
              {q.difficulty}
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{q.skill}</span>
          </div>
          <p style={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.6 }}>{q.question}</p>
        </div>

        {/* Answer area */}
        {!feedback ? (
          <>
            <textarea
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              rows={5}
              placeholder="Type your answer here..."
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                       borderRadius: "var(--radius)", padding: "0.75rem 1rem", color: "var(--text)",
                       fontSize: "0.9rem", resize: "vertical", lineHeight: 1.6,
                       fontFamily: "inherit", boxSizing: "border-box", marginBottom: "1rem" }}
            />
            {error && <p style={{ color: "var(--red)", marginBottom: "0.75rem", fontSize: "0.85rem" }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-primary" onClick={submitAnswer}
                      disabled={loading || !userAnswer.trim()}
                      style={{ flex: 1, padding: "0.75rem" }}>
                {loading ? "Evaluating..." : "Submit Answer"}
              </button>
              <button onClick={() => { setAnswers(prev => [...prev, { ...q, userAnswer: "", score: 0, feedback: "Skipped", correct: false }]); nextQuestion(); }}
                style={{ padding: "0.75rem 1.2rem", background: "var(--surface)",
                         border: "1px solid var(--border)", borderRadius: "var(--radius)",
                         color: "var(--muted)", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" }}>
                Skip
              </button>
            </div>
          </>
        ) : (
          /* Feedback card */
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <ScoreRing score={feedback.score ?? 0} />
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.95rem",
                            color: (feedback.score ?? 0) >= 50 ? "var(--green)" : "var(--red)" }}>
                  {(feedback.score ?? 0) >= 50 ? "Good answer!" : "Needs improvement"}
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                  {feedback.feedback}
                </p>
              </div>
            </div>

            {feedback.strongPoints && (
              <div style={{ background: "#14532d22", borderRadius: "8px", padding: "0.6rem 0.9rem",
                            marginBottom: "0.5rem" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--green)",
                            marginBottom: "0.2rem" }}>Strong points</p>
                <p style={{ fontSize: "0.82rem", color: "var(--text)" }}>{feedback.strongPoints}</p>
              </div>
            )}

            {feedback.improvements && (
              <div style={{ background: "#450a0a22", borderRadius: "8px", padding: "0.6rem 0.9rem",
                            marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--red)",
                            marginBottom: "0.2rem" }}>Improvements</p>
                <p style={{ fontSize: "0.82rem", color: "var(--text)" }}>{feedback.improvements}</p>
              </div>
            )}

            <details style={{ marginBottom: "1rem" }}>
              <summary style={{ fontSize: "0.82rem", color: "var(--muted)", cursor: "pointer" }}>
                View ideal answer
              </summary>
              <p style={{ fontSize: "0.85rem", color: "var(--text)", marginTop: "0.5rem",
                          lineHeight: 1.6, padding: "0.5rem", background: "var(--bg)",
                          borderRadius: "6px" }}>{q.idealAnswer}</p>
            </details>

            <button className="btn-primary" onClick={nextQuestion} style={{ width: "100%" }}>
              {current + 1 >= questions.length ? "View Report" : "Next Question"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── REPORT ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Interview Complete
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          {answers.filter(a => a.correct).length} of {answers.length} questions answered correctly
        </p>
      </div>

      {/* Overall score */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem",
                                     marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <ScoreRing score={overallScore} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>Overall Score</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {overallScore >= 70 ? "Strong performance! You are well-prepared for this role."
              : overallScore >= 40 ? "Moderate performance. Focus on the weak areas below."
              : "Needs significant improvement. Review the topics and practice more."}
          </p>
        </div>
      </div>

      {/* Weak areas */}
      {weakAreas.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>
            Areas to Improve
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {weakAreas.map((area, i) => (
              <span key={i} className="badge badge-red">{area}</span>
            ))}
          </div>
        </div>
      )}

      {/* Per-question breakdown */}
      <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>
        Question Breakdown
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
        {answers.map((a, i) => (
          <div key={i} className="card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                  {i + 1}. {a.question}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{a.feedback}</p>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <span style={{ fontWeight: 900, fontSize: "1.1rem",
                               color: (a.score ?? 0) >= 50 ? "var(--green)" : "var(--red)" }}>
                  {a.score ?? 0}
                </span>
                <p style={{ fontSize: "0.65rem", color: "var(--muted)" }}>/ 100</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button className="btn-primary" onClick={() => { setStep(STEPS.INTRO); setAnswers([]); }}
                style={{ flex: 1, padding: "0.75rem" }}>
          Retry Interview
        </button>
        {state && (
          <button onClick={() => navigate("/results", { state })}
            style={{ flex: 1, padding: "0.75rem", background: "var(--surface)",
                     border: "1px solid var(--border)", borderRadius: "var(--radius)",
                     color: "var(--text)", cursor: "pointer", fontWeight: 600 }}>
            Back to Results
          </button>
        )}
      </div>
    </div>
  );
}
