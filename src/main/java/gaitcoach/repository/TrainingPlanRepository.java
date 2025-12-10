package gaitcoach.repository;

import gaitcoach.model.TrainingPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TrainingPlanRepository extends JpaRepository<TrainingPlan, Long> {

    List<TrainingPlan> findByUserIdAndValidFromLessThanEqualAndValidToGreaterThanEqual(
            Long userId, LocalDate from, LocalDate to);
}