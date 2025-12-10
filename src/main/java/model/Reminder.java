package model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity

public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;

    private LocalDateTime remindAt;

    private boolean done = false;

    @ManyToOne
    private User user;
}