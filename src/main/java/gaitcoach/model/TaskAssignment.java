package gaitcoach.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class TaskAssignment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Patient patient;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private int timesPerDay;

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() { return id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public int getTimesPerDay() { return timesPerDay; }
    public void setTimesPerDay(int timesPerDay) { this.timesPerDay = timesPerDay; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
