// ---------------------------------------------------------------------------
// Curated free resources per skill (YouTube + Coursera + Docs)
// Extend this map as the skill taxonomy grows.
// ---------------------------------------------------------------------------
const RESOURCES = {
  React:            { youtube: "https://youtu.be/SqcY0GlETPk", course: "https://www.coursera.org/learn/react-basics" },
  "Node.js":        { youtube: "https://youtu.be/fBNz5xF-Kx4", course: "https://www.coursera.org/learn/server-side-nodejs" },
  TypeScript:       { youtube: "https://youtu.be/BwuLxPH8IDs", course: "https://www.coursera.org/learn/typescript" },
  Python:           { youtube: "https://youtu.be/rfscVS0vtbw", course: "https://www.coursera.org/learn/python" },
  "Machine Learning":{ youtube: "https://youtu.be/NWONeJKn6kc", course: "https://www.coursera.org/learn/machine-learning" },
  Docker:           { youtube: "https://youtu.be/fqMOX6JJhGo", course: "https://www.coursera.org/learn/docker-for-developers" },
  AWS:              { youtube: "https://youtu.be/ulprqHHWlng", course: "https://www.coursera.org/learn/aws-fundamentals" },
  SQL:              { youtube: "https://youtu.be/HXV3zeQKqGY", course: "https://www.coursera.org/learn/sql-for-data-science" },
  MongoDB:          { youtube: "https://youtu.be/ofme2o29ngU", course: "https://learn.mongodb.com/learning-paths/introduction-to-mongodb" },
  Kubernetes:       { youtube: "https://youtu.be/X48VuDVv0do", course: "https://www.coursera.org/learn/google-kubernetes-engine" },
  GraphQL:          { youtube: "https://youtu.be/ed8SzALpx1Q", course: "https://www.howtographql.com" },
  "System Design":  { youtube: "https://youtu.be/i53Gi_K3o7I", course: "https://www.educative.io/courses/grokking-the-system-design-interview" },
};

const DEFAULT_RESOURCES = {
  youtube: "https://www.youtube.com/results?search_query=learn+",
  course:  "https://www.coursera.org/search?query=",
};

// ---------------------------------------------------------------------------
// Level assignment
// A candidate is "Intermediate" if they already know ≥3 related skills,
// "Advanced" if they know ≥6. Otherwise "Beginner".
// "Related" = same domain bucket.
// ---------------------------------------------------------------------------
const DOMAIN_BUCKETS = {
  Frontend:  ["React","Vue","Angular","Next.js","Svelte","HTML","CSS","Tailwind","Redux","TypeScript","JavaScript"],
  Backend:   ["Node.js","Express","Django","Flask","FastAPI","Spring Boot","Python","Java","Go","Ruby"],
  Database:  ["MongoDB","PostgreSQL","MySQL","Redis","SQL","DynamoDB","Firebase"],
  DevOps:    ["Docker","Kubernetes","AWS","Azure","GCP","Terraform","CI/CD","Linux","Nginx"],
  AI:        ["Machine Learning","Deep Learning","NLP","TensorFlow","PyTorch","scikit-learn","OpenAI","LangChain"],
};

function assignLevel(skill, resumeSkills) {
  const haveSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const bucket  = Object.values(DOMAIN_BUCKETS).find((b) =>
    b.some((s) => s.toLowerCase() === skill.toLowerCase())
  ) ?? [];
  const overlap = bucket.filter((s) => haveSet.has(s.toLowerCase())).length;
  if (overlap >= 6) return "Advanced";
  if (overlap >= 3) return "Intermediate";
  return "Beginner";
}

function stepsFor(skill, level) {
  const base = [
    `Understand core concepts of ${skill}`,
    `Follow an official ${skill} tutorial or documentation`,
    `Build a small project using ${skill}`,
  ];
  if (level === "Intermediate") {
    base.push(`Integrate ${skill} into a full-stack or production-like project`);
    base.push(`Study common ${skill} design patterns and best practices`);
  }
  if (level === "Advanced") {
    base.push(`Contribute to an open-source ${skill} project`);
    base.push(`Architect a scalable system using ${skill}`);
    base.push(`Mentor others and conduct code reviews involving ${skill}`);
  }
  return base;
}

function resourcesFor(skill) {
  const entry = RESOURCES[skill];
  if (entry) return entry;
  const encoded = encodeURIComponent(skill);
  return {
    youtube: DEFAULT_RESOURCES.youtube + encoded,
    course:  DEFAULT_RESOURCES.course  + encoded,
  };
}

// ---------------------------------------------------------------------------
// Skill priority score
// Higher = learn this first. Formula: importance weight × difficulty multiplier.
// Importance: how often the skill appears across O*NET SOC codes (approximated).
// Difficulty: Beginner=1, Intermediate=1.5, Advanced=2 (more effort needed).
// ---------------------------------------------------------------------------
const SKILL_IMPORTANCE = {
  Python: 9, JavaScript: 9, SQL: 9, "Machine Learning": 8, AWS: 8,
  React: 8, Docker: 8, TypeScript: 7, "Node.js": 7, Kubernetes: 7,
  PostgreSQL: 7, Git: 7, "System Design": 8, GraphQL: 6, MongoDB: 6,
};
const DIFFICULTY_WEIGHT = { Beginner: 1, Intermediate: 1.5, Advanced: 2 };

function priorityScore(skill, level) {
  const importance = SKILL_IMPORTANCE[skill] ?? 5;
  return importance * (DIFFICULTY_WEIGHT[level] ?? 1);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
function generateRoadmap(missingSkills, resumeSkills = []) {
  return missingSkills
    .map((skill) => {
      const level    = assignLevel(skill, resumeSkills);
      const priority = priorityScore(skill, level);
      return {
        skill,
        level,
        priority,
        reason: `"${skill}" is required by the job description but not found in your resume.`,
        steps:  stepsFor(skill, level),
        resources: resourcesFor(skill),
      };
    })
    .sort((a, b) => b.priority - a.priority); // highest priority first
}

module.exports = { generateRoadmap };
