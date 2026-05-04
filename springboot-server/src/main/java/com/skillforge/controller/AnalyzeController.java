package com.skillforge.controller;

import com.skillforge.service.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/analyze")
public class AnalyzeController {

    private final ParserService         parser;
    private final SkillExtractorService extractor;
    private final AnalyzeService        analyzeService;
    private final QuizService           quizService;
    private final ResumeBuilderService  builderService;
    private final InterviewService      interviewService;

    public AnalyzeController(ParserService parser, SkillExtractorService extractor,
                             AnalyzeService analyzeService, QuizService quizService,
                             ResumeBuilderService builderService, InterviewService interviewService) {
        this.parser           = parser;
        this.extractor        = extractor;
        this.analyzeService   = analyzeService;
        this.quizService      = quizService;
        this.builderService   = builderService;
        this.interviewService = interviewService;
    }

    // POST /api/analyze
    @PostMapping
    public ResponseEntity<?> analyze(
            @RequestParam("resume") MultipartFile resumeFile,
            @RequestParam("jd")     MultipartFile jdFile) {
        try {
            String resumeText = parser.extractText(resumeFile);
            String jdText     = parser.extractText(jdFile);

            List<String> resumeSkills = extractor.extractSkills(resumeText);
            List<String> jdSkills     = extractor.extractSkills(jdText);

            List<String>              missingSkills = analyzeService.findGap(resumeSkills, jdSkills);
            List<String>              matchedSkills = analyzeService.findMatched(resumeSkills, jdSkills);
            List<Map<String, Object>> roadmap       = analyzeService.generateRoadmap(missingSkills, resumeSkills);
            Map<String, Object>       salary        = analyzeService.estimateSalary(resumeSkills, jdSkills);
            Map<String, Object>       resumeScore   = analyzeService.scoreResume(resumeSkills, jdSkills);
            Map<String, Object>       interviewTips = analyzeService.getInterviewTips(jdSkills);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("resumeSkills",  resumeSkills);
            result.put("jdSkills",      jdSkills);
            result.put("missingSkills", missingSkills);
            result.put("matchedSkills", matchedSkills);
            result.put("roadmap",       roadmap);
            result.put("salary",        salary);
            result.put("resumeScore",   resumeScore);
            result.put("interviewTips", interviewTips);

            analyzeService.saveResult(result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }

    // POST /api/analyze/compare
    @PostMapping("/compare")
    public ResponseEntity<?> compare(
            @RequestParam("resume1") MultipartFile r1File,
            @RequestParam("resume2") MultipartFile r2File,
            @RequestParam("jd")      MultipartFile jdFile) {
        try {
            String t1     = parser.extractText(r1File);
            String t2     = parser.extractText(r2File);
            String jdText = parser.extractText(jdFile);

            List<String> skills1  = extractor.extractSkills(t1);
            List<String> skills2  = extractor.extractSkills(t2);
            List<String> jdSkills = extractor.extractSkills(jdText);

            Map<String, Object> r1 = new LinkedHashMap<>();
            r1.put("skills",  skills1);
            r1.put("score",   analyzeService.scoreResume(skills1, jdSkills));
            r1.put("salary",  analyzeService.estimateSalary(skills1, jdSkills));
            r1.put("missing", analyzeService.findGap(skills1, jdSkills));

            Map<String, Object> r2 = new LinkedHashMap<>();
            r2.put("skills",  skills2);
            r2.put("score",   analyzeService.scoreResume(skills2, jdSkills));
            r2.put("salary",  analyzeService.estimateSalary(skills2, jdSkills));
            r2.put("missing", analyzeService.findGap(skills2, jdSkills));

            Map<String, Object> compareResult = new LinkedHashMap<>();
            compareResult.put("resume1",  r1);
            compareResult.put("resume2",  r2);
            compareResult.put("jdSkills", jdSkills);
            return ResponseEntity.ok(compareResult);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Comparison failed: " + e.getMessage()));
        }
    }

    // POST /api/analyze/build
    @PostMapping("/build")
    public ResponseEntity<?> build(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(Map.of("ats", builderService.scoreATS(flattenForATS(body))));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Build failed: " + e.getMessage()));
        }
    }

    // POST /api/analyze/build/download
    @PostMapping("/build/download")
    public ResponseEntity<?> buildDownload(@RequestBody Map<String, Object> body) {
        try {
            byte[] docx = builderService.buildDocx(body);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"resume.docx\"")
                .contentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(docx);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "DOCX generation failed: " + e.getMessage()));
        }
    }

    // POST /api/analyze/quiz
    @PostMapping("/quiz")
    public ResponseEntity<?> quiz(@RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> skills = (List<String>) body.getOrDefault("skills", List.of());
            int count = body.containsKey("count") ? ((Number) body.get("count")).intValue() : 10;
            return ResponseEntity.ok(Map.of("questions", quizService.generateQuiz(skills, count)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Quiz generation failed: " + e.getMessage()));
        }
    }

    // POST /api/analyze/quiz/evaluate
    @PostMapping("/quiz/evaluate")
    public ResponseEntity<?> quizEvaluate(@RequestBody Map<String, Object> body) {
        try {
            String userAnswer    = (String) body.getOrDefault("userAnswer", "");
            String correctAnswer = (String) body.getOrDefault("correctAnswer", "");
            return ResponseEntity.ok(quizService.evaluateAnswer(userAnswer, correctAnswer));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Evaluation failed: " + e.getMessage()));
        }
    }

    // POST /api/analyze/quiz/save
    @PostMapping("/quiz/save")
    public ResponseEntity<?> quizSave(@RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> skills = (List<String>) body.getOrDefault("skills", List.of());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> answers = (List<Map<String, Object>>) body.getOrDefault("answers", List.of());
            return ResponseEntity.ok(quizService.saveQuizResult(skills, answers));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Save failed: " + e.getMessage()));
        }
    }

    // GET /api/analyze/history
    @GetMapping("/history")
    public ResponseEntity<?> history() {
        return ResponseEntity.ok(analyzeService.getAllResults());
    }

    // GET /api/analyze/quiz/history
    @GetMapping("/quiz/history")
    public ResponseEntity<?> quizHistory() {
        return ResponseEntity.ok(quizService.getHistory());
    }

    // GET /api/analyze/health
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    // ── POST /api/analyze/interview/questions
    @PostMapping("/interview/questions")
    public ResponseEntity<?> interviewQuestions(@RequestBody Map<String, Object> body) {
        try {
            @SuppressWarnings("unchecked")
            List<String> skills = (List<String>) body.getOrDefault("skills", new ArrayList<>());
            String domain = (String) body.getOrDefault("domain", "General");
            int count = body.containsKey("count") ? ((Number) body.get("count")).intValue() : 5;
            List<Map<String, String>> questions = interviewService.generateQuestions(skills, domain, count);
            return ResponseEntity.ok(Map.of("questions", questions));
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate questions: " + msg));
        }
    }

    // ── POST /api/analyze/interview/evaluate ──────────────────────────────
    @PostMapping("/interview/evaluate")
    public ResponseEntity<?> interviewEvaluate(@RequestBody Map<String, Object> body) {
        try {
            String question    = (String) body.getOrDefault("question", "");
            String idealAnswer = (String) body.getOrDefault("idealAnswer", "");
            String userAnswer  = (String) body.getOrDefault("userAnswer", "");
            return ResponseEntity.ok(interviewService.evaluateAnswer(question, idealAnswer, userAnswer));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Evaluation failed: " + e.getMessage()));
        }
    }

    // ── POST /api/analyze/interview/save ──────────────────────────────────
    @PostMapping("/interview/save")
    public ResponseEntity<?> interviewSave(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(interviewService.saveResult(body));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Save failed: " + e.getMessage()));
        }
    }

    // ── GET /api/analyze/interview/history ────────────────────────────────
    @GetMapping("/interview/history")
    public ResponseEntity<?> interviewHistory() {
        return ResponseEntity.ok(interviewService.getHistory());
    }

    // Flatten builder form for ATS scoring
    private Map<String, Object> flattenForATS(Map<String, Object> data) {
        StringBuilder exp  = new StringBuilder();
        StringBuilder proj = new StringBuilder();
        StringBuilder edu  = new StringBuilder();
        StringBuilder sk   = new StringBuilder();

        Object expObj = data.get("experience");
        if (expObj instanceof List<?> expList) {
            for (Object item : expList) {
                if (item instanceof Map<?, ?> m) {
                    Object desc = m.get("description");
                    if (desc != null) exp.append(desc).append("\n");
                }
            }
        }
        Object projObj = data.get("projects");
        if (projObj instanceof List<?> projList) {
            for (Object item : projList) {
                if (item instanceof Map<?, ?> m) {
                    Object desc = m.get("description");
                    if (desc != null) proj.append(desc).append("\n");
                }
            }
        }
        Object eduObj = data.get("education");
        if (eduObj instanceof List<?> eduList) {
            for (Object item : eduList) {
                if (item instanceof Map<?, ?> m) {
                    Object deg  = m.get("degree");
                    Object inst = m.get("institution");
                    edu.append(deg != null ? deg : "").append(" ")
                       .append(inst != null ? inst : "").append("\n");
                }
            }
        }
        Object tsObj = data.get("technicalSkills");
        if (tsObj instanceof List<?> tsList) {
            for (Object item : tsList) {
                if (item instanceof Map<?, ?> m) {
                    Object val = m.get("value");
                    if (val != null) sk.append(val).append(", ");
                }
            }
        }

        Map<String, Object> flat = new HashMap<>();
        flat.put("summary",    exp.toString());
        flat.put("experience", exp.toString());
        flat.put("education",  edu.toString());
        flat.put("skills",     sk.toString());
        flat.put("projects",   proj.toString());
        return flat;
    }
}
