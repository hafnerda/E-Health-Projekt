package gaitcoach.repository;

import gaitcoach.model.User;
import gaitcoach.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailAndRole(String email, UserRole role);

    boolean existsByEmail(String email);
}