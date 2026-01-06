package gaitcoach;

import gaitcoach.model.LicenseCode;
import gaitcoach.repository.LicenseCodeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class GaitCoachApplication {

    public static void main(String[] args) {
        SpringApplication.run(GaitCoachApplication.class, args);
    }

    // Demo-Lizenzcodes beim Start anlegen
    @Bean
    CommandLineRunner init(LicenseCodeRepository licenseCodeRepository) {
        return args -> {
            if (licenseCodeRepository.count() == 0) {
                licenseCodeRepository.save(new LicenseCode("THERA-001"));
                licenseCodeRepository.save(new LicenseCode("THERA-002"));
                licenseCodeRepository.save(new LicenseCode("THERA-003"));
            }
        };
    }
}