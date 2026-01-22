package gaitcoach.controller;

import gaitcoach.model.Patient;
import gaitcoach.services.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:8080") // kannst du später entfernen, wenn alles same-origin bleibt
public class PatientController {

    private final PatientService patientService;
    

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
        
    }

    // ===== DTOs =====
    public static class CreatePatientRequest {
        public String gender;
        public String firstName;
        public String lastName;
        public String birthDate;
        public String patientCode;
        public Double weightKg;
        public Double heightCm;
        public String lastMeasurementDate;

        // Login-Daten für Patient
        public String email;
        public String password;
    }




    public static class PatientResponse {
        public Long id;
        public String gender;
        public String firstName;
        public String lastName;
        public String birthDate;
        public String patientCode;
        public Double weightKg;
        public Double heightCm;
        public String lastMeasurementDate;
        public String email;

        public PatientResponse(Patient p) {
            this.id = p.getId();
            this.gender = p.getGender();
            this.firstName = p.getFirstName();
            this.lastName = p.getLastName();
            this.birthDate = p.getBirthDate() != null ? p.getBirthDate().toString() : null;
            this.patientCode = p.getPatientCode();
            this.weightKg = p.getWeightKg();
            this.heightCm = p.getHeightCm();
            this.lastMeasurementDate = p.getLastMeasurementDate() != null ? p.getLastMeasurementDate().toString() : null;
            this.email = p.getPatientUser() != null ? p.getPatientUser().getEmail() : null;
        }
    }


    @GetMapping
    public List<PatientResponse> getAll() {
        return patientService.getAll().stream()
            .map(PatientResponse::new)
            .toList();
    }

    @GetMapping("/{id}")
    public PatientResponse getById(@PathVariable Long id) {
        return new PatientResponse(patientService.getById(id));
    }

    @GetMapping("/by-user/{userId}")
    public PatientResponse getByUserId(@PathVariable Long userId) {
        return new PatientResponse(patientService.getByUserId(userId));
    }

    





    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreatePatientRequest req) {
    try {
        Patient p = new Patient();
        p.setGender(req.gender);
        p.setFirstName(req.firstName);
        p.setLastName(req.lastName);

        if (req.birthDate != null && !req.birthDate.isBlank())
            p.setBirthDate(java.time.LocalDate.parse(req.birthDate));

        p.setPatientCode(req.patientCode);
        p.setWeightKg(req.weightKg);
        p.setHeightCm(req.heightCm);

        if (req.lastMeasurementDate != null && !req.lastMeasurementDate.isBlank())
            p.setLastMeasurementDate(java.time.LocalDate.parse(req.lastMeasurementDate));

        Patient saved = patientService.createWithLogin(p, req.email, req.password);
        return ResponseEntity.ok(new PatientResponse(saved));
    } catch (RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}



    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Patient patient) {
        try {
            return ResponseEntity.ok(patientService.update(id, patient));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            patientService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
