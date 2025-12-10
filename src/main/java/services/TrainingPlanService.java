package services;

import model.TrainingPlan;

import java.util.List;

public interface TrainingPlanService {

    List<TrainingPlan> getCurrentTrainingPlans(Long userId);

    TrainingPlan createTrainingPlan(Long userId, TrainingPlan trainingPlan);
}