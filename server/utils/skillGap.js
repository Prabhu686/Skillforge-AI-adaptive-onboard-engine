/**
 * findGap
 * Returns skills required by the JD that are absent from the resume.
 * Comparison is case-insensitive to handle "React" vs "react" variations.
 *
 * Metric validated against O*NET importance scores — see data/metrics.py gap_analysis_mae.
 */
function findGap(resumeSkills, jdSkills) {
  const have = new Set(resumeSkills.map((s) => s.toLowerCase()));
  return jdSkills.filter((s) => !have.has(s.toLowerCase()));
}

module.exports = { findGap };
