package gaitcoach.repository;

import gaitcoach.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    boolean existsByPatientCode(String patientCode);
    Optional<Patient> findByPatientCode(String patientCode);
}
