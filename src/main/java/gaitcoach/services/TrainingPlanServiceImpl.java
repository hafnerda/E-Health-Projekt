package gaitcoach.services;

import gaitcoach.model.TrainingPlan;
import gaitcoach.model.User;
import gaitcoach.repository.TrainingPlanRepository;
import gaitcoach.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TrainingPlanServiceImpl implements TrainingPlanService {

    private final TrainingPlanRepository trainingPlanRepository;
    private final UserRepository userRepository;

    public TrainingPlanServiceImpl(TrainingPlanRepository trainingPlanRepository,
            UserRepository userRepository) {
        this.trainingPlanRepository = trainingPlanRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<TrainingPlan> getCurrentTrainingPlans(Long userId) {
        LocalDate today = LocalDate.now();
        return trainingPlanRepository
                .findByUserIdAndValidFromLessThanEqualAndValidToGreaterThanEqual(
                        userId, today, today);
    }

    @Override
    public TrainingPlan createTrainingPlan(Long userId, TrainingPlan trainingPlan) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        trainingPlan.setUser(user);
        return trainingPlanRepository.save(trainingPlan);
    }
}