package gaitcoach.repository;

import gaitcoach.model.ProgressEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ProgressRepository extends JpaRepository<ProgressEntry, Long> {

    List<ProgressEntry> findByUserIdAndDateBetween(Long userId,
            LocalDate from,
            LocalDate to);
}