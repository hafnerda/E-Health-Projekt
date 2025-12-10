package ehealth.repository;

import ehealth.model.User;
import ehealth.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailAndRole(String email, UserRole role);

    boolean existsByEmail(String email);
}
