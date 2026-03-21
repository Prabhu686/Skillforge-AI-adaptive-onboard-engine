const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, TabStopType, TabStopLeader,
  HeadingLevel, UnderlineType, ShadingType,
} = require("docx");

// ── helpers ────────────────────────────────────────────────────────────────
const NONE_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS  = { top: NONE_BORDER, bottom: NONE_BORDER, left: NONE_BORDER, right: NONE_BORDER };

function sectionHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, font: "Times New Roman" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
    spacing: { before: 160, after: 60 },
  });
}

function bold(text, size = 20) {
  return new TextRun({ text, bold: true, size, font: "Times New Roman" });
}
function normal(text, size = 20) {
  return new TextRun({ text, size, font: "Times New Roman" });
}
function italic(text, size = 20) {
  return new TextRun({ text, italics: true, size, font: "Times New Roman" });
}

// right-aligned year using tab stop
function rowWithYear(leftRuns, year) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: 9200 }],
    children: [...leftRuns, new TextRun({ text: `\t${year}`, bold: true, size: 20, font: "Times New Roman" })],
    spacing: { after: 40 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [normal(text)],
    bullet: { level: 0 },
    spacing: { after: 30 },
  });
}

// ── ATS Score ──────────────────────────────────────────────────────────────
const ACTION_VERBS = [
  "built","developed","designed","implemented","led","managed","created","optimised",
  "improved","reduced","increased","delivered","architected","automated","deployed",
  "integrated","launched","scaled","mentored","collaborated","engineered","streamlined",
];
const WEAK_PATTERNS = {
  summary:    { minWords: 30, msg: "Summary is too short. Aim for at least 30 words." },
  experience: { minWords: 40, msg: "Experience section is thin. Add more detail about your roles." },
  education:  { minWords: 10, msg: "Education section is incomplete." },
  skills:     { minItems: 5,  msg: "Add at least 5 skills to pass ATS filters." },
  projects:   { minWords: 20, msg: "Projects section is too brief." },
};
function wordCount(str) { return (str || "").trim().split(/\s+/).filter(Boolean).length; }

function scoreATS(data) {
  const { summary = "", experience = "", education = "", skills = "", projects = "" } = data;
  const skillList = (skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const expLower  = experience.toLowerCase();
  const verbsFound = ACTION_VERBS.filter(v => expLower.includes(v)).length;
  const combined   = experience + " " + projects;
  const hasNumbers = /\d+/.test(combined);
  const hasPercent = /%/.test(combined);

  const completeness = Math.round(([summary,experience,education,skills,projects].filter(s=>s.trim()).length / 5) * 30);
  const keywordScore = Math.round(Math.min(skillList.length / 8, 1) * 25);
  const verbScore    = Math.round(Math.min(verbsFound / 4, 1) * 25);
  const quantScore   = (hasNumbers ? 10 : 0) + (hasPercent ? 10 : 0);
  const total        = completeness + keywordScore + verbScore + quantScore;

  const warnings = [];
  if (wordCount(summary)    < WEAK_PATTERNS.summary.minWords)    warnings.push(WEAK_PATTERNS.summary.msg);
  if (wordCount(experience) < WEAK_PATTERNS.experience.minWords) warnings.push(WEAK_PATTERNS.experience.msg);
  if (wordCount(education)  < WEAK_PATTERNS.education.minWords)  warnings.push(WEAK_PATTERNS.education.msg);
  if (skillList.length      < WEAK_PATTERNS.skills.minItems)     warnings.push(WEAK_PATTERNS.skills.msg);
  if (wordCount(projects)   < WEAK_PATTERNS.projects.minWords)   warnings.push(WEAK_PATTERNS.projects.msg);
  if (!hasNumbers) warnings.push("Add numbers to quantify your impact (e.g. 'reduced load time by 40%').");
  if (verbsFound === 0) warnings.push("Use action verbs in Experience (e.g. Built, Developed, Led).");

  return { total, breakdown: { completeness, keywordScore, verbScore, quantScore }, warnings };
}

// ── DOCX builder ───────────────────────────────────────────────────────────
async function buildResumeDocx(data) {
  const {
    name = "", email = "", phone = "", linkedin = "", github = "", portfolio = "",
    // education: array of { degree, institution, score, year }
    education = [],
    // experience: array of { company, role, year, description, link }
    experience = [],
    skillsAcquired = "",   // "Frontend: ...\nBackend: ...\nCloud: ..."
    // projects: array of { title, status, techStack, github, date, description }
    projects = [],
    achievements = [],     // array of { text, year }
    codingProfiles = "",   // single line
    // certifications: array of { name, platform, year }
    certifications = [],
    // technicalSkills: array of { category, value }
    technicalSkills = [],
  } = data;

  const children = [];

  // ── HEADER ──
  // Name (right-aligned, large)
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 40 },
    children: [new TextRun({ text: name || "Your Name", bold: true, size: 40, font: "Times New Roman" })],
  }));

  // Contact line
  const contactParts = [];
  if (phone)     contactParts.push(`Contact: ${phone}`);
  if (email)     contactParts.push(`E-mail: ${email}`);
  const contactRuns = [new TextRun({ text: contactParts.join("  |  "), size: 18, font: "Times New Roman" })];
  if (linkedin)  contactRuns.push(new TextRun({ text: "  LinkedIn", size: 18, font: "Times New Roman", color: "1155CC", underline: { type: UnderlineType.SINGLE } }));
  if (github)    contactRuns.push(new TextRun({ text: "  Github",   size: 18, font: "Times New Roman", color: "1155CC", underline: { type: UnderlineType.SINGLE } }));
  if (portfolio) contactRuns.push(new TextRun({ text: "  Portfolio",size: 18, font: "Times New Roman", color: "1155CC", underline: { type: UnderlineType.SINGLE } }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: contactRuns, spacing: { after: 80 } }));

  // ── EDUCATION ──
  if (education.length) {
    children.push(sectionHeading("EDUCATION"));
    for (const ed of education) {
      children.push(rowWithYear(
        [bold(ed.degree || ""), normal("  " + (ed.institution || "")), normal("  |  "), bold(ed.score || "")],
        ed.year || ""
      ));
    }
  }

  // ── INTERNSHIP EXPERIENCES ──
  if (experience.length) {
    children.push(sectionHeading("INTERNSHIP EXPERIENCES"));
    for (const exp of experience) {
      // Company name + year
      children.push(rowWithYear([bold(exp.company || "")], exp.year || ""));
      // Description lines
      if (exp.description) {
        for (const line of exp.description.split("\n").filter(Boolean)) {
          const linkMatch = line.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
          if (linkMatch) {
            children.push(new Paragraph({
              children: [
                normal(linkMatch[1] + " "),
                new TextRun({ text: linkMatch[2], size: 20, font: "Times New Roman", color: "1155CC", underline: { type: UnderlineType.SINGLE } }),
              ],
              spacing: { after: 40 },
            }));
          } else {
            children.push(new Paragraph({ children: [normal(line)], spacing: { after: 40 } }));
          }
        }
      }
    }
  }

  // ── SKILLS ACQUIRED ──
  if (skillsAcquired) {
    children.push(sectionHeading("SKILLS ACQUIRED:"));
    for (const line of skillsAcquired.split("\n").filter(Boolean)) {
      const [cat, ...rest] = line.split(":");
      children.push(new Paragraph({
        children: [bold(cat + ":"), normal(" " + rest.join(":"))],
        spacing: { after: 40 },
      }));
    }
  }

  // ── PROJECTS ──
  if (projects.length) {
    children.push(sectionHeading("PROJECTS"));
    for (const proj of projects) {
      // Title + Github link + Date
      children.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: 9200 }],
        children: [
          bold(proj.title || ""),
          proj.status ? normal(` (${proj.status})`) : new TextRun(""),
          proj.github  ? new TextRun({ text: "    Github", size: 20, font: "Times New Roman", color: "1155CC", underline: { type: UnderlineType.SINGLE } }) : new TextRun(""),
          new TextRun({ text: `\t${proj.date || ""}`, bold: true, size: 20, font: "Times New Roman" }),
        ],
        spacing: { after: 30 },
      }));
      if (proj.techStack) {
        children.push(new Paragraph({ children: [bold("Tech Stack : "), normal(proj.techStack)], spacing: { after: 30 } }));
      }
      if (proj.description) {
        for (const line of proj.description.split("\n").filter(Boolean)) {
          children.push(new Paragraph({ children: [normal(line)], spacing: { after: 30 } }));
        }
      }
    }
  }

  // ── ACHIEVEMENTS ──
  if (achievements.length) {
    children.push(sectionHeading("ACHIEVEMENTS"));
    for (const ach of achievements) {
      children.push(rowWithYear([bold(ach.text || "")], ach.year || ""));
    }
  }

  // ── CODING PROFILES ──
  if (codingProfiles) {
    children.push(sectionHeading("CODING PROFILES"));
    children.push(new Paragraph({ children: [normal(codingProfiles)], spacing: { after: 40 } }));
  }

  // ── CERTIFICATIONS ──
  if (certifications.length) {
    children.push(sectionHeading("CERTIFICATIONS"));
    for (const cert of certifications) {
      children.push(rowWithYear(
        [normal(cert.name || ""), new TextRun({ text: `  |${cert.platform || ""}`, size: 20, font: "Times New Roman" })],
        cert.year || ""
      ));
    }
  }

  // ── TECHNICAL SKILLS ──
  if (technicalSkills.length) {
    children.push(sectionHeading("TECHNICAL SKILLS"));
    for (const ts of technicalSkills) {
      children.push(new Paragraph({
        children: [bold(ts.category + "  "), normal(ts.value || "")],
        spacing: { after: 40 },
      }));
    }
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } }, children }],
  });

  return Packer.toBuffer(doc);
}

module.exports = { scoreATS, buildResumeDocx };
