package gaitcoach.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    // Patienten werden einem Therapeuten zugeordnet (optional)
    @ManyToOne
    @JoinColumn(name = "therapist_id")
    private User therapist;

    public User() {
    }

    public User(String email, String name, String passwordHash, UserRole role) {
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    // Getter / Setter

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public User getTherapist() {
        return therapist;
    }

    public void setTherapist(User therapist) {
        this.therapist = therapist;
    }
}
