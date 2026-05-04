package com.skillforge.repository;

import com.skillforge.model.InterviewResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewResultRepository extends JpaRepository<InterviewResult, Long> {
    List<InterviewResult> findAllByOrderByCreatedAtDesc();
}
