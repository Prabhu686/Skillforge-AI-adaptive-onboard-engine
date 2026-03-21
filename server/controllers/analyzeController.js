const { extractText }     = require("../utils/parser");
const { extractSkills }   = require("../utils/skillExtractor");
const { findGap }         = require("../utils/skillGap");
const { generateRoadmap } = require("../utils/roadmap");
const { estimateSalary, scoreResume, getInterviewTips } = require("../utils/insights");
const { scoreATS, buildResumeDocx } = require("../utils/resumeBuilder");

async function analyze(req, res) {
  try {
    const resumeFile = req.files?.resume?.[0];
    const jdFile     = req.files?.jd?.[0];
    if (!resumeFile || !jdFile)
      return res.status(400).json({ error: "Both resume and job description files are required." });

    const [resumeText, jdText] = await Promise.all([
      extractText(resumeFile.buffer, resumeFile.mimetype),
      extractText(jdFile.buffer,     jdFile.mimetype),
    ]);

    const [resumeSkills, jdSkills] = await Promise.all([
      extractSkills(resumeText),
      extractSkills(jdText),
    ]);

    const missingSkills  = findGap(resumeSkills, jdSkills);
    const matchedSkills  = jdSkills.filter((s) =>
      resumeSkills.map((r) => r.toLowerCase()).includes(s.toLowerCase())
    );
    const roadmap        = generateRoadmap(missingSkills, resumeSkills);
    const salary         = estimateSalary(resumeSkills, jdSkills);
    const resumeScore    = scoreResume(resumeSkills, jdSkills);
    const interviewTips  = getInterviewTips(jdSkills);

    return res.json({
      resumeSkills, jdSkills, missingSkills, matchedSkills,
      roadmap, salary, resumeScore, interviewTips,
    });
  } catch (err) {
    console.error("analyze error:", err);
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
}

// POST /api/analyze/compare  — compare two resumes against same JD
async function compare(req, res) {
  try {
    const r1File = req.files?.resume1?.[0];
    const r2File = req.files?.resume2?.[0];
    const jdFile = req.files?.jd?.[0];
    if (!r1File || !r2File || !jdFile)
      return res.status(400).json({ error: "resume1, resume2, and jd files are all required." });

    const [t1, t2, jdText] = await Promise.all([
      extractText(r1File.buffer, r1File.mimetype),
      extractText(r2File.buffer, r2File.mimetype),
      extractText(jdFile.buffer, jdFile.mimetype),
    ]);

    const [skills1, skills2, jdSkills] = await Promise.all([
      extractSkills(t1),
      extractSkills(t2),
      extractSkills(jdText),
    ]);

    return res.json({
      resume1: { skills: skills1, score: scoreResume(skills1, jdSkills), salary: estimateSalary(skills1, jdSkills), missing: findGap(skills1, jdSkills) },
      resume2: { skills: skills2, score: scoreResume(skills2, jdSkills), salary: estimateSalary(skills2, jdSkills), missing: findGap(skills2, jdSkills) },
      jdSkills,
    });
  } catch (err) {
    console.error("compare error:", err);
    return res.status(500).json({ error: "Comparison failed. Please try again." });
  }
}

// POST /api/analyze/build — ATS score only
function build(req, res) {
  try {
    return res.json({ ats: scoreATS(req.body) });
  } catch (err) {
    console.error("build error:", err);
    return res.status(500).json({ error: "Build failed." });
  }
}

// POST /api/analyze/build/download — generate and stream .docx
async function buildDownload(req, res) {
  try {
    const buf = await buildResumeDocx(req.body);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", 'attachment; filename="resume.docx"');
    return res.send(buf);
  } catch (err) {
    console.error("buildDownload error:", err);
    return res.status(500).json({ error: "Failed to generate Word document." });
  }
}

module.exports = { analyze, compare, build, buildDownload };
