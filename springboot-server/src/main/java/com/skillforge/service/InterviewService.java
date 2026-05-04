package com.skillforge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillforge.model.InterviewResult;
import com.skillforge.repository.InterviewResultRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.codec.ClientCodecConfigurer;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    @Value("${openai.api.key}")
    private String openAiKey;

    @Value("${openai.model}")
    private String model;

    private final InterviewResultRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .exchangeStrategies(ExchangeStrategies.builder()
                .codecs(ClientCodecConfigurer::defaultCodecs)
                .build())
            .build();

    public InterviewService(InterviewResultRepository repo) {
        this.repo = repo;
    }

    // ── Generate interview questions via OpenAI ────────────────────────────
    public List<Map<String, String>> generateQuestions(List<String> skills, String domain, int count) {
        if (skills == null) skills = new ArrayList<>();
        if (openAiKey == null || openAiKey.isBlank()) {
            return generateFallbackQuestions(skills, domain, count);
        }
        try {
            String skillList = String.join(", ", skills.subList(0, Math.min(skills.size(), 8)));
            String prompt = String.format(
                "You are a senior technical interviewer. Generate %d interview questions for a %s developer " +
                "with skills in: %s. For each question provide: a clear technical question, " +
                "the ideal answer (2-3 sentences), and the skill it tests. " +
                "Return a JSON object with a 'questions' array. Each item must have: " +
                "'question' (string), 'idealAnswer' (string), 'skill' (string), 'difficulty' (Easy/Medium/Hard).",
                count, domain, skillList
            );

            String body = String.format("""
                {
                  "model": "%s",
                  "messages": [
                    {"role": "system", "content": "You are a technical interview question generator. Always return valid JSON."},
                    {"role": "user", "content": "%s"}
                  ],
                  "temperature": 0.7,
                  "response_format": {"type": "json_object"}
                }
                """, model, prompt.replace("\"", "\\\"").replace("\n", "\\n"));

            String response = webClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + openAiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root    = mapper.readTree(response);
            String content   = root.path("choices").get(0).path("message").path("content").asText();
            JsonNode parsed  = mapper.readTree(content);
            JsonNode qArray  = parsed.path("questions");

            List<Map<String, String>> questions = new ArrayList<>();
            if (qArray.isArray()) {
                qArray.forEach(q -> {
                    Map<String, String> item = new LinkedHashMap<>();
                    item.put("question",    q.path("question").asText());
                    item.put("idealAnswer", q.path("idealAnswer").asText());
                    item.put("skill",       q.path("skill").asText());
                    item.put("difficulty",  q.path("difficulty").asText("Medium"));
                    questions.add(item);
                });
            }
            return questions.isEmpty() ? generateFallbackQuestions(skills, domain, count) : questions;
        } catch (Exception e) {
            System.err.println("OpenAI question gen failed: " + e.getMessage());
            return generateFallbackQuestions(skills, domain, count);
        }
    }

    // ── Evaluate a single answer via OpenAI ───────────────────────────────
    public Map<String, Object> evaluateAnswer(String question, String idealAnswer, String userAnswer) {
        if (userAnswer == null || userAnswer.trim().length() < 5) {
            return Map.of("score", 0, "feedback", "No answer provided.", "correct", false);
        }
        if (openAiKey == null || openAiKey.isBlank()) {
            return fallbackEvaluate(idealAnswer, userAnswer);
        }
        try {
            String prompt = String.format(
                "Question: %s\\nIdeal Answer: %s\\nCandidate Answer: %s\\n\\n" +
                "Evaluate the candidate answer. Return JSON with: " +
                "'score' (0-100 integer), 'feedback' (1-2 sentences of constructive feedback), " +
                "'correct' (boolean, true if score >= 50), 'strongPoints' (string), 'improvements' (string).",
                question.replace("\"","'"), idealAnswer.replace("\"","'"), userAnswer.replace("\"","'")
            );

            String body = String.format("""
                {
                  "model": "%s",
                  "messages": [
                    {"role": "system", "content": "You are a technical interview evaluator. Return only valid JSON."},
                    {"role": "user", "content": "%s"}
                  ],
                  "temperature": 0.3,
                  "response_format": {"type": "json_object"}
                }
                """, model, prompt.replace("\n", "\\n"));

            String response = webClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + openAiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root    = mapper.readTree(response);
            String content   = root.path("choices").get(0).path("message").path("content").asText();
            JsonNode parsed  = mapper.readTree(content);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("score",        parsed.path("score").asInt(0));
            result.put("feedback",     parsed.path("feedback").asText(""));
            result.put("correct",      parsed.path("correct").asBoolean(false));
            result.put("strongPoints", parsed.path("strongPoints").asText(""));
            result.put("improvements", parsed.path("improvements").asText(""));
            return result;
        } catch (Exception e) {
            return fallbackEvaluate(idealAnswer, userAnswer);
        }
    }

    // ── Save interview result to PostgreSQL ───────────────────────────────
    public InterviewResult saveResult(Map<String, Object> data) {
        try {
            @SuppressWarnings("unchecked")
            List<String> skills = (List<String>) data.getOrDefault("skills", List.of());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> answers = (List<Map<String, Object>>) data.getOrDefault("answers", List.of());

            int total     = answers.size();
            int answered  = (int) answers.stream().filter(a -> !((String) a.getOrDefault("userAnswer","")).isBlank()).count();
            int totalScore = answers.stream().mapToInt(a -> ((Number) a.getOrDefault("score", 0)).intValue()).sum();
            int overall   = total > 0 ? totalScore / total : 0;

            List<String> weakAreas = answers.stream()
                .filter(a -> ((Number) a.getOrDefault("score", 0)).intValue() < 50)
                .map(a -> (String) a.getOrDefault("skill", ""))
                .filter(s -> !s.isBlank()).distinct().collect(Collectors.toList());

            InterviewResult r = new InterviewResult();
            r.setDomain((String) data.getOrDefault("domain", "General"));
            r.setSkills(mapper.writeValueAsString(skills));
            r.setTotalQuestions(total);
            r.setAnsweredCount(answered);
            r.setOverallScore(overall);
            r.setQuestionsJson(mapper.writeValueAsString(answers));
            r.setWeakAreas(mapper.writeValueAsString(weakAreas));
            return repo.save(r);
        } catch (Exception e) {
            System.err.println("Interview save error: " + e.getMessage());
            return null;
        }
    }

    public List<InterviewResult> getHistory() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    // ── Fallbacks (no OpenAI key) ─────────────────────────────────────────
    private List<Map<String, String>> generateFallbackQuestions(List<String> skills, String domain, int count) {
        List<String[]> bank = new ArrayList<>(List.of(
            new String[]{"Explain the difference between REST and GraphQL.", "REST uses fixed endpoints per resource. GraphQL uses a single endpoint and lets clients request exactly the data they need, reducing over-fetching.", "API Design", "Medium"},
            new String[]{"What is the difference between SQL and NoSQL databases?", "SQL databases are relational with fixed schemas. NoSQL databases are flexible, schema-less, and better for unstructured or rapidly changing data.", "Database", "Easy"},
            new String[]{"What is Docker and why is it used?", "Docker is a containerisation platform that packages applications with their dependencies into containers, ensuring consistent environments across development and production.", "DevOps", "Easy"},
            new String[]{"Explain the concept of microservices.", "Microservices is an architecture where an application is split into small, independent services that communicate via APIs, allowing independent deployment and scaling.", "System Design", "Medium"},
            new String[]{"What is CI/CD and why is it important?", "CI/CD automates building, testing, and deploying code. It reduces manual errors, speeds up delivery, and ensures code is always in a deployable state.", "DevOps", "Medium"},
            new String[]{"What is the event loop in Node.js?", "The event loop allows Node.js to perform non-blocking I/O by offloading operations to the system kernel and executing callbacks when operations complete.", "Backend", "Medium"},
            new String[]{"What is the virtual DOM in React?", "The virtual DOM is an in-memory representation of the real DOM. React uses it to compute minimal changes before updating the actual DOM, improving performance.", "Frontend", "Easy"},
            new String[]{"Explain overfitting in machine learning.", "Overfitting occurs when a model learns training data too well including noise, causing poor generalisation to new unseen data. It is addressed with regularisation and more data.", "AI/ML", "Medium"},
            new String[]{"What is the difference between authentication and authorisation?", "Authentication verifies who you are. Authorisation determines what you are allowed to do. JWT handles both by encoding user identity and roles in a token.", "Security", "Easy"},
            new String[]{"What is database indexing?", "An index is a data structure that speeds up data retrieval at the cost of extra storage and slower writes. B-tree indexes are most common in relational databases.", "Database", "Medium"}
        ));
        Collections.shuffle(bank);
        List<Map<String, String>> questions = new ArrayList<>();
        for (int i = 0; i < Math.min(count, bank.size()); i++) {
            String[] q = bank.get(i);
            Map<String, String> item = new LinkedHashMap<>();
            item.put("question",    q[0]);
            item.put("idealAnswer", q[1]);
            item.put("skill",       q[2]);
            item.put("difficulty",  q[3]);
            questions.add(item);
        }
        return questions;
    }

    private Map<String, Object> fallbackEvaluate(String idealAnswer, String userAnswer) {
        String[] keywords = idealAnswer.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+");
        String userLower  = userAnswer.toLowerCase();
        long hits  = Arrays.stream(keywords).filter(k -> k.length() > 3 && userLower.contains(k)).count();
        long total = Arrays.stream(keywords).filter(k -> k.length() > 3).count();
        int score  = total > 0 ? (int) Math.round((double) hits / total * 100) : 0;
        return Map.of("score", score, "correct", score >= 50,
            "feedback", score >= 50 ? "Good answer covering key concepts." : "Review the ideal answer for key concepts.",
            "strongPoints", score >= 50 ? "Covered main points." : "",
            "improvements", score < 50 ? "Focus on: " + idealAnswer.substring(0, Math.min(80, idealAnswer.length())) : "");
    }
}
