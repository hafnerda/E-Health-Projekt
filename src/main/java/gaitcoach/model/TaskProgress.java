package ehealth.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"assignment_id", "progressDate"})
})
public class TaskProgress {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private TaskAssignment assignment;

    @Column(nullable = false)
    private LocalDate progressDate;

    @Column(nullable = false)
    private int doneCount = 0;

    public Long getId() { return id; }

    public TaskAssignment getAssignment() { return assignment; }
    public void setAssignment(TaskAssignment assignment) { this.assignment = assignment; }

    public LocalDate getProgressDate() { return progressDate; }
    public void setProgressDate(LocalDate progressDate) { this.progressDate = progressDate; }

    public int getDoneCount() { return doneCount; }
    public void setDoneCount(int doneCount) { this.doneCount = doneCount; }
}
