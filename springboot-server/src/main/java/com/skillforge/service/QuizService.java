package com.skillforge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillforge.model.QuizResult;
import com.skillforge.repository.QuizResultRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizResultRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();

    public QuizService(QuizResultRepository repo) {
        this.repo = repo;
    }

    // ── Question bank ──────────────────────────────────────────────────────
    private static final Map<String, List<Map<String, String>>> BANK = new LinkedHashMap<>();

    static {
        BANK.put("javascript", List.of(
            q("What is the difference between let, const, and var?",
              "var is function-scoped and hoisted. let and const are block-scoped. const cannot be reassigned."),
            q("What is a closure in JavaScript?",
              "A closure is a function that retains access to its outer scope variables even after the outer function has returned."),
            q("What is the event loop in JavaScript?",
              "The event loop handles async callbacks by checking the call stack and callback queue, executing tasks when the stack is empty.")
        ));
        BANK.put("react", List.of(
            q("What is the virtual DOM in React?",
              "The virtual DOM is an in-memory representation of the real DOM. React uses it to compute minimal changes before updating the actual DOM."),
            q("What is the difference between state and props?",
              "Props are read-only inputs passed from parent to child. State is mutable data managed within a component that triggers re-renders."),
            q("What are React hooks?",
              "Hooks like useState and useEffect let you use state and lifecycle features in functional components without writing a class.")
        ));
        BANK.put("node.js", List.of(
            q("What is the Node.js event-driven architecture?",
              "Node.js uses a single-threaded event loop with non-blocking I/O, registering callbacks instead of waiting for operations to complete."),
            q("What is middleware in Express.js?",
              "Middleware are functions with access to request, response, and next. They can execute code, modify request or response, or end the cycle.")
        ));
        BANK.put("python", List.of(
            q("What is the difference between a list and a tuple in Python?",
              "Lists are mutable with square brackets. Tuples are immutable with parentheses. Tuples are faster and used for fixed data."),
            q("What are Python decorators?",
              "Decorators are functions that wrap another function to extend its behaviour without modifying it, using the @ syntax.")
        ));
        BANK.put("sql", List.of(
            q("What is the difference between INNER JOIN and LEFT JOIN?",
              "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table with NULLs where there is no match."),
            q("What is database indexing?",
              "An index is a data structure that improves data retrieval speed at the cost of additional storage and slower writes.")
        ));
        BANK.put("mongodb", List.of(
            q("What is the difference between SQL and MongoDB?",
              "SQL is relational using tables with a fixed schema. MongoDB is a NoSQL document database storing JSON-like documents with a flexible schema.")
        ));
        BANK.put("docker", List.of(
            q("What is the difference between a Docker image and a container?",
              "An image is a read-only template. A container is a runnable instance of an image."),
            q("What is a Dockerfile?",
              "A Dockerfile is a text file with instructions to build a Docker image, specifying the base image, dependencies, and commands.")
        ));
        BANK.put("aws", List.of(
            q("What is the difference between EC2 and Lambda?",
              "EC2 provides virtual machines where you manage the server. Lambda is serverless and runs code in response to events without managing infrastructure."),
            q("What is S3 used for?",
              "S3 is Amazon's object storage service for storing files, images, backups, and static website assets.")
        ));
        BANK.put("machine learning", List.of(
            q("What is the difference between supervised and unsupervised learning?",
              "Supervised learning trains on labelled data to predict outputs. Unsupervised learning finds patterns in unlabelled data."),
            q("What is overfitting?",
              "Overfitting occurs when a model learns training data too well including noise, causing poor performance on new unseen data.")
        ));
        BANK.put("java", List.of(
            q("What is the difference between an abstract class and an interface in Java?",
              "An abstract class can have method implementations and state. An interface defines a contract with abstract methods, though Java 8 allows default methods."),
            q("What is garbage collection in Java?",
              "Garbage collection is the automatic process of reclaiming memory from objects no longer referenced, managed by the JVM.")
        ));
        BANK.put("spring boot", List.of(
            q("What is Spring Boot auto-configuration?",
              "Auto-configuration automatically configures Spring application based on the dependencies present on the classpath, reducing boilerplate setup."),
            q("What is the difference between @Component, @Service, and @Repository?",
              "All are Spring stereotypes for bean detection. @Service marks business logic, @Repository marks data access and adds exception translation, @Component is generic.")
        ));
        BANK.put("postgresql", List.of(
            q("What is the difference between WHERE and HAVING in SQL?",
              "WHERE filters rows before grouping. HAVING filters groups after a GROUP BY clause has been applied."),
            q("What is a database transaction?",
              "A transaction is a sequence of operations treated as a single unit that is either fully committed or fully rolled back, ensuring ACID properties.")
        ));
        BANK.put("general", List.of(
            q("What is REST API?",
              "REST is an architectural style using HTTP methods GET, POST, PUT, DELETE to perform operations on resources identified by URLs."),
            q("What is the difference between synchronous and asynchronous programming?",
              "Synchronous code blocks until each operation completes. Asynchronous code allows other operations to run while waiting for a task to finish."),
            q("What is object-oriented programming?",
              "OOP is a paradigm based on objects containing data and methods. Its four pillars are encapsulation, inheritance, polymorphism, and abstraction.")
        ));
    }

    private static Map<String, String> q(String question, String answer) {
        return Map.of("question", question, "answer", answer);
    }

    // ── Normalise skill to bank key ────────────────────────────────────────
    private String normalise(String skill) {
        String s = skill.toLowerCase().trim();
        if (s.contains("react"))                          return "react";
        if (s.contains("node"))                           return "node.js";
        if (s.contains("javascript") || s.equals("js"))  return "javascript";
        if (s.contains("python"))                         return "python";
        if (s.contains("sql") && !s.contains("nosql"))   return "sql";
        if (s.contains("mongo"))                          return "mongodb";
        if (s.contains("docker"))                         return "docker";
        if (s.contains("aws") || s.contains("amazon"))   return "aws";
        if (s.contains("machine learning") || s.equals("ml")) return "machine learning";
        if (s.contains("java") && !s.contains("javascript")) return "java";
        if (s.contains("spring"))                         return "spring boot";
        if (s.contains("postgres") || s.contains("psql")) return "postgresql";
        return null;
    }

    // ── Generate quiz ──────────────────────────────────────────────────────
    public List<Map<String, String>> generateQuiz(List<String> skills, int count) {
        List<Map<String, String>> result = new ArrayList<>();
        Set<String> used = new HashSet<>();

        List<String> keys = skills.stream()
            .map(this::normalise).filter(Objects::nonNull).distinct()
            .collect(Collectors.toList());
        Collections.shuffle(keys);

        for (String key : keys) {
            List<Map<String, String>> pool = new ArrayList<>(BANK.getOrDefault(key, List.of()));
            Collections.shuffle(pool);
            for (Map<String, String> item : pool) {
                String id = key + item.get("question");
                if (!used.contains(id)) {
                    used.add(id);
                    Map<String, String> q = new LinkedHashMap<>(item);
                    q.put("skill", key);
                    result.add(q);
                    if (result.size() >= count) return result;
                }
            }
        }

        // Fill from general
        List<Map<String, String>> general = new ArrayList<>(BANK.get("general"));
        Collections.shuffle(general);
        for (Map<String, String> item : general) {
            String id = "general" + item.get("question");
            if (!used.contains(id)) {
                used.add(id);
                Map<String, String> q = new LinkedHashMap<>(item);
                q.put("skill", "general");
                result.add(q);
                if (result.size() >= count) break;
            }
        }
        return result;
    }

    // ── Evaluate answer ────────────────────────────────────────────────────
    public Map<String, Object> evaluateAnswer(String userAnswer, String correctAnswer) {
        if (userAnswer == null || userAnswer.trim().length() < 3) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("correct", false);
            empty.put("score", 0);
            return empty;
        }

        String[] keywords = correctAnswer.toLowerCase()
            .replaceAll("[^a-z0-9\\s]", " ").split("\\s+");
        String userLower = userAnswer.toLowerCase();

        long hits = Arrays.stream(keywords)
            .filter(k -> k.length() > 3 && userLower.contains(k)).count();
        long total = Arrays.stream(keywords).filter(k -> k.length() > 3).count();

        int score = total > 0 ? (int) Math.round((double) hits / total * 100) : 0;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("correct", score >= 35);
        result.put("score", score);
        return result;
    }

    // ── Persist quiz result ────────────────────────────────────────────────
    public QuizResult saveQuizResult(List<String> skills, List<Map<String, Object>> answers) {
        try {
            int correct = (int) answers.stream()
                .filter(a -> Boolean.TRUE.equals(a.get("correct"))).count();
            int pct = answers.isEmpty() ? 0 : (int) Math.round((double) correct / answers.size() * 100);

            QuizResult r = new QuizResult();
            r.setSkills(mapper.writeValueAsString(skills));
            r.setTotalQuestions(answers.size());
            r.setCorrectCount(correct);
            r.setScorePercent(pct);
            r.setQuestionsJson(mapper.writeValueAsString(answers));
            return repo.save(r);
        } catch (Exception e) {
            System.err.println("Quiz save error: " + e.getMessage());
            return null;
        }
    }

    public List<QuizResult> getHistory() {
        return repo.findAllByOrderByCreatedAtDesc();
    }
}
