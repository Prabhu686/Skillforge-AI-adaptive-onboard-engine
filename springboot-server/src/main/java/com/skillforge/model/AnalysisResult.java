package com.skillforge.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_results")
@Data
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String resumeSkills;

    @Column(columnDefinition = "TEXT")
    private String jdSkills;

    @Column(columnDefinition = "TEXT")
    private String missingSkills;

    @Column(columnDefinition = "TEXT")
    private String matchedSkills;

    private Integer resumeScore;
    private String grade;
    private String domain;
    private Double salaryMin;
    private Double salaryMax;
    private Integer matchRatio;

    @Column(columnDefinition = "TEXT")
    private String roadmap;

    @Column(columnDefinition = "TEXT")
    private String interviewTips;

    private LocalDateTime createdAt = LocalDateTime.now();
}
