package ehealth.repository;

import ehealth.model.LicenseCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LicenseCodeRepository extends JpaRepository<LicenseCode, Long> {

    Optional<LicenseCode> findByCodeAndUsedFalse(String code);
}
