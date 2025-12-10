package controller;

import model.ProgressEntry;
import services.ProgressService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/progress")
@CrossOrigin
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    public List<ProgressEntry> getProgress(
            @PathVariable Long userId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        return progressService.getProgressForUserInRange(userId, from, to);
    }

    @PostMapping
    public ProgressEntry addProgress(
            @PathVariable Long userId,
            @RequestBody ProgressEntry entry) {
        return progressService.addProgressEntry(userId, entry);
    }
}