package com.skillforge.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_results")
@Data
public class QuizResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String skills;          // JSON array of skills used to generate quiz

    private Integer totalQuestions;
    private Integer correctCount;
    private Integer scorePercent;

    @Column(columnDefinition = "TEXT")
    private String questionsJson;   // full Q&A JSON for review

    private LocalDateTime createdAt = LocalDateTime.now();
}
