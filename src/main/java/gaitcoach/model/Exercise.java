package gaitcoach.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    private int repetitionsPerDay;
    private int daysPerWeek;

    @ManyToOne
    private TrainingPlan trainingPlan;
}