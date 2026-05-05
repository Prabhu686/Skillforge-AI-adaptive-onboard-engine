import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SYSTEM_INTRO = (domain, skills) =>
  `Hi! I'm your AI interviewer for the **${domain}** domain. I'll ask you technical questions one by one based on your skill profile${skills.length ? ` (${skills.slice(0, 4).join(", ")}${skills.length > 4 ? "…" : ""})` : ""}.\n\nType your answer and press **Send** — I'll give you instant feedback and move to the next question. Let's begin! 🚀`;

const QUESTION_BANK = {
  Frontend:  ["What is the virtual DOM and why does React use it?","Explain closures in JavaScript with an example.","What is the difference between flexbox and CSS grid?","What are React hooks and why were they introduced?","Explain event delegation in JavaScript.","What is the difference between == and === in JavaScript?","How does the browser render a webpage?"],
  Backend:   ["What is the event loop in Node.js?","How do you handle errors in Express middleware?","Explain the difference between REST and GraphQL.","What is JWT and how does authentication work with it?","What is the N+1 query problem and how do you fix it?","Explain database indexing and when to use it.","What is the difference between SQL and NoSQL?"],
  Database:  ["What is the difference between INNER JOIN and LEFT JOIN?","What are ACID properties in a database?","Explain database normalization.","What is a database index and how does it work?","When would you use NoSQL over SQL?","What is a transaction and why is it important?","Explain the CAP theorem."],
  DevOps:    ["What is the difference between a Docker image and a container?","Explain the stages of a CI/CD pipeline.","What are Kubernetes Pods and Deployments?","What is Infrastructure as Code?","Explain the difference between Docker and a VM.","What is a load balancer and when do you use one?","What is blue-green deployment?"],
  AI:        ["What is overfitting and how do you prevent it?","Explain the bias-variance trade-off.","What is backpropagation in neural networks?","What is the attention mechanism in transformers?","Explain the difference between supervised and unsupervised learning.","What metrics would you use to evaluate a classification model?","What is gradient descent?"],
  General:   ["What is Big-O notation? Give examples.","When would you use a hash map vs an array?","Explain the difference between synchronous and asynchronous code.","What is the difference between authentication and authorisation?","How would you design a URL shortener?","What is REST API?","Explain object-oriented programming principles."],
};

const IDEAL = {
  // Frontend
  "What is the virtual DOM and why does React use it?": "The virtual DOM is an in-memory copy of the real DOM. React uses it to compute the minimal set of changes needed before updating the actual DOM, improving performance.",
  "Explain closures in JavaScript with an example.": "A closure is a function that retains access to its outer scope variables after the outer function has returned. Example: function counter() { let n=0; return () => ++n; }",
  "What is the difference between flexbox and CSS grid?": "Flexbox is one-dimensional (row or column). Grid is two-dimensional (rows and columns). Use flexbox for component-level layout, grid for page-level layout.",
  "What are React hooks and why were they introduced?": "Hooks like useState and useEffect let functional components use state and lifecycle features without writing class components, simplifying code.",
  "Explain event delegation in JavaScript.": "Event delegation attaches a single event listener to a parent element instead of each child. Events bubble up from the target to the parent, where you check event.target to identify the source.",
  "What is the difference between == and === in JavaScript?": "== compares values with type coercion (e.g. '5' == 5 is true). === compares both value and type strictly (e.g. '5' === 5 is false). Always prefer ===.",
  "How does the browser render a webpage?": "The browser parses HTML into a DOM tree, CSS into a CSSOM, combines them into a render tree, performs layout to calculate positions, then paints pixels to the screen.",
  // Backend
  "What is the event loop in Node.js?": "The event loop allows Node.js to perform non-blocking I/O by offloading operations to the OS and executing callbacks when they complete, on a single thread.",
  "How do you handle errors in Express middleware?": "Use a 4-parameter middleware (err, req, res, next) placed after all routes. Call next(err) from any route to pass errors to it.",
  "Explain the difference between REST and GraphQL.": "REST uses fixed endpoints per resource. GraphQL uses a single endpoint where clients specify exactly the data they need, reducing over-fetching.",
  "What is JWT and how does authentication work with it?": "JWT is a signed token containing a payload. The server issues it on login; the client sends it in the Authorization header; the server verifies the signature.",
  "What is the N+1 query problem and how do you fix it?": "N+1 occurs when fetching a list runs 1 query then N more queries for each item's related data. Fix it using eager loading (JOIN or include) to fetch everything in one query.",
  "Explain database indexing and when to use it.": "An index is a data structure (usually B-tree) that speeds up lookups at the cost of extra storage and slower writes. Use it on columns frequently used in WHERE, JOIN, or ORDER BY clauses.",
  "What is the difference between SQL and NoSQL?": "SQL databases are relational with fixed schemas and ACID transactions, ideal for structured data. NoSQL databases are schema-flexible, scale horizontally, and suit unstructured or rapidly changing data.",
  // Database
  "What is the difference between INNER JOIN and LEFT JOIN?": "INNER JOIN returns only rows with matches in both tables. LEFT JOIN returns all rows from the left table with NULLs where there is no match on the right.",
  "What are ACID properties in a database?": "Atomicity, Consistency, Isolation, Durability — they guarantee that database transactions are processed reliably even in case of errors or crashes.",
  "Explain database normalization.": "Normalization organizes a database to reduce redundancy and improve integrity. It involves splitting tables into smaller ones and defining relationships, following normal forms (1NF, 2NF, 3NF).",
  "What is a database index and how does it work?": "An index creates a sorted data structure on a column so the database can find rows without scanning the entire table, similar to a book's index. Trade-off: faster reads, slower writes.",
  "When would you use NoSQL over SQL?": "Use NoSQL when you need flexible schemas, horizontal scaling, or are storing unstructured data like documents, key-value pairs, or time-series data. SQL is better for complex queries and strict consistency.",
  "What is a transaction and why is it important?": "A transaction is a sequence of operations treated as a single unit — either all succeed (commit) or all fail (rollback). It ensures data integrity using ACID properties.",
  "Explain the CAP theorem.": "CAP theorem states a distributed system can only guarantee two of three: Consistency (all nodes see the same data), Availability (every request gets a response), Partition tolerance (system works despite network splits).",
  // DevOps
  "What is the difference between a Docker image and a container?": "An image is a read-only template with the app and its dependencies. A container is a running instance of that image with its own isolated filesystem.",
  "Explain the stages of a CI/CD pipeline.": "Typical stages: Source (code commit triggers pipeline), Build (compile/package), Test (run automated tests), Deploy to staging, then Deploy to production. Each stage gates the next.",
  "What are Kubernetes Pods and Deployments?": "A Pod is the smallest deployable unit in Kubernetes, containing one or more containers. A Deployment manages a set of identical Pods, handling rolling updates and self-healing.",
  "What is Infrastructure as Code?": "IaC means managing and provisioning infrastructure through code (e.g. Terraform, CloudFormation) instead of manual processes, enabling version control, repeatability, and automation.",
  "Explain the difference between Docker and a VM.": "A VM virtualizes the entire OS including the kernel, making it heavy. Docker containers share the host OS kernel and only isolate the application layer, making them lightweight and faster to start.",
  "What is a load balancer and when do you use one?": "A load balancer distributes incoming traffic across multiple servers to prevent overload, improve availability, and enable horizontal scaling. Use it when a single server cannot handle all traffic.",
  "What is blue-green deployment?": "Blue-green deployment runs two identical environments (blue = live, green = new version). Traffic is switched to green after testing. If issues arise, you instantly roll back to blue with zero downtime.",
  // AI
  "What is overfitting and how do you prevent it?": "Overfitting is when a model memorises training data including noise and performs poorly on new data. Prevent it with regularisation, dropout, cross-validation, and more training data.",
  "Explain the bias-variance trade-off.": "Bias is error from wrong assumptions (underfitting). Variance is error from sensitivity to training data (overfitting). The trade-off is finding the right model complexity that minimises both.",
  "What is backpropagation in neural networks?": "Backpropagation calculates the gradient of the loss function with respect to each weight by applying the chain rule backward through the network, enabling gradient descent to update weights.",
  "What is the attention mechanism in transformers?": "Attention allows the model to weigh the relevance of each token to every other token in the sequence, computing a weighted sum of values. This replaces sequential processing with parallel context-aware representations.",
  "Explain the difference between supervised and unsupervised learning.": "Supervised learning trains on labelled data to predict outputs (e.g. classification). Unsupervised learning finds patterns in unlabelled data (e.g. clustering, dimensionality reduction).",
  "What metrics would you use to evaluate a classification model?": "Accuracy, Precision (TP/TP+FP), Recall (TP/TP+FN), F1-score (harmonic mean of precision and recall), and AUC-ROC. Use F1 and AUC when classes are imbalanced.",
  "What is gradient descent?": "Gradient descent is an optimization algorithm that iteratively adjusts model weights in the direction of the negative gradient of the loss function to minimize error. Learning rate controls step size.",
  // General
  "What is Big-O notation? Give examples.": "Big-O describes the upper bound of an algorithm's time or space complexity as input grows. O(1) is constant, O(log n) is logarithmic, O(n) is linear, O(n²) is quadratic.",
  "When would you use a hash map vs an array?": "Use a hash map for O(1) average key-based lookups, insertions, and deletions. Use an array for ordered data, index-based access, or when memory efficiency and iteration speed matter.",
  "Explain the difference between synchronous and asynchronous code.": "Synchronous code executes line by line, blocking until each operation completes. Asynchronous code allows other operations to run while waiting (e.g. I/O), using callbacks, promises, or async/await.",
  "What is the difference between authentication and authorisation?": "Authentication verifies who you are (e.g. login with password). Authorisation determines what you are allowed to do (e.g. admin vs user permissions). Authentication always comes first.",
  "How would you design a URL shortener?": "Generate a unique short code (base62 encoding of an auto-increment ID), store the mapping in a database indexed on the short code, add a Redis cache for hot URLs, and use a load balancer for scale.",
  "What is REST API?": "REST is an architectural style using standard HTTP methods — GET (read), POST (create), PUT (update), DELETE (remove) — on resources identified by URLs, with stateless communication.",
  "Explain object-oriented programming principles.": "OOP has four pillars: Encapsulation (bundling data and methods), Inheritance (child class reuses parent), Polymorphism (same interface, different behaviour), Abstraction (hiding implementation details).",
};

function scoreAnswer(ideal, user) {
  const keywords = ideal.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 3);
  const u = user.toLowerCase();
  const hits = keywords.filter(k => u.includes(k)).length;
  return keywords.length ? Math.min(Math.round((hits / keywords.length) * 100), 100) : 50;
}

function getFeedback(score, ideal) {
  if (score >= 75) return { label: "Great answer! ✅", color: "var(--green)", tip: null };
  if (score >= 45) return { label: "Partially correct 🟡", color: "var(--yellow)", tip: `💡 Missing point: ${ideal.split(".")[0]}.` };
  return { label: "Needs improvement ❌", color: "var(--red)", tip: `✅ Correct answer: ${ideal}` };
}

function Bubble({ msg }) {
  const isAI = msg.role === "ai";
  return (
    <div style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end", marginBottom: "1rem" }}>
      {isAI && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", fontWeight: 800, color: "#fff", flexShrink: 0,
                      marginRight: "0.6rem", marginTop: "2px" }}>AI</div>
      )}
      <div style={{
        maxWidth: "75%", padding: "0.75rem 1rem", borderRadius: isAI ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isAI ? "var(--surface)" : "var(--accent)",
        border: isAI ? "1px solid var(--border)" : "none",
        color: "var(--text)", fontSize: "0.9rem", lineHeight: 1.6,
      }}>
        {msg.text.split("**").map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
        {msg.score != null && (
          <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
            <span style={{ fontWeight: 700, color: msg.scoreColor, fontSize: "0.85rem" }}>
              Score: {msg.score}/100 — {msg.scoreLabel}
            </span>
            {msg.tip && (
              <div style={{ marginTop: "0.4rem", padding: "0.5rem 0.75rem",
                            background: msg.score < 45 ? "#450a0a44" : "#451a0344",
                            borderRadius: "6px", borderLeft: `3px solid ${msg.score < 45 ? "var(--red)" : "var(--yellow)"}` }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{msg.tip}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Interview() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const domain     = state?.salary?.domain ?? "General";
  const skills     = state?.resumeSkills ?? [];

  const questions  = useRef([...(QUESTION_BANK[domain] ?? QUESTION_BANK.General)].sort(() => Math.random() - 0.5));
  const qIndex     = useRef(0);

  const [messages, setMessages] = useState([
    { role: "ai", text: SYSTEM_INTRO(domain, skills) },
    { role: "ai", text: `**Question 1:** ${questions.current[0]}` },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function pushMsg(msg) { setMessages(prev => [...prev, msg]); }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    pushMsg({ role: "user", text });

    const q = questions.current[qIndex.current];
    const ideal = IDEAL[q] ?? "Focus on the core concept with a clear explanation and example.";
    const score = scoreAnswer(ideal, text);
    const { label, color, tip } = getFeedback(score, ideal);

    // small delay for natural feel
    await new Promise(r => setTimeout(r, 600));

    pushMsg({ role: "ai", text: score >= 75 ? "Well done! 🎯" : score >= 45 ? "Good attempt!" : "Let me help you with that.", score, scoreColor: color, scoreLabel: label, tip });

    qIndex.current += 1;
    const next = questions.current[qIndex.current];

    await new Promise(r => setTimeout(r, 400));

    if (next) {
      pushMsg({ role: "ai", text: `**Question ${qIndex.current + 1}:** ${next}` });
    } else {
      pushMsg({ role: "ai", text: "That's all the questions! 🎉 Great session. Click **View Report** to see your full performance summary." });
      setDone(true);
    }

    setLoading(false);
    textareaRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const scores = messages.filter(m => m.score != null).map(m => m.score);
  const overall = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", maxWidth: 780, margin: "0 auto", padding: "0 1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "1rem 0 0.75rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>AI Mock Interview</span>
          <span style={{ marginLeft: "0.75rem", fontSize: "0.78rem", color: "var(--muted)" }}>{domain}</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {scores.length > 0 && (
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              Avg: <strong style={{ color: overall >= 70 ? "var(--green)" : overall >= 40 ? "var(--yellow)" : "var(--red)" }}>{overall}</strong>/100
            </span>
          )}
          {state && (
            <button onClick={() => navigate("/results", { state })}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                       color: "var(--muted)", cursor: "pointer", fontSize: "0.8rem", padding: "0.35rem 0.8rem", fontWeight: 600 }}>
              ← Results
            </button>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0" }}>
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: 800, color: "#fff" }}>AI</div>
            <div style={{ display: "flex", gap: "4px" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--muted)",
                                      animation: `bounce 1s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 0 1rem", flexShrink: 0 }}>
        {done ? (
          <button className="btn-primary" style={{ width: "100%", padding: "0.85rem", fontSize: "1rem" }}
                  onClick={() => navigate("/results", { state })}>
            View Report →
          </button>
        ) : (
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
              style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)",
                       borderRadius: "var(--radius)", padding: "0.7rem 1rem", color: "var(--text)",
                       fontSize: "0.9rem", resize: "none", lineHeight: 1.5, fontFamily: "inherit" }}
            />
            <button className="btn-primary" onClick={send} disabled={loading || !input.trim()}
                    style={{ padding: "0.7rem 1.2rem", flexShrink: 0, height: "fit-content" }}>
              Send ↑
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
