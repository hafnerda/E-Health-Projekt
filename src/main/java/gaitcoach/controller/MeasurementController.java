package gaitcoach.controller;

import gaitcoach.model.Measurement;
import gaitcoach.service.MeasurementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:8080")
public class MeasurementController {

    private final MeasurementService measurementService;

    public MeasurementController(MeasurementService measurementService) {
        this.measurementService = measurementService;
    }

    @GetMapping("/patients/{patientId}/measurements")
    public List<MeasurementDto> getByPatient(@PathVariable Long patientId) {
        return measurementService.getByPatientId(patientId).stream()
                .map(MeasurementDto::new)
                .toList();
    }

    // Für Report-Seite sehr hilfreich:
    @GetMapping("/measurements/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            Measurement m = measurementService.getById(id);
            return ResponseEntity.ok(new MeasurementDto(m));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/patients/{patientId}/measurements")
    public ResponseEntity<?> createForPatient(
        @PathVariable Long patientId,
        @RequestBody CreateMeasurementRequest req) {

    try {
        Measurement m = new Measurement();
        m.setType(req.type);
        m.setDescription(req.description);
        m.setAttribute(req.attribute);
        m.setReportText(req.reportText);
        // createdAt wird im Service gesetzt

        Measurement saved = measurementService.createForPatient(patientId, m);
        return ResponseEntity.ok(new MeasurementDto(saved));
    } catch (RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
@PostMapping("/measurements/{id}/report-pdf")
public ResponseEntity<?> uploadReportPdf(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
    try {
        measurementService.uploadReportPdf(id, file);
        return ResponseEntity.ok().build();
    } catch (RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
@GetMapping("/measurements/{id}/report-pdf/inline")
public ResponseEntity<?> viewReportPdfInline(@PathVariable Long id) {
    try {
        Measurement m = measurementService.getReportPdfOrThrow(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeName(m.getReportPdfFilename()) + "\"")
                .body(m.getReportPdf());
    } catch (RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
@GetMapping("/measurements/{id}/report-pdf/download")
public ResponseEntity<?> downloadReportPdf(@PathVariable Long id) {
    try {
        Measurement m = measurementService.getReportPdfOrThrow(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeName(m.getReportPdfFilename()) + "\"")
                .body(m.getReportPdf());
    } catch (RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}

// kleiner Helfer gegen kaputte Dateinamen
private static String safeName(String name) {
    if (name == null || name.isBlank()) return "report.pdf";
    return name.replaceAll("[\\r\\n\\\\\"]", "_");
}

    // ----- DTO-Klassen -----
    public static class CreateMeasurementRequest {
        public String type;
        public String description;
        public String attribute;
        public String reportText;
    }



    // DTO (damit Lazy-Loading/Patient nicht im JSON explodiert)
    public static class MeasurementDto {
        public Long id;
        public String createdAt;     // ISO String
        public String type;
        public String description;
        public String attribute;
        public String reportText;
        public Long patientId;

        public MeasurementDto(Measurement m) {
            this.id = m.getId();
            this.createdAt = m.getCreatedAt() != null ? m.getCreatedAt().toString() : null;
            this.type = m.getType();
            this.description = m.getDescription();
            this.attribute = m.getAttribute();
            this.reportText = m.getReportText();
            this.patientId = m.getPatient() != null ? m.getPatient().getId() : null;
        }
    }
}
