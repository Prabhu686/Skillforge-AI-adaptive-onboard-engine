#  SkillForge – AI Adaptive Onboarding Engine

Upload a resume and a job description. Get your skill gap, INR salary estimate,
resume score, and a personalised learning roadmap — instantly.

---

## Tech Stack

| Layer          | Technology                                              |
|----------------|---------------------------------------------------------|
| Frontend       | React 18 + Vite · 5 pages · react-router-dom            |
| Backend        | Node.js + Express                                       |
| AI / NLP       | OpenAI `gpt-4o-mini` · O\*NET db\_28\_3 taxonomy fallback |
| Datasets       | Kaggle Resume Dataset · O\*NET db\_28\_3 · Kaggle Jobs   |
| Container      | Docker (multi-stage build)                              |
| Python layer   | pandas · scikit-learn (metrics & validation)            |
| Deploy         | Client → Vercel · Server → Render                       |

---

## Project Structure

```
skillforge-ai/
├── client/
│   └── src/
│       ├── api/
│       │   └── analyze.js          # fetch wrapper (POST /api/analyze)
│       ├── components/
│       │   ├── Navbar.jsx           # sticky nav across all pages
│       │   └── RoadmapCard.jsx      # per-skill card with level + priority
│       └── pages/
│           ├── Landing.jsx          # / — hero, how it works, features
│           ├── Upload.jsx           # /upload — drag-and-drop resume + JD
│           ├── Results.jsx          # /results — score, salary, gap, roadmap
│           ├── Compare.jsx          # /compare — side-by-side resume comparison
│           └── Tips.jsx             # /tips — domain interview prep tips
│
├── server/
│   ├── routes/analyze.js            # POST / and POST /compare
│   ├── controllers/analyzeController.js
│   └── utils/
│       ├── parser.js                # PDF / plain-text extraction
│       ├── skillExtractor.js        # OpenAI or O*NET taxonomy keyword match
│       ├── skillGap.js              # gap engine (case-insensitive set diff)
│       ├── roadmap.js               # adaptive roadmap + priority ranking
│       └── insights.js             # resume score · INR salary · interview tips
│
├── data/                            # Python — dataset loaders & metrics
│   ├── datasets.py
│   ├── metrics.py
│   └── validate.py
│
├── tests/
│   └── test_metrics.py
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## Pages

| Route      | Page              | What it shows                                                  |
|------------|-------------------|----------------------------------------------------------------|
| `/`        | Landing           | Hero, 4-step How It Works, 6-feature grid, CTA                 |
| `/upload`  | Upload            | Drag-and-drop resume + JD (PDF or TXT), Analyse button         |
| `/results` | Results           | Score ring, INR salary, coverage bar, matched/missing skills, priority roadmap, PDF export, interview tips link |
| `/compare` | Resume Comparator | Upload 2 resumes + 1 JD → side-by-side score rings, salary, matched/missing, winner badge |
| `/tips`    | Interview Tips    | Domain-specific tips (auto-selected from analysis) + universal tips |

---

## Quick Start (Local)

### Prerequisites
- Node.js ≥ 20
- Python ≥ 3.11 (metrics layer only)

### 1 — Server
```powershell
cd server
copy .env.example .env      # add OPENAI_API_KEY (optional)
npm install
npm run dev                 # http://localhost:5000
```

### 2 — Client
```powershell
cd client
npm install
npm run dev                 # http://localhost:5173
```

### 3 — Python metrics (optional)
```bash
pip install -r requirements.txt
python -m data.validate --resume path/to/resume.csv --jobs path/to/jobs.csv
```

---

## Docker (Production)

```bash
docker build -t skillforge .
docker run -p 5000:5000 -e OPENAI_API_KEY=sk-... skillforge
# Open http://localhost:5000
```

---

## How It Works

```
[ Upload Resume + JD ]
        ↓
[ PDF → plain text ]        pdf-parse
        ↓
[ Skill Extraction ]        OpenAI gpt-4o-mini  OR  O*NET taxonomy keyword match
        ↓
[ Skill Gap Engine ]        matchedSkills = JD ∩ resume  |  missing = JD − resume
        ↓
[ Resume Score ]            60% coverage + 25% domain depth + 15% breadth  →  0–100 + A–F
        ↓
[ Salary Estimate ]         INR LPA range based on domain + match ratio
        ↓
[ Adaptive Roadmap ]        level = f(related skills in resume)  |  sorted by priority score
        ↓
[ Results UI ]              score ring · salary card · coverage bar · skill pills · roadmap cards
```

---

## Skill Gap Engine (`server/utils/skillGap.js`)

```js
function findGap(resumeSkills, jdSkills) {
  const have = new Set(resumeSkills.map(s => s.toLowerCase()));
  return jdSkills.filter(s => !have.has(s.toLowerCase()));
}
```

---

## Resume Score Formula (`server/utils/insights.js`)

| Component      | Weight | Formula                                          |
|----------------|--------|--------------------------------------------------|
| Coverage       | 60 pts | matched JD skills / total JD skills              |
| Domain depth   | 25 pts | resume skills in JD's primary domain / 8 (cap)   |
| Breadth bonus  | 15 pts | unique domains covered in resume / 4 (cap)        |

Grade bands: A ≥ 85 · B ≥ 70 · C ≥ 55 · D ≥ 40 · F < 40

---

## Salary Estimate (`server/utils/insights.js`)

Salary is in **INR LPA** (Lakhs Per Annum), sourced from AmbitionBox / Glassdoor India 2024:

| Domain   | Role Band (LPA) |
|----------|-----------------|
| Frontend | ₹4 – 22         |
| Backend  | ₹5 – 28         |
| Database | ₹4.5 – 20       |
| DevOps   | ₹6 – 32         |
| AI / ML  | ₹8 – 40         |
| General  | ₹3.5 – 15       |

Candidate range = role band scaled by `matchRatio` (matched JD skills / total JD skills).

---

## Adaptive Level Assignment (`server/utils/roadmap.js`)

| Related skills already in resume | Assigned level |
|----------------------------------|----------------|
| 0 – 2                            | Beginner       |
| 3 – 5                            | Intermediate   |
| 6 +                              | Advanced       |

Roadmap is sorted by **priority score** = `skill importance × difficulty weight`
so the highest-impact skills always appear first.

---

## Public Datasets Used

| Dataset | Source | License | Used For |
|---------|--------|---------|----------|
| Resume Dataset | [Kaggle – snehaanbhawal](https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset/data) | CC BY 4.0 | Skill extraction & role classification |
| O\*NET db\_28\_3 | [O\*NET Resource Center](https://www.onetcenter.org/db_releases.html) | Public Domain (US DoL) | Skill taxonomy, proficiency benchmarks |
| Jobs & Job Description | [Kaggle – kshitizregmi](https://www.kaggle.com/datasets/kshitizregmi/jobs-and-job-description) | CC BY 4.0 | Gap analysis & roadmap generation |

---

## Internal Validation Metrics

| Metric            | Definition                                                        |
|-------------------|-------------------------------------------------------------------|
| `precision`       | TP / (TP + FP) for extracted skills vs. labelled ground truth     |
| `recall`          | TP / (TP + FN) for extracted skills vs. labelled ground truth     |
| `f1`              | Harmonic mean of precision and recall                             |
| `accuracy`        | Fraction of correctly classified resume roles                     |
| `macro_f1`        | Unweighted mean F1 across all role classes                        |
| `mae`             | Mean Absolute Error of skill importance vs. O\*NET (scale 1–5)   |
| `nmae`            | Normalised MAE — 0 = perfect, 1 = worst                          |
| `coverage_ratio`  | Fraction of required skills covered by the learning path          |
| `redundancy_rate` | Fraction of duplicate items in the learning path                  |
| `completeness`    | Fraction of dataset rows with no missing values                   |
| `imbalance_ratio` | max class frequency / min class frequency                         |

```bash
python -m data.validate --resume data/resume.csv --jobs data/jobs.csv
```

---

## Deploy

### Vercel (client)
```bash
cd client
npm run build
# Vercel settings: root = /client · build = npm run build · output = dist
```

### Render (server)
- Root directory: `/server`
- Build command: `npm install`
- Start command: `node index.js`
- Environment variables: `OPENAI_API_KEY`, `CLIENT_URL`

---

## Demo Flow (2–3 min)

1. Open `/` — show the landing page and features
2. Click **Get Started** → upload a resume PDF + job description PDF → click **Analyse**
3. Show the score ring (grade), INR salary card, coverage bar
4. Scroll through the priority-ranked roadmap cards (Beginner / Intermediate / Advanced)
5. Click **Interview Tips** → show domain-specific prep tips
6. Go back, upload a different resume → show different score → proves "adaptive"
7. Navigate to **Compare** → upload two resumes → show side-by-side winner
