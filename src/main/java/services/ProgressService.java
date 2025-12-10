package services;

import model.ProgressEntry;

import java.time.LocalDate;
import java.util.List;

public interface ProgressService {

    List<ProgressEntry> getProgressForUserInRange(Long userId, LocalDate from, LocalDate to);

    ProgressEntry addProgressEntry(Long userId, ProgressEntry entry);
}