package gaitcoach.services;

import gaitcoach.model.ProgressEntry;
import gaitcoach.model.User;
import gaitcoach.repository.ProgressRepository;
import gaitcoach.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ProgressServiceImpl implements ProgressService {

    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;

    public ProgressServiceImpl(ProgressRepository progressRepository,
            UserRepository userRepository) {
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<ProgressEntry> getProgressForUserInRange(Long userId, LocalDate from, LocalDate to) {
        return progressRepository.findByUserIdAndDateBetween(userId, from, to);
    }

    @Override
    public ProgressEntry addProgressEntry(Long userId, ProgressEntry entry) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        entry.setUser(user);
        return progressRepository.save(entry);
    }
}