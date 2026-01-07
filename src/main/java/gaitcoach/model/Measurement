package gaitcoach.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "measurements")
public class Measurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Beziehung: viele Messungen -> ein Patient
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false, length = 80)
    private String type; // z.B. "Gangbild"

    @Column(length = 255)
    private String description;

    @Column(length = 80)
    private String attribute; // z.B. "UWB", "IMU"

    // Report-Inhalt (später kann das JSON/PDF/HTML werden)
    @Lob
    @Column(columnDefinition = "TEXT")
    private String reportText;

    public Measurement() {}

    // Getter/Setter
    public Long getId() { return id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAttribute() { return attribute; }
    public void setAttribute(String attribute) { this.attribute = attribute; }

    public String getReportText() { return reportText; }
    public void setReportText(String reportText) { this.reportText = reportText; }



    @Lob
    @Column(name = "report_pdf")
    private byte[] reportPdf;

    @Column(name = "report_pdf_filename", length = 255)
    private String reportPdfFilename;

    @Column(name = "report_pdf_content_type", length = 100)
    private String reportPdfContentType;

    public byte[] getReportPdf() { return reportPdf; }
    public void setReportPdf(byte[] reportPdf) { this.reportPdf = reportPdf; }

    public String getReportPdfFilename() { return reportPdfFilename; }
    public void setReportPdfFilename(String reportPdfFilename) { this.reportPdfFilename = reportPdfFilename; }

    public String getReportPdfContentType() { return reportPdfContentType; }
    public void setReportPdfContentType(String reportPdfContentType) { this.reportPdfContentType = reportPdfContentType; }

}
