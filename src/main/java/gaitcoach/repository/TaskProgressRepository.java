package ehealth.repository;

import ehealth.model.TaskAssignment;
import ehealth.model.TaskProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface TaskProgressRepository extends JpaRepository<TaskProgress, Long> {
    Optional<TaskProgress> findByAssignmentAndProgressDate(TaskAssignment assignment, LocalDate progressDate);
    List<TaskProgress> findByAssignment(TaskAssignment assignment);
}
