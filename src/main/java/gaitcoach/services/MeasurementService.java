package gaitcoach.service;

import gaitcoach.model.Measurement;
import gaitcoach.repository.MeasurementRepository;
import org.springframework.stereotype.Service;
import gaitcoach.model.Patient;
import gaitcoach.repository.PatientRepository;
import java.time.LocalDateTime;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
public class MeasurementService {

    private final MeasurementRepository measurementRepository;
    private final PatientRepository patientRepository;

    public MeasurementService(MeasurementRepository measurementRepository, PatientRepository patientRepository) {
        this.measurementRepository = measurementRepository;
        this.patientRepository = patientRepository;
    }

    public List<Measurement> getByPatientId(Long patientId) {
        return measurementRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public Measurement getById(Long id) {
        return measurementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Messung nicht gefunden."));
    }

    public Measurement createForPatient(Long patientId, Measurement m) {
        Patient p = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient nicht gefunden."));

        m.setPatient(p);
        if (m.getCreatedAt() == null) m.setCreatedAt(LocalDateTime.now());
        if (m.getType() == null || m.getType().trim().isEmpty()) m.setType("Unbekannt");

        Measurement saved = measurementRepository.save(m);

        // Optional: lastMeasurementDate im Patient updaten (nur Datum)
        // Wenn du das willst, sag kurz Bescheid, dann baue ich es sauber ein.
        return saved;
    }

    public void uploadReportPdf(Long measurementId, MultipartFile file) {
        Measurement m = getById(measurementId);

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Keine PDF ausgewählt.");
        }

        String ct = file.getContentType();
        if (ct == null || !ct.toLowerCase().contains("pdf")) {
            throw new RuntimeException("Nur PDF-Dateien sind erlaubt.");
        }

        try {
            m.setReportPdf(file.getBytes());
            m.setReportPdfFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "report.pdf");
            m.setReportPdfContentType(ct);
            measurementRepository.save(m);
        } catch (Exception e) {
            throw new RuntimeException("PDF konnte nicht gespeichert werden: " + e.getMessage());
        }
    }

    public Measurement getReportPdfOrThrow(Long measurementId) {
        Measurement m = getById(measurementId);
        if (m.getReportPdf() == null || m.getReportPdf().length == 0) {
            throw new RuntimeException("Für diese Messung ist noch keine PDF hinterlegt.");
        }
        return m;
    }
}

