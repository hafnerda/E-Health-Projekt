package gaitcoach.repository;

import gaitcoach.model.Measurement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeasurementRepository extends JpaRepository<Measurement, Long> {
    List<Measurement> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
