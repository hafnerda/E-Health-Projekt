package gaitcoach.service;

import gaitcoach.model.Patient;
import gaitcoach.repository.PatientRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    public Patient getById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient nicht gefunden."));
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
}
