package com.skillforge.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

@Service
public class SkillExtractorService {

    @Value("${openai.api.key}")
    private String openAiKey;

    @Value("${openai.model}")
    private String model;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .build();

    private static final List<String> SKILL_TAXONOMY = List.of(
        "JavaScript","TypeScript","Python","Java","C","C++","C#","Go","Rust","Ruby",
        "PHP","Swift","Kotlin","Scala","R","MATLAB","Bash","Shell","SQL","NoSQL",
        "React","Vue","Angular","Next.js","Svelte","HTML","CSS","Tailwind","Bootstrap",
        "Redux","GraphQL","REST","WebSockets","Webpack","Vite",
        "Node.js","Express","Django","Flask","FastAPI","Spring Boot","Laravel",
        "ASP.NET","Ruby on Rails","NestJS",
        "MongoDB","PostgreSQL","MySQL","SQLite","Redis","Elasticsearch","DynamoDB",
        "Cassandra","Firebase","Supabase",
        "AWS","Azure","GCP","Docker","Kubernetes","Terraform","CI/CD","GitHub Actions",
        "Jenkins","Ansible","Linux","Nginx","Apache",
        "Machine Learning","Deep Learning","NLP","TensorFlow","PyTorch","scikit-learn",
        "Pandas","NumPy","OpenAI","LangChain","Hugging Face","Computer Vision",
        "Agile","Scrum","Git","Jira","Communication","Leadership","Problem Solving",
        "System Design","Microservices","Testing","Unit Testing"
    );

    public List<String> extractSkills(String text) {
        if (openAiKey != null && !openAiKey.isBlank()) {
            try {
                return extractWithOpenAI(text);
            } catch (Exception e) {
                System.out.println("OpenAI fallback: " + e.getMessage());
            }
        }
        return extractWithTaxonomy(text);
    }

    private List<String> extractWithOpenAI(String text) {
        String body = """
            {
              "model": "%s",
              "messages": [
                {"role":"system","content":"Extract only technical and professional skills from the text. Return a JSON object with a 'skills' array of strings only."},
                {"role":"user","content":"%s"}
              ],
              "temperature": 0,
              "response_format": {"type":"json_object"}
            }
            """.formatted(model, text.substring(0, Math.min(text.length(), 6000)).replace("\"", "\\\"").replace("\n", "\\n"));

        String response = webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + openAiKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            String content = root.path("choices").get(0).path("message").path("content").asText();
            JsonNode parsed = mapper.readTree(content);
            JsonNode skillsNode = parsed.path("skills");
            List<String> skills = new ArrayList<>();
            if (skillsNode.isArray()) {
                skillsNode.forEach(s -> skills.add(s.asText().trim()));
            }
            return skills;
        } catch (Exception e) {
            return extractWithTaxonomy(text);
        }
    }

    private List<String> extractWithTaxonomy(String text) {
        String upper = text.toUpperCase();
        return SKILL_TAXONOMY.stream()
                .filter(skill -> upper.contains(skill.toUpperCase()))
                .toList();
    }
}
