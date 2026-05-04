package com.skillforge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillforge.model.AnalysisResult;
import com.skillforge.repository.AnalysisResultRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyzeService {

    private final AnalysisResultRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();

    private static final Map<String, double[]> SALARY = Map.of(
        "Frontend", new double[]{4, 22},
        "Backend",  new double[]{5, 28},
        "Database", new double[]{4.5, 20},
        "DevOps",   new double[]{6, 32},
        "AI",       new double[]{8, 40},
        "General",  new double[]{3.5, 15}
    );

    private static final Map<String, List<String>> DOMAIN_BUCKETS = Map.of(
        "Frontend", List.of("React","Vue","Angular","Next.js","Svelte","HTML","CSS","Tailwind","Redux","TypeScript","JavaScript"),
        "Backend",  List.of("Node.js","Express","Django","Flask","FastAPI","Spring Boot","Python","Java","Go","Ruby"),
        "Database", List.of("MongoDB","PostgreSQL","MySQL","Redis","SQL","DynamoDB","Firebase"),
        "DevOps",   List.of("Docker","Kubernetes","AWS","Azure","GCP","Terraform","CI/CD","Linux","Nginx"),
        "AI",       List.of("Machine Learning","Deep Learning","NLP","TensorFlow","PyTorch","scikit-learn","OpenAI","LangChain")
    );

    public AnalyzeService(AnalysisResultRepository repo) {
        this.repo = repo;
    }

    public List<String> findGap(List<String> resumeSkills, List<String> jdSkills) {
        Set<String> have = resumeSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        return jdSkills.stream().filter(s -> !have.contains(s.toLowerCase())).toList();
    }

    public List<String> findMatched(List<String> resumeSkills, List<String> jdSkills) {
        Set<String> have = resumeSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        return jdSkills.stream().filter(s -> have.contains(s.toLowerCase())).toList();
    }

    public String detectDomain(List<String> skills) {
        return DOMAIN_BUCKETS.entrySet().stream()
            .max(Comparator.comparingLong(e ->
                skills.stream().filter(s -> e.getValue().stream()
                    .anyMatch(b -> b.equalsIgnoreCase(s))).count()))
            .map(Map.Entry::getKey).orElse("General");
    }

    public Map<String, Object> scoreResume(List<String> resumeSkills, List<String> jdSkills) {
        Set<String> have = resumeSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        int matched = (int) jdSkills.stream().filter(s -> have.contains(s.toLowerCase())).count();
        double coverage = jdSkills.isEmpty() ? 0 : (double) matched / jdSkills.size();

        String domain = detectDomain(jdSkills);
        List<String> bucket = DOMAIN_BUCKETS.getOrDefault(domain, List.of());
        int depthRaw = (int) bucket.stream().filter(s -> have.contains(s.toLowerCase())).count();
        double depth = Math.min(depthRaw / 8.0, 1.0);

        long domainsHit = DOMAIN_BUCKETS.values().stream()
            .filter(b -> b.stream().anyMatch(s -> have.contains(s.toLowerCase()))).count();
        double breadth = Math.min(domainsHit / 4.0, 1.0);

        int score = (int) Math.round(coverage * 60 + depth * 25 + breadth * 15);
        String grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";
        String feedback = score >= 85 ? "Excellent match!" : score >= 70 ? "Strong match. A few skill gaps to bridge."
            : score >= 55 ? "Moderate match. Focus on top-priority skills."
            : score >= 40 ? "Partial match. Significant upskilling needed." : "Low match. Build foundational skills first.";

        return Map.of("score", score, "grade", grade, "feedback", feedback,
            "breakdown", Map.of("matched", matched, "total", jdSkills.size(),
                "coverage", (int)(coverage*100), "depthRaw", depthRaw, "domainsHit", domainsHit));
    }

    public Map<String, Object> estimateSalary(List<String> resumeSkills, List<String> jdSkills) {
        String domain = detectDomain(jdSkills);
        double[] range = SALARY.getOrDefault(domain, SALARY.get("General"));
        Set<String> have = resumeSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        int matched = (int) jdSkills.stream().filter(s -> have.contains(s.toLowerCase())).count();
        double matchRatio = jdSkills.isEmpty() ? 0 : (double) matched / jdSkills.size();
        double cMin = Math.round((range[0] + (range[1] - range[0]) * matchRatio * 0.5) * 10.0) / 10.0;
        double cMax = Math.round((range[0] + (range[1] - range[0]) * Math.min(matchRatio + 0.2, 1)) * 10.0) / 10.0;
        return Map.of("domain", domain, "roleRange", Map.of("min", range[0], "max", range[1]),
            "candidateRange", Map.of("min", cMin, "max", cMax),
            "currency", "INR", "unit", "LPA", "matchRatio", (int)(matchRatio * 100));
    }

    public List<Map<String, Object>> generateRoadmap(List<String> missing, List<String> resumeSkills) {
        return missing.stream().map(skill -> {
            long related = resumeSkills.stream()
                .filter(r -> r.toLowerCase().contains(skill.toLowerCase().substring(0, Math.min(3, skill.length())))).count();
            String level = related >= 6 ? "Advanced" : related >= 3 ? "Intermediate" : "Beginner";
            int priority = (int)(Math.random() * 5) + 1;
            Map<String, Object> m = new HashMap<>();
            m.put("skill", skill);
            m.put("level", level);
            m.put("priority", priority);
            return m;
        }).sorted(Comparator.comparingInt(m -> -(int) m.get("priority"))).toList();
    }

    public Map<String, Object> getInterviewTips(List<String> jdSkills) {
        String domain = detectDomain(jdSkills);
        Map<String, List<String>> tips = Map.of(
            "Frontend", List.of("Revise browser rendering pipeline and virtual DOM internals.",
                "Practice building a small React app with hooks and context from scratch.",
                "Be ready to explain CSS specificity, flexbox vs grid, and responsive design."),
            "Backend", List.of("Understand REST vs GraphQL trade-offs and when to use each.",
                "Practice designing a RESTful API with proper status codes and error handling.",
                "Revise database indexing, query optimisation, and N+1 problem."),
            "DevOps", List.of("Explain the difference between Docker and a VM.",
                "Walk through a CI/CD pipeline you have built or would build.",
                "Study Kubernetes core objects: Pod, Deployment, Service, Ingress."),
            "AI", List.of("Revise bias-variance trade-off, overfitting, and regularisation.",
                "Be ready to explain gradient descent and backpropagation intuitively.",
                "Study transformer architecture — attention mechanism is frequently asked."),
            "General", List.of("Prepare a concise 2-minute introduction covering your stack and projects.",
                "Practice STAR method for behavioural questions.",
                "Study time complexity (Big-O) for common algorithms.")
        );
        return Map.of("domain", domain, "tips", tips.getOrDefault(domain, tips.get("General")));
    }

    public List<AnalysisResult> getAllResults() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public AnalysisResult saveResult(Map<String, Object> data) {
        try {
            AnalysisResult r = new AnalysisResult();
            r.setResumeSkills(mapper.writeValueAsString(data.get("resumeSkills")));
            r.setJdSkills(mapper.writeValueAsString(data.get("jdSkills")));
            r.setMissingSkills(mapper.writeValueAsString(data.get("missingSkills")));
            r.setMatchedSkills(mapper.writeValueAsString(data.get("matchedSkills")));
            Map<?,?> score = (Map<?,?>) data.get("resumeScore");
            r.setResumeScore((Integer) score.get("score"));
            r.setGrade((String) score.get("grade"));
            Map<?,?> salary = (Map<?,?>) data.get("salary");
            r.setDomain((String) salary.get("domain"));
            Map<?,?> cRange = (Map<?,?>) salary.get("candidateRange");
            r.setSalaryMin(((Number) cRange.get("min")).doubleValue());
            r.setSalaryMax(((Number) cRange.get("max")).doubleValue());
            r.setMatchRatio((Integer) salary.get("matchRatio"));
            r.setRoadmap(mapper.writeValueAsString(data.get("roadmap")));
            r.setInterviewTips(mapper.writeValueAsString(data.get("interviewTips")));
            return repo.save(r);
        } catch (Exception e) {
            System.err.println("DB save error: " + e.getMessage());
            return null;
        }
    }
}
