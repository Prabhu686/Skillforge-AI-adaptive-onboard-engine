package com.skillforge.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_results")
@Data
public class InterviewResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String domain;
    private Integer totalQuestions;
    private Integer answeredCount;
    private Integer overallScore;       // 0-100

    @Column(columnDefinition = "TEXT")
    private String skills;              // JSON array

    @Column(columnDefinition = "TEXT")
    private String questionsJson;       // full Q&A + feedback JSON

    @Column(columnDefinition = "TEXT")
    private String weakAreas;           // JSON array of weak skill areas

    private LocalDateTime createdAt = LocalDateTime.now();
}
