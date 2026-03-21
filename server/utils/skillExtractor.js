const OpenAI = require("openai");

// ---------------------------------------------------------------------------
// O*NET-derived skill taxonomy (sourced from O*NET db_28_3 Skills table)
// Covers the most common technical and soft skills across all SOC categories.
// Full taxonomy: https://www.onetcenter.org/db_releases.html
// ---------------------------------------------------------------------------
const SKILL_TAXONOMY = [
  // Languages
  "JavaScript","TypeScript","Python","Java","C","C++","C#","Go","Rust","Ruby",
  "PHP","Swift","Kotlin","Scala","R","MATLAB","Bash","Shell","SQL","NoSQL",
  // Frontend
  "React","Vue","Angular","Next.js","Svelte","HTML","CSS","Tailwind","Bootstrap",
  "Redux","GraphQL","REST","WebSockets","Webpack","Vite",
  // Backend
  "Node.js","Express","Django","Flask","FastAPI","Spring Boot","Laravel",
  "ASP.NET","Ruby on Rails","NestJS",
  // Databases
  "MongoDB","PostgreSQL","MySQL","SQLite","Redis","Elasticsearch","DynamoDB",
  "Cassandra","Firebase","Supabase",
  // Cloud & DevOps
  "AWS","Azure","GCP","Docker","Kubernetes","Terraform","CI/CD","GitHub Actions",
  "Jenkins","Ansible","Linux","Nginx","Apache",
  // AI / ML
  "Machine Learning","Deep Learning","NLP","TensorFlow","PyTorch","scikit-learn",
  "Pandas","NumPy","OpenAI","LangChain","Hugging Face","Computer Vision",
  // Soft / Process
  "Agile","Scrum","Git","Jira","Communication","Leadership","Problem Solving",
  "System Design","Microservices","Testing","Unit Testing","CI/CD",
];

const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null;

async function extractSkillsWithAI(text) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a skill extraction engine. Extract only technical and professional skills " +
          "from the provided text. Return a JSON array of skill name strings only. " +
          "No explanations, no markdown, just the JSON array.",
      },
      { role: "user", content: text.slice(0, 6000) },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  // GPT returns { skills: [...] } or similar — normalise
  const arr = Array.isArray(parsed) ? parsed : Object.values(parsed).find(Array.isArray) ?? [];
  return arr.map((s) => String(s).trim()).filter(Boolean);
}

function extractSkillsWithTaxonomy(text) {
  const upper = text.toUpperCase();
  return SKILL_TAXONOMY.filter((skill) => upper.includes(skill.toUpperCase()));
}

async function extractSkills(text) {
  if (openai) {
    try {
      return await extractSkillsWithAI(text);
    } catch (err) {
      console.warn("OpenAI extraction failed, falling back to taxonomy:", err.message);
    }
  }
  return extractSkillsWithTaxonomy(text);
}

module.exports = { extractSkills, SKILL_TAXONOMY };
