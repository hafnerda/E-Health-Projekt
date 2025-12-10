package gaitcoach.repository;

import gaitcoach.model.LicenseCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LicenseCodeRepository extends JpaRepository<LicenseCode, Long> {

    Optional<LicenseCode> findByCodeAndUsedFalse(String code);
}