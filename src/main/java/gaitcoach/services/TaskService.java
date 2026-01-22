package ehealth.service;

import ehealth.model.Patient;
import ehealth.model.TaskAssignment;
import ehealth.model.TaskProgress;
import ehealth.repository.PatientRepository;
import ehealth.repository.TaskAssignmentRepository;
import ehealth.repository.TaskProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TaskService {

    private final PatientRepository patientRepository;
    private final TaskAssignmentRepository assignmentRepository;
    private final TaskProgressRepository progressRepository;

    public TaskService(PatientRepository patientRepository,
                       TaskAssignmentRepository assignmentRepository,
                       TaskProgressRepository progressRepository) {
        this.patientRepository = patientRepository;
        this.assignmentRepository = assignmentRepository;
        this.progressRepository = progressRepository;
    }

    public List<TaskAssignment> getTasksForPatient(Long patientId) {
        Patient p = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient nicht gefunden"));
        return assignmentRepository.findByPatientOrderByDueDateAsc(p);
    }

    public TaskAssignment createTask(Long patientId, String title, String description,
                                     LocalDate startDate, LocalDate dueDate, int timesPerDay) {

        if (title == null || title.isBlank()) throw new RuntimeException("Titel fehlt");
        if (startDate == null || dueDate == null) throw new RuntimeException("Start/Due fehlen");
        if (dueDate.isBefore(startDate)) throw new RuntimeException("dueDate darf nicht vor startDate liegen");
        if (timesPerDay < 1 || timesPerDay > 20) throw new RuntimeException("timesPerDay ungültig");

        Patient p = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient nicht gefunden"));

        TaskAssignment a = new TaskAssignment();
        a.setPatient(p);
        a.setTitle(title);
        a.setDescription(description);
        a.setStartDate(startDate);
        a.setDueDate(dueDate);
        a.setTimesPerDay(timesPerDay);

        return assignmentRepository.save(a);
    }

    public TaskProgress markDone(Long assignmentId, LocalDate date) {
    TaskAssignment a = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Aufgabe nicht gefunden"));

    if (!a.isActive()) throw new RuntimeException("Aufgabe ist nicht aktiv");

    // 👉 FIX: finale Variable erzeugen
    final LocalDate progressDate = (date != null) ? date : LocalDate.now();

    if (progressDate.isBefore(a.getStartDate()) || progressDate.isAfter(a.getDueDate())) {
        throw new RuntimeException("Datum liegt außerhalb des Aufgabenzeitraums");
    }

    TaskProgress pr = progressRepository
            .findByAssignmentAndProgressDate(a, progressDate)
            .orElseGet(() -> {
                TaskProgress x = new TaskProgress();
                x.setAssignment(a);
                x.setProgressDate(progressDate);
                x.setDoneCount(0);
                return x;
            });

    if (pr.getDoneCount() >= a.getTimesPerDay()) return pr;

    pr.setDoneCount(pr.getDoneCount() + 1);
    return progressRepository.save(pr);
}


    public int requiredTotal(TaskAssignment a) {
        long days = ChronoUnit.DAYS.between(a.getStartDate(), a.getDueDate()) + 1;
        return (int) days * a.getTimesPerDay();
    }

    public int doneTotal(TaskAssignment a) {
        return progressRepository.findByAssignment(a).stream().mapToInt(TaskProgress::getDoneCount).sum();
    }

    public TaskProgress getProgressForDate(TaskAssignment a, LocalDate date) {
        return progressRepository.findByAssignmentAndProgressDate(a, date)
                .orElseGet(() -> {
                    TaskProgress x = new TaskProgress();
                    x.setAssignment(a);
                    x.setProgressDate(date);
                    x.setDoneCount(0);
                    return x;
                });
    }

    public TaskProgress undoDone(Long assignmentId, LocalDate date) {
        TaskAssignment a = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Aufgabe nicht gefunden"));

        if (!a.isActive()) throw new RuntimeException("Aufgabe ist nicht aktiv");

        final LocalDate progressDate = (date != null) ? date : LocalDate.now();

        if (progressDate.isBefore(a.getStartDate()) || progressDate.isAfter(a.getDueDate())) {
            throw new RuntimeException("Datum liegt außerhalb des Aufgabenzeitraums");
        }

        TaskProgress pr = progressRepository.findByAssignmentAndProgressDate(a, progressDate)
                .orElseThrow(() -> new RuntimeException("Noch nichts zum Rückgängig machen"));

        if (pr.getDoneCount() <= 0) return pr;

        pr.setDoneCount(pr.getDoneCount() - 1);
        return progressRepository.save(pr);
    }

    public TaskProgress getProgress(Long assignmentId, LocalDate date) {
        TaskAssignment a = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Aufgabe nicht gefunden"));

        LocalDate d = (date != null) ? date : LocalDate.now();

        return progressRepository
                .findByAssignmentAndProgressDate(a, d)
                .orElseGet(() -> {
                    TaskProgress p = new TaskProgress();
                    p.setAssignment(a);
                    p.setProgressDate(d);
                    p.setDoneCount(0);
                    return p;
                });
    }



}
