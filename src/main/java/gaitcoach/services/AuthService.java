package gaitcoach.services;

import gaitcoach.model.LicenseCode;
import gaitcoach.model.User;
import gaitcoach.model.UserRole;
import gaitcoach.repository.LicenseCodeRepository;
import gaitcoach.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LicenseCodeRepository licenseCodeRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository,
            LicenseCodeRepository licenseCodeRepository) {
        this.userRepository = userRepository;
        this.licenseCodeRepository = licenseCodeRepository;
    }

    public User registerTherapist(String licenseCodeValue,
            String email,
            String name,
            String rawPassword) {

        LicenseCode licenseCode = licenseCodeRepository
                .findByCodeAndUsedFalse(licenseCodeValue)
                .orElseThrow(() -> new RuntimeException("Lizenzcode ungültig oder schon verwendet."));

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("E-Mail bereits registriert.");
        }

        String hash = passwordEncoder.encode(rawPassword);
        User therapist = new User(email, name, hash, UserRole.THERAPIST);
        User saved = userRepository.save(therapist);

        licenseCode.setUsed(true);
        licenseCode.setUsedBy(saved);
        licenseCodeRepository.save(licenseCode);

        return saved;
    }

    public User loginTherapist(String email, String rawPassword) {
        User user = userRepository
                .findByEmailAndRole(email, UserRole.THERAPIST)
                .orElseThrow(() -> new RuntimeException("Therapeut nicht gefunden."));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new RuntimeException("Falsches Passwort.");
        }
        return user;
    }

    public User loginPatient(String email, String rawPassword) {
        User user = userRepository
                .findByEmailAndRole(email, UserRole.PATIENT)
                .orElseThrow(() -> new RuntimeException("Patient nicht gefunden."));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new RuntimeException("Falsches Passwort.");
        }
        return user;
    }
}
