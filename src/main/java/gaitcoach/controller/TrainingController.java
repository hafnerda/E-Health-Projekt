package gaitcoach.controller;

import gaitcoach.model.TrainingPlan;
import gaitcoach.services.TrainingPlanService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/training-plans")
@CrossOrigin
public class TrainingController {

    private final TrainingPlanService trainingPlanService;

    public TrainingController(TrainingPlanService trainingPlanService) {
        this.trainingPlanService = trainingPlanService;
    }

    @GetMapping("/current")
    public List<TrainingPlan> getCurrentTrainingPlans(@PathVariable Long userId) {
        return trainingPlanService.getCurrentTrainingPlans(userId);
    }

    @PostMapping
    public TrainingPlan createTrainingPlan(
            @PathVariable Long userId,
            @RequestBody TrainingPlan trainingPlan) {
        return trainingPlanService.createTrainingPlan(userId, trainingPlan);
    }
}