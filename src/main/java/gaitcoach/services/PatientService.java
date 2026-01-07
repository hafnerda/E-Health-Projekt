package gaitcoach.service;
import gaitcoach.model.User;
import gaitcoach.model.UserRole;
import gaitcoach.repository.UserRepository;
import gaitcoach.model.Patient;
import gaitcoach.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    public PatientService(PatientRepository patientRepository,
                          UserRepository userRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }


    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    public Patient getById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient nicht gefunden."));
    }

    public Patient getByUserId(Long userId) {
        return patientRepository.findByPatientUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("Patient nicht gefunden für userId=" + userId));
}


    public Patient create(Patient p) {
        if (p.getPatientCode() == null || p.getPatientCode().trim().isEmpty()) {
            throw new RuntimeException("Patienten-ID (patientCode) fehlt.");
        }
        if (patientRepository.existsByPatientCode(p.getPatientCode())) {
            throw new RuntimeException("Patienten-ID existiert bereits.");
        }
        if (p.getFirstName() == null || p.getFirstName().trim().isEmpty()) {
            throw new RuntimeException("Vorname fehlt.");
        }
        if (p.getLastName() == null || p.getLastName().trim().isEmpty()) {
            throw new RuntimeException("Nachname fehlt.");
        }
        if (p.getGender() == null || p.getGender().trim().isEmpty()) {
            p.setGender("d");
        }
        return patientRepository.save(p);
    }

    public Patient update(Long id, Patient updated) {
        Patient existing = getById(id);

        // patientCode nur ändern, wenn er wirklich neu ist
        if (updated.getPatientCode() != null && !updated.getPatientCode().equals(existing.getPatientCode())) {
            if (patientRepository.existsByPatientCode(updated.getPatientCode())) {
                throw new RuntimeException("Patienten-ID existiert bereits.");
            }
            existing.setPatientCode(updated.getPatientCode());
        }

        if (updated.getGender() != null) existing.setGender(updated.getGender());
        if (updated.getFirstName() != null) existing.setFirstName(updated.getFirstName());
        if (updated.getLastName() != null) existing.setLastName(updated.getLastName());
        if (updated.getBirthDate() != null) existing.setBirthDate(updated.getBirthDate());
        if (updated.getWeightKg() != null) existing.setWeightKg(updated.getWeightKg());
        if (updated.getHeightCm() != null) existing.setHeightCm(updated.getHeightCm());
        if (updated.getLastMeasurementDate() != null) existing.setLastMeasurementDate(updated.getLastMeasurementDate());

        return patientRepository.save(existing);
    }

    public void delete(Long id) {
        Patient existing = getById(id);
        patientRepository.delete(existing);
    }

    public Patient createWithLogin(Patient p, String email, String rawPassword) {
        if (email == null || email.trim().isEmpty()) throw new RuntimeException("E-Mail fehlt.");
        if (rawPassword == null || rawPassword.trim().isEmpty()) throw new RuntimeException("Passwort fehlt.");

        String emailLower = email.toLowerCase().trim();
        if (userRepository.existsByEmail(emailLower)) {
            throw new RuntimeException("E-Mail bereits registriert.");
        }

        // Patient-Validierung (wie vorher)
        if (p.getPatientCode() == null || p.getPatientCode().trim().isEmpty())
            throw new RuntimeException("Patienten-ID (patientCode) fehlt.");
        if (patientRepository.existsByPatientCode(p.getPatientCode()))
            throw new RuntimeException("Patienten-ID existiert bereits.");
        if (p.getFirstName() == null || p.getFirstName().trim().isEmpty())
            throw new RuntimeException("Vorname fehlt.");
        if (p.getLastName() == null || p.getLastName().trim().isEmpty())
            throw new RuntimeException("Nachname fehlt.");
        if (p.getGender() == null || p.getGender().trim().isEmpty())
            p.setGender("d");

        // PATIENT-User erzeugen
        String hash = passwordEncoder.encode(rawPassword);
        User patientUser = new User(emailLower, p.getFirstName() + " " + p.getLastName(), hash, UserRole.PATIENT);
        User savedUser = userRepository.save(patientUser);

        // Verknüpfen & Patient speichern
        p.setPatientUser(savedUser);
        return patientRepository.save(p);
    }

}
