package gaitcoach.repository;

import gaitcoach.model.Patient;
import gaitcoach.model.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {
    List<TaskAssignment> findByPatientOrderByDueDateAsc(Patient patient);
}
