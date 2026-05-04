import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const synth = window.speechSynthesis;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function speak(text, onEnd) {
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
      <path d="M5 10a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V19h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 10z"/>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>
  );
}

function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between",
                    fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.4rem" }}>
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ background: "var(--border)", borderRadius: "999px", height: 6 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "999px",
                      background: "var(--accent)", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

export default function Quiz() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const skills     = state?.resumeSkills ?? state?.jdSkills ?? [];

  const [questions, setQuestions] = useState([]);
  const [idx,       setIdx]       = useState(0);
  const [phase,     setPhase]     = useState("loading");
  const [answer,    setAnswer]    = useState("");
  const [feedback,  setFeedback]  = useState(null);
  const [results,   setResults]   = useState([]);
  const [status,    setStatus]    = useState("");
  const [listening, setListening] = useState(false);

  const recogRef   = useRef(null);
  // These refs hold values that closures inside SpeechRecognition need
  const finalRef   = useRef("");   // committed final text from speech
  const answerRef  = useRef("");   // always mirrors the textarea value

  function updateAnswer(val) {
    answerRef.current = val;
    setAnswer(val);
  }

  // Load questions once
  useEffect(() => {
    if (!skills.length) { navigate("/upload"); return; }
    fetch("/api/analyze/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills, count: 10 }),
    })
      .then(r => r.json())
      .then(d => { setQuestions(d.questions); setPhase("question"); })
      .catch(() => setPhase("error"));
  }, []);

  // New question — reset everything and speak it
  useEffect(() => {
    if (phase !== "question" || !questions[idx]) return;
    finalRef.current  = "";
    answerRef.current = "";
    setAnswer("");
    setFeedback(null);
    setListening(false);
    speak(
      `Question ${idx + 1}. ${questions[idx].question}`,
      () => setStatus("Click Record to speak, or type your answer below.")
    );
  }, [phase, idx]);

  // ── Start recording ──
  function startListening() {
    if (!SR) { setStatus("Speech recognition not supported. Use Chrome."); return; }
    synth.cancel();

    // Seed finalRef with whatever is already typed
    finalRef.current = answerRef.current ? answerRef.current.trimEnd() + " " : "";

    const recog = new SR();
    recog.lang = "en-US";
    recog.continuous = true;
    recog.interimResults = true;
    recogRef.current = recog;

    recog.onstart = () => {
      setListening(true);
      setStatus("Recording — click Stop when done.");
    };

    recog.onresult = (e) => {
      // e.resultIndex = index of the NEWEST result
      // Only process from resultIndex onward to avoid re-processing old finals
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalRef.current += e.results[i][0].transcript + " ";
        }
      }
      // Last result may be interim — show it live but don't commit
      const lastResult = e.results[e.results.length - 1];
      const interim = lastResult.isFinal ? "" : lastResult[0].transcript;
      const display = (finalRef.current + interim).trim();
      // Update textarea live
      answerRef.current = finalRef.current.trim();
      setAnswer(display);
    };

    recog.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setListening(false);
      setStatus("Mic error: " + e.error + ". Try again or type below.");
    };

    recog.onend = () => {
      setListening(false);
      // Commit only the final text (drop any dangling interim)
      const committed = finalRef.current.trim();
      answerRef.current = committed;
      setAnswer(committed);
      setStatus("Done recording. Edit if needed, then click Submit.");
    };

    recog.start();
  }

  // ── Stop recording ──
  function stopListening() {
    recogRef.current?.stop();
  }

  // ── Submit ──
  function handleSubmit() {
    const val = answerRef.current.trim();
    if (!val || listening) return;
    synth.cancel();
    doEvaluate(val);
  }

  async function doEvaluate(ans) {
    setPhase("evaluating");
    const correctAnswer = questions[idx].answer;
    let result;
    try {
      const res = await fetch("/api/analyze/quiz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswer: ans, correctAnswer }),
      });
      result = await res.json();
    } catch {
      result = { correct: false, score: 0 };
    }
    const fb = { ...result, correctAnswer, userAnswer: ans };
    setFeedback(fb);
    setResults(r => [...r, { question: questions[idx].question, ...fb }]);
    setPhase("feedback");
    speak(result.correct ? "Correct! Well done." : `Not quite. The correct answer is: ${correctAnswer}`);
  }

  function next() {
    synth.cancel();
    if (idx + 1 >= questions.length) {
      setPhase("done");
      const total = results.filter(r => r.correct).length + (feedback?.correct ? 1 : 0);
      speak(`Quiz complete! You got ${total} out of ${questions.length} correct.`);
    } else {
      setIdx(i => i + 1);
      setPhase("question");
    }
  }

  // ── Loading / Error ──
  if (phase === "loading") return (
    <div style={{ maxWidth: 700, margin: "4rem auto", textAlign: "center", padding: "2rem" }}>
      <p style={{ color: "var(--muted)" }}>Generating your personalised quiz...</p>
    </div>
  );

  if (phase === "error") return (
    <div style={{ maxWidth: 700, margin: "4rem auto", textAlign: "center", padding: "2rem" }}>
      <p style={{ color: "#ef4444", marginBottom: "1rem" }}>
        Could not load quiz. Make sure the server is running on port 5000.
      </p>
      <button className="btn-primary" onClick={() => navigate("/results", { state })}>Back to Results</button>
    </div>
  );

  // ── Done ──
  if (phase === "done") {
    const correct = results.filter(r => r.correct).length;
    const pct     = Math.round((correct / results.length) * 100);
    const col     = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
    return (
      <div style={{ maxWidth: 750, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div className="card" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Quiz Complete</h1>
          <div style={{ fontSize: "3.5rem", fontWeight: 900, color: col, margin: "1rem 0" }}>{pct}%</div>
          <p style={{ color: "var(--muted)" }}>{correct} / {results.length} correct</p>
          <p style={{ marginTop: "0.5rem", fontWeight: 600 }}>
            {pct >= 70 ? "Great job!" : pct >= 40 ? "Good effort. Review below." : "Keep practising."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button className="btn-primary"
                    onClick={() => { setIdx(0); setResults([]); setFeedback(null); setPhase("question"); }}>
              Retry Quiz
            </button>
            <button style={{ background: "var(--surface)", border: "1px solid var(--border)",
                             borderRadius: "8px", padding: "0.55rem 1.2rem", fontWeight: 600,
                             cursor: "pointer", color: "var(--text)", fontSize: "0.88rem" }}
                    onClick={() => navigate("/results", { state })}>
              Back to Results
            </button>
          </div>
        </div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Review</h2>
        {results.map((r, i) => (
          <div key={i} className="card" style={{ marginBottom: "1rem",
               borderLeft: `4px solid ${r.correct ? "#22c55e" : "#ef4444"}` }}>
            <p style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.4rem" }}>Q{i+1}. {r.question}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.3rem" }}>
              Your answer: <span style={{ color: "var(--text)" }}>{r.userAnswer || "No answer"}</span>
            </p>
            {!r.correct && (
              <p style={{ fontSize: "0.82rem", color: "#86efac" }}>Correct: {r.correctAnswer}</p>
            )}
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: r.correct ? "#22c55e" : "#ef4444" }}>
              {r.correct ? "Correct" : `Incorrect — ${r.score}% match`}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── Active quiz ──
  const q = questions[idx];
  if (!q) return null;
  const canSubmit = answerRef.current.trim().length > 0 && !listening && phase === "question";

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "3rem 1.5rem" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Voice Interview Quiz</h1>
        <button onClick={() => { synth.cancel(); recogRef.current?.stop(); navigate("/results", { state }); }}
                style={{ background: "var(--surface)", border: "1px solid var(--border)",
                         borderRadius: "8px", padding: "0.4rem 0.9rem", fontSize: "0.82rem",
                         color: "var(--muted)", cursor: "pointer" }}>
          Exit
        </button>
      </div>

      <ProgressBar current={idx + 1} total={questions.length} />

      {/* Question */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <span style={{ background: "var(--accent)", color: "#fff", borderRadius: "6px",
                       padding: "0.2rem 0.6rem", fontSize: "0.72rem", fontWeight: 700,
                       display: "inline-block", marginBottom: "0.75rem" }}>
          {q.skill.toUpperCase()}
        </span>
        <p style={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.6 }}>{q.question}</p>
      </div>

      {/* Answer area */}
      {(phase === "question" || phase === "listening") && (
        <div style={{ marginBottom: "1.5rem" }}>

          {/* Record / Stop button */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
            <button
              onClick={listening ? stopListening : startListening}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem",
                       padding: "0.55rem 1.2rem", borderRadius: "8px", border: "none",
                       fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                       background: listening ? "#ef4444" : "var(--accent)", color: "#fff",
                       animation: listening ? "pulse 1.4s infinite" : "none",
                       transition: "background 0.2s" }}>
              {listening ? <StopIcon /> : <MicIcon />}
              {listening ? "Stop Recording" : "Record Answer"}
            </button>
            {listening && (
              <span style={{ fontSize: "0.78rem", color: "#ef4444", fontWeight: 700 }}>● Live</span>
            )}
          </div>

          {/* Answer textarea — voice fills it, user can type/edit */}
          <textarea
            value={answer}
            onChange={e => updateAnswer(e.target.value)}
            rows={5}
            placeholder={listening
              ? "Listening... words appear here as you speak."
              : "Type your answer here, or click Record Answer above to speak..."}
            style={{ width: "100%", background: "var(--bg)", color: "var(--text)",
                     border: `2px solid ${listening ? "#ef4444" : "var(--border)"}`,
                     borderRadius: "10px", padding: "0.85rem 1rem", fontSize: "0.92rem",
                     resize: "vertical", fontFamily: "inherit", lineHeight: 1.7,
                     outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
          />

          {/* Clear + Submit */}
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
            {answer && !listening && (
              <button onClick={() => { finalRef.current = ""; updateAnswer(""); }}
                      style={{ background: "var(--surface)", border: "1px solid var(--border)",
                               borderRadius: "8px", padding: "0.5rem 1rem", fontSize: "0.82rem",
                               color: "var(--muted)", cursor: "pointer" }}>
                Clear
              </button>
            )}
            <button onClick={handleSubmit} disabled={!canSubmit}
                    style={{ background: "var(--accent)", color: "#fff", border: "none",
                             borderRadius: "8px", padding: "0.55rem 1.6rem",
                             fontWeight: 700, fontSize: "0.88rem",
                             cursor: canSubmit ? "pointer" : "not-allowed",
                             opacity: canSubmit ? 1 : 0.4 }}>
              Submit Answer
            </button>
          </div>

          {status && (
            <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.6rem" }}>{status}</p>
          )}
        </div>
      )}

      {phase === "evaluating" && (
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Evaluating...</p>
      )}

      {/* Feedback */}
      {phase === "feedback" && feedback && (
        <div className="card" style={{ marginBottom: "1.5rem",
             borderLeft: `4px solid ${feedback.correct ? "#22c55e" : "#ef4444"}` }}>
          <p style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.5rem",
                      color: feedback.correct ? "#22c55e" : "#ef4444" }}>
            {feedback.correct ? "Correct!" : "Not quite."}
            <span style={{ fontWeight: 400, fontSize: "0.78rem", color: "var(--muted)", marginLeft: "0.5rem" }}>
              ({feedback.score}% keyword match)
            </span>
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
            Your answer: <span style={{ color: "var(--text)" }}>{feedback.userAnswer}</span>
          </p>
          {!feedback.correct && (
            <>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.35rem" }}>Correct answer:</p>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "#86efac" }}>{feedback.correctAnswer}</p>
            </>
          )}
          <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={next}>
            {idx + 1 >= questions.length ? "See Results" : "Next Question"}
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 #ef444450; }
          70%  { box-shadow: 0 0 0 10px #ef444400; }
          100% { box-shadow: 0 0 0 0 #ef444400; }
        }
      `}</style>
    </div>
  );
}
