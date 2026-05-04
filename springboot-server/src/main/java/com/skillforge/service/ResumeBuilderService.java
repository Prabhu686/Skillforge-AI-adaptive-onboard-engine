package com.skillforge.service;

import org.apache.poi.xwpf.usermodel.*;
import org.apache.poi.util.Units;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.util.*;

@Service
public class ResumeBuilderService {

    private static final List<String> ACTION_VERBS = List.of(
        "built","developed","designed","implemented","led","managed","created","optimised",
        "improved","reduced","increased","delivered","architected","automated","deployed",
        "integrated","launched","scaled","mentored","collaborated","engineered","streamlined"
    );

    // ── ATS Score ──────────────────────────────────────────────────────────
    public Map<String, Object> scoreATS(Map<String, Object> data) {
        String summary    = str(data, "summary");
        String experience = str(data, "experience");
        String education  = str(data, "education");
        String skills     = str(data, "skills");
        String projects   = str(data, "projects");

        List<String> skillList = Arrays.stream(skills.split(","))
            .map(String::trim).filter(s -> !s.isEmpty()).toList();

        int filled = 0;
        for (String s : List.of(summary, experience, education, skills, projects))
            if (!s.isBlank()) filled++;
        int completeness = Math.round((float) filled / 5 * 30);

        int keywordScore = (int) Math.round(Math.min(skillList.size() / 8.0, 1.0) * 25);

        String expLower = experience.toLowerCase();
        long verbsFound = ACTION_VERBS.stream().filter(expLower::contains).count();
        int verbScore   = (int) Math.round(Math.min(verbsFound / 4.0, 1.0) * 25);

        String combined = experience + " " + projects;
        int quantScore  = (combined.matches(".*\\d+.*") ? 10 : 0) + (combined.contains("%") ? 10 : 0);

        int total = completeness + keywordScore + verbScore + quantScore;

        List<String> warnings = new ArrayList<>();
        if (wordCount(summary)    < 30) warnings.add("Summary is too short. Aim for at least 30 words.");
        if (wordCount(experience) < 40) warnings.add("Experience section is thin. Add more detail.");
        if (wordCount(education)  < 10) warnings.add("Education section is incomplete.");
        if (skillList.size()      < 5)  warnings.add("Add at least 5 skills to pass ATS filters.");
        if (wordCount(projects)   < 20) warnings.add("Projects section is too brief.");
        if (!combined.matches(".*\\d+.*")) warnings.add("Add numbers to quantify your impact.");
        if (verbsFound == 0) warnings.add("Use action verbs in Experience (e.g. Built, Developed, Led).");

        return Map.of("total", total,
            "breakdown", Map.of("completeness", completeness, "keywordScore", keywordScore,
                                "verbScore", verbScore, "quantScore", quantScore),
            "warnings", warnings);
    }

    // ── DOCX generation ────────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    public byte[] buildDocx(Map<String, Object> data) throws Exception {
        XWPFDocument doc = new XWPFDocument();

        // Page margins
        CTSectPr sectPr = doc.getDocument().getBody().addNewSectPr();
        CTPageMar mar = sectPr.addNewPgMar();
        mar.setTop(BigInteger.valueOf(720));
        mar.setBottom(BigInteger.valueOf(720));
        mar.setLeft(BigInteger.valueOf(900));
        mar.setRight(BigInteger.valueOf(900));

        String name      = str(data, "name");
        String email     = str(data, "email");
        String phone     = str(data, "phone");
        String linkedin  = str(data, "linkedin");
        String github    = str(data, "github");
        String portfolio = str(data, "portfolio");

        // ── Name (right-aligned, large) ──
        XWPFParagraph namePara = doc.createParagraph();
        namePara.setAlignment(ParagraphAlignment.RIGHT);
        XWPFRun nameRun = namePara.createRun();
        nameRun.setText(name.isEmpty() ? "Your Name" : name.toUpperCase());
        nameRun.setBold(true);
        nameRun.setFontSize(20);
        nameRun.setFontFamily("Times New Roman");

        // ── Contact line (centered) ──
        List<String> contactParts = new ArrayList<>();
        if (!phone.isEmpty())  contactParts.add("Contact: " + phone);
        if (!email.isEmpty())  contactParts.add("E-mail: " + email);
        XWPFParagraph contactPara = doc.createParagraph();
        contactPara.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun contactRun = contactPara.createRun();
        contactRun.setText(String.join("  |  ", contactParts));
        contactRun.setFontSize(9);
        contactRun.setFontFamily("Times New Roman");
        if (!linkedin.isEmpty()) addLink(contactPara, "  LinkedIn", 9);
        if (!github.isEmpty())   addLink(contactPara, "  Github",   9);
        if (!portfolio.isEmpty()) addLink(contactPara, "  Portfolio", 9);

        // ── Education ──
        List<Map<String, String>> education = listOf(data, "education");
        if (!education.isEmpty()) {
            sectionHeading(doc, "EDUCATION");
            for (Map<String, String> ed : education) {
                rowWithYear(doc,
                    bold(ed.getOrDefault("degree", "")) + "  " + ed.getOrDefault("institution", "") +
                    "  |  " + ed.getOrDefault("score", ""),
                    ed.getOrDefault("year", ""));
            }
        }

        // ── Experience ──
        List<Map<String, String>> experience = listOf(data, "experience");
        if (!experience.isEmpty()) {
            sectionHeading(doc, "INTERNSHIP EXPERIENCES");
            for (Map<String, String> exp : experience) {
                rowWithYear(doc, exp.getOrDefault("company", ""), exp.getOrDefault("year", ""));
                String desc = exp.getOrDefault("description", "");
                for (String line : desc.split("\n")) {
                    if (!line.isBlank()) normalPara(doc, line.trim());
                }
            }
        }

        // ── Skills Acquired ──
        String skillsAcquired = str(data, "skillsAcquired");
        if (!skillsAcquired.isBlank()) {
            sectionHeading(doc, "SKILLS ACQUIRED:");
            for (String line : skillsAcquired.split("\n")) {
                if (line.isBlank()) continue;
                String[] parts = line.split(":", 2);
                XWPFParagraph p = doc.createParagraph();
                p.setSpacingAfter(40);
                XWPFRun r1 = p.createRun();
                r1.setText(parts[0] + ":");
                r1.setBold(true);
                r1.setFontSize(10);
                r1.setFontFamily("Times New Roman");
                if (parts.length > 1) {
                    XWPFRun r2 = p.createRun();
                    r2.setText(parts[1]);
                    r2.setFontSize(10);
                    r2.setFontFamily("Times New Roman");
                }
            }
        }

        // ── Projects ──
        List<Map<String, String>> projects = listOf(data, "projects");
        if (!projects.isEmpty()) {
            sectionHeading(doc, "PROJECTS");
            for (Map<String, String> proj : projects) {
                String title  = proj.getOrDefault("title", "");
                String status = proj.getOrDefault("status", "");
                String date   = proj.getOrDefault("date", "");
                String tech   = proj.getOrDefault("techStack", "");
                String desc   = proj.getOrDefault("description", "");

                XWPFParagraph p = doc.createParagraph();
                p.setSpacingAfter(30);
                XWPFRun r = p.createRun();
                r.setText(title + (status.isEmpty() ? "" : " (" + status + ")"));
                r.setBold(true);
                r.setFontSize(10);
                r.setFontFamily("Times New Roman");
                XWPFRun dateRun = p.createRun();
                dateRun.addTab();
                dateRun.setText(date);
                dateRun.setBold(true);
                dateRun.setFontSize(10);
                dateRun.setFontFamily("Times New Roman");

                if (!tech.isEmpty()) {
                    XWPFParagraph tp = doc.createParagraph();
                    tp.setSpacingAfter(30);
                    XWPFRun tr = tp.createRun();
                    tr.setText("Tech Stack : " + tech);
                    tr.setFontSize(10);
                    tr.setFontFamily("Times New Roman");
                }
                for (String line : desc.split("\n")) {
                    if (!line.isBlank()) normalPara(doc, line.trim());
                }
            }
        }

        // ── Achievements ──
        List<Map<String, String>> achievements = listOf(data, "achievements");
        if (!achievements.isEmpty()) {
            sectionHeading(doc, "ACHIEVEMENTS");
            for (Map<String, String> ach : achievements) {
                rowWithYear(doc, ach.getOrDefault("text", ""), ach.getOrDefault("year", ""));
            }
        }

        // ── Coding Profiles ──
        String codingProfiles = str(data, "codingProfiles");
        if (!codingProfiles.isBlank()) {
            sectionHeading(doc, "CODING PROFILES");
            normalPara(doc, codingProfiles);
        }

        // ── Certifications ──
        List<Map<String, String>> certs = listOf(data, "certifications");
        if (!certs.isEmpty()) {
            sectionHeading(doc, "CERTIFICATIONS");
            for (Map<String, String> cert : certs) {
                rowWithYear(doc,
                    cert.getOrDefault("name", "") + "  |" + cert.getOrDefault("platform", ""),
                    cert.getOrDefault("year", ""));
            }
        }

        // ── Technical Skills ──
        List<Map<String, String>> techSkills = listOf(data, "technicalSkills");
        if (!techSkills.isEmpty()) {
            sectionHeading(doc, "TECHNICAL SKILLS");
            for (Map<String, String> ts : techSkills) {
                XWPFParagraph p = doc.createParagraph();
                p.setSpacingAfter(40);
                XWPFRun r1 = p.createRun();
                r1.setText(ts.getOrDefault("category", "") + "  ");
                r1.setBold(true);
                r1.setFontSize(10);
                r1.setFontFamily("Times New Roman");
                XWPFRun r2 = p.createRun();
                r2.setText(ts.getOrDefault("value", ""));
                r2.setFontSize(10);
                r2.setFontFamily("Times New Roman");
            }
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        doc.write(out);
        doc.close();
        return out.toByteArray();
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private void sectionHeading(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(160);
        p.setSpacingAfter(60);
        p.setBorderBottom(Borders.SINGLE);
        XWPFRun r = p.createRun();
        r.setText(text);
        r.setBold(true);
        r.setFontSize(11);
        r.setFontFamily("Times New Roman");
    }

    private void rowWithYear(XWPFDocument doc, String leftText, String year) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingAfter(40);
        XWPFRun r1 = p.createRun();
        r1.setText(leftText);
        r1.setFontSize(10);
        r1.setFontFamily("Times New Roman");
        XWPFRun r2 = p.createRun();
        r2.addTab();
        r2.setText(year);
        r2.setBold(true);
        r2.setFontSize(10);
        r2.setFontFamily("Times New Roman");
    }

    private void normalPara(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingAfter(40);
        XWPFRun r = p.createRun();
        r.setText(text);
        r.setFontSize(10);
        r.setFontFamily("Times New Roman");
    }

    private void addLink(XWPFParagraph p, String text, int size) {
        XWPFRun r = p.createRun();
        r.setText(text);
        r.setFontSize(size);
        r.setFontFamily("Times New Roman");
        r.setColor("1155CC");
        r.setUnderline(UnderlinePatterns.SINGLE);
    }

    private String bold(String text) { return text; } // used for label clarity only

    private String str(Map<String, Object> data, String key) {
        Object v = data.get(key);
        return v instanceof String ? (String) v : "";
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, String>> listOf(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v instanceof List<?> list) {
            return list.stream()
                .filter(i -> i instanceof Map)
                .map(i -> (Map<String, String>) i)
                .toList();
        }
        return List.of();
    }

    private int wordCount(String s) {
        if (s == null || s.isBlank()) return 0;
        return s.trim().split("\\s+").length;
    }
}
