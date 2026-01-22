package gaitcoach.controller;

import gaitcoach.model.TaskAssignment;
import gaitcoach.model.TaskProgress;
import gaitcoach.services.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // ===== DTOs =====
    public static class CreateTaskRequest {
        public String title;
        public String description;
        public String startDate; // "2026-01-08"
        public String dueDate;   // "2026-01-11"
        public Integer timesPerDay; // 3
    }

    public static class TaskResponse {
        public Long id;
        public String title;
        public String description;
        public String startDate;
        public String dueDate;
        public int timesPerDay;
        public boolean active;

        public int requiredTotal;
        public int doneTotal;

        public TaskResponse(TaskAssignment a, int requiredTotal, int doneTotal) {
            this.id = a.getId();
            this.title = a.getTitle();
            this.description = a.getDescription();
            this.startDate = a.getStartDate().toString();
            this.dueDate = a.getDueDate().toString();
            this.timesPerDay = a.getTimesPerDay();
            this.active = a.isActive();
            this.requiredTotal = requiredTotal;
            this.doneTotal = doneTotal;
        }
    }

    public static class DoneRequest {
        public String date; // optional "2026-01-08"
    }

    public static class ProgressResponse {
        public Long assignmentId;
        public String date;
        public int doneCount;
        public int timesPerDay;

        public ProgressResponse(Long assignmentId, String date, int doneCount, int timesPerDay) {
            this.assignmentId = assignmentId;
            this.date = date;
            this.doneCount = doneCount;
            this.timesPerDay = timesPerDay;
        }
    }

    // ===== THERAPEUT: Aufgabe anlegen =====
    @PostMapping("/api/patients/{patientId}/tasks")
    public ResponseEntity<?> create(@PathVariable Long patientId, @RequestBody CreateTaskRequest req) {
        try {
            LocalDate sd = LocalDate.parse(req.startDate);
            LocalDate dd = LocalDate.parse(req.dueDate);
            int tpd = req.timesPerDay != null ? req.timesPerDay : 1;

            TaskAssignment a = taskService.createTask(patientId, req.title, req.description, sd, dd, tpd);
            int required = taskService.requiredTotal(a);
            int done = taskService.doneTotal(a);
            return ResponseEntity.ok(new TaskResponse(a, required, done));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // ===== PATIENT/THERAPEUT: Aufgabenliste (mit Gesamtfortschritt) =====
    @GetMapping("/api/patients/{patientId}/tasks")
    public List<TaskResponse> list(@PathVariable Long patientId) {
        return taskService.getTasksForPatient(patientId).stream()
                .map(a -> new TaskResponse(a, taskService.requiredTotal(a), taskService.doneTotal(a)))
                .toList();
    }

    // ===== PATIENT: +1 erledigt für Datum =====
    @PostMapping("/api/tasks/{assignmentId}/done")
    public ResponseEntity<?> done(@PathVariable Long assignmentId, @RequestBody(required = false) DoneRequest req) {
        try {
            LocalDate date = (req != null && req.date != null && !req.date.isBlank())
                    ? LocalDate.parse(req.date)
                    : LocalDate.now();

            var pr = taskService.markDone(assignmentId, date);

            // timesPerDay aus Assignment holen
            var a = pr.getAssignment();
            return ResponseEntity.ok(new ProgressResponse(a.getId(), date.toString(), pr.getDoneCount(), a.getTimesPerDay()));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }


    @PostMapping("/api/tasks/{assignmentId}/undo")
    public ResponseEntity<?> undo(@PathVariable Long assignmentId,
                                @RequestBody(required = false) DoneRequest req) {
        try {
            LocalDate date = (req != null && req.date != null && !req.date.isBlank())
                    ? LocalDate.parse(req.date)
                    : LocalDate.now();

            var pr = taskService.undoDone(assignmentId, date);

            var a = pr.getAssignment();
            return ResponseEntity.ok(new ProgressResponse(
                    a.getId(),
                    date.toString(),
                    pr.getDoneCount(),
                    a.getTimesPerDay()
            ));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
    @GetMapping("/api/tasks/{assignmentId}/progress")
    public ResponseEntity<?> getProgress(
            @PathVariable Long assignmentId,
            @RequestParam(required = false) String date) {

        LocalDate d = (date != null)
                ? LocalDate.parse(date)
                : LocalDate.now();

        TaskProgress pr = taskService.getProgress(assignmentId, d);
        TaskAssignment a = pr.getAssignment();

        return ResponseEntity.ok(new ProgressResponse(
                a.getId(),
                d.toString(),
                pr.getDoneCount(),
                a.getTimesPerDay()
        ));
    }



}
