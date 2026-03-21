// ---------------------------------------------------------------------------
// Salary ranges in INR LPA (Lakhs Per Annum) — Indian tech market rates
// Sources: AmbitionBox, Glassdoor India, Naukri salary insights 2024
// ---------------------------------------------------------------------------
const DOMAIN_SALARY_LPA = {
  Frontend:  { min: 4,  max: 22 },
  Backend:   { min: 5,  max: 28 },
  Database:  { min: 4.5, max: 20 },
  DevOps:    { min: 6,  max: 32 },
  AI:        { min: 8,  max: 40 },
  General:   { min: 3.5, max: 15 },
};

const DOMAIN_BUCKETS = {
  Frontend: ["React","Vue","Angular","Next.js","Svelte","HTML","CSS","Tailwind","Redux","TypeScript","JavaScript"],
  Backend:  ["Node.js","Express","Django","Flask","FastAPI","Spring Boot","Python","Java","Go","Ruby"],
  Database: ["MongoDB","PostgreSQL","MySQL","Redis","SQL","DynamoDB","Firebase"],
  DevOps:   ["Docker","Kubernetes","AWS","Azure","GCP","Terraform","CI/CD","Linux","Nginx"],
  AI:       ["Machine Learning","Deep Learning","NLP","TensorFlow","PyTorch","scikit-learn","OpenAI","LangChain"],
};

function detectDomain(skills) {
  const counts = {};
  for (const [domain, bucket] of Object.entries(DOMAIN_BUCKETS)) {
    counts[domain] = skills.filter((s) =>
      bucket.some((b) => b.toLowerCase() === s.toLowerCase())
    ).length;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 ? top[0] : "General";
}

/**
 * estimateSalary
 * Returns INR LPA salary range.
 * candidateRange = where the candidate sits NOW based on matched skills.
 * roleRange      = full band for the role.
 *
 * Formula:
 *   matchRatio = matched JD skills / total JD skills
 *   candidateMin = roleMin + (roleMax - roleMin) * matchRatio * 0.5
 *   candidateMax = roleMin + (roleMax - roleMin) * min(matchRatio + 0.2, 1)
 */
function estimateSalary(resumeSkills, jdSkills) {
  const domain = detectDomain(jdSkills);
  const range  = DOMAIN_SALARY_LPA[domain];
  const have   = new Set(resumeSkills.map((s) => s.toLowerCase()));

  const matched    = jdSkills.filter((s) => have.has(s.toLowerCase())).length;
  const matchRatio = jdSkills.length ? matched / jdSkills.length : 0;

  const candidateMin = +(range.min + (range.max - range.min) * matchRatio * 0.5).toFixed(1);
  const candidateMax = +(range.min + (range.max - range.min) * Math.min(matchRatio + 0.2, 1)).toFixed(1);

  return {
    domain,
    roleRange:      { min: range.min,     max: range.max },
    candidateRange: { min: candidateMin,  max: candidateMax },
    currency: "INR",
    unit: "LPA",
    matchRatio: Math.round(matchRatio * 100),
  };
}

// ---------------------------------------------------------------------------
// Resume Score  (0 – 100)  — correct weighted formula
//
//  60 pts  Skill coverage   = matched JD skills / total JD skills
//  25 pts  Domain depth     = resume skills in JD's primary domain / domain size (cap 8)
//  15 pts  Breadth bonus    = unique domains covered in resume (cap 4 domains)
//
// This ensures score directly reflects how well the resume matches THIS JD.
// ---------------------------------------------------------------------------
function scoreResume(resumeSkills, jdSkills) {
  const have = new Set(resumeSkills.map((s) => s.toLowerCase()));

  // 1. Coverage — core metric
  const matched  = jdSkills.length
    ? jdSkills.filter((s) => have.has(s.toLowerCase())).length
    : 0;
  const coverage = jdSkills.length ? matched / jdSkills.length : 0;

  // 2. Domain depth — how deep is the candidate in the JD's primary domain
  const domain       = detectDomain(jdSkills);
  const domainBucket = DOMAIN_BUCKETS[domain] ?? [];
  const depthRaw     = domainBucket.filter((s) => have.has(s.toLowerCase())).length;
  const depth        = Math.min(depthRaw / 8, 1); // cap at 8 skills

  // 3. Breadth — how many distinct domains the resume covers
  const domainsHit = Object.values(DOMAIN_BUCKETS).filter((b) =>
    b.some((s) => have.has(s.toLowerCase()))
  ).length;
  const breadth = Math.min(domainsHit / 4, 1); // cap at 4 domains

  const score = Math.round(coverage * 60 + depth * 25 + breadth * 15);

  const grade =
    score >= 85 ? "A" :
    score >= 70 ? "B" :
    score >= 55 ? "C" :
    score >= 40 ? "D" : "F";

  const feedback =
    score >= 85 ? "Excellent match! You are highly qualified for this role." :
    score >= 70 ? "Strong match. A few skill gaps to bridge." :
    score >= 55 ? "Moderate match. Focus on the top-priority skills in your roadmap." :
    score >= 40 ? "Partial match. Significant upskilling needed." :
                  "Low match. Consider building foundational skills first.";

  return {
    score,
    grade,
    feedback,
    breakdown: {
      matched,
      total:      jdSkills.length,
      coverage:   Math.round(coverage * 100),
      depthRaw,
      domainsHit,
    },
  };
}

// ---------------------------------------------------------------------------
// Interview tips per domain
// ---------------------------------------------------------------------------
const INTERVIEW_TIPS = {
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

function getInterviewTips(jdSkills) {
  const domain = detectDomain(jdSkills);
  return { domain, tips: INTERVIEW_TIPS[domain] ?? INTERVIEW_TIPS.General };
}

module.exports = { estimateSalary, scoreResume, getInterviewTips, detectDomain };
