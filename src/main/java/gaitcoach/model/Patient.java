package gaitcoach.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // UI: Geschlecht (z.B. "m", "w", "d")
    @Column(nullable = false, length = 10)
    private String gender;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_user_id", nullable = false, unique = true)
    private User patientUser;

    

    // UI: Geburtsdatum
    private LocalDate birthDate;

    // UI: Patienten-ID (z.B. "P-1002")
    @Column(nullable = false, unique = true, length = 50)
    private String patientCode;

    // UI: Gewicht / Körpergröße
    private Double weightKg;
    private Double heightCm;

    // UI: Letzte Messung (später automatisch aus Messungen)
    private LocalDate lastMeasurementDate;

    public Patient() {}

    // Getter/Setter
    public Long getId() { return id; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public String getPatientCode() { return patientCode; }
    public void setPatientCode(String patientCode) { this.patientCode = patientCode; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }

    public LocalDate getLastMeasurementDate() { return lastMeasurementDate; }
    public void setLastMeasurementDate(LocalDate lastMeasurementDate) { this.lastMeasurementDate = lastMeasurementDate; }

    public User getPatientUser() { return patientUser; }
    public void setPatientUser(User patientUser) { this.patientUser = patientUser; }
}
