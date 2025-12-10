package gaitcoach.controller;

import gaitcoach.model.User;
import gaitcoach.services.AuthService; // <-- HIER: services, nicht service
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:8080") // ggf. anpassen
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ----- DTO-Klassen -----
    public static class RegisterTherapistRequest {
        public String licenseCode;
        public String email;
        public String name;
        public String password;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class UserResponse {
        public Long id;
        public String email;
        public String name;
        public String role;

        public UserResponse(User u) {
            this.id = u.getId();
            this.email = u.getEmail();
            this.name = u.getName();
            this.role = u.getRole().name();
        }
    }

    // ----- Endpunkte -----

    @PostMapping("/register-therapist")
    public ResponseEntity<?> registerTherapist(@RequestBody RegisterTherapistRequest request) {
        try {
            User u = authService.registerTherapist(
                    request.licenseCode,
                    request.email.toLowerCase(),
                    request.name,
                    request.password);
            return ResponseEntity.ok(new UserResponse(u));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/login-therapist")
    public ResponseEntity<?> loginTherapist(@RequestBody LoginRequest request) {
        try {
            User u = authService.loginTherapist(
                    request.email.toLowerCase(),
                    request.password);
            return ResponseEntity.ok(new UserResponse(u));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/login-patient")
    public ResponseEntity<?> loginPatient(@RequestBody LoginRequest request) {
        try {
            User u = authService.loginPatient(
                    request.email.toLowerCase(),
                    request.password);
            return ResponseEntity.ok(new UserResponse(u));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
