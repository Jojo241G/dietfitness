package com.dietfitness.controller;

import com.dietfitness.model.WorkoutHistory;
import com.dietfitness.repository.WorkoutHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Controller REST — Historique d'entraînement (V2)
 *
 * Endpoints exposés :
 *   POST /api/workouts          → Enregistrer une séance terminée
 *   GET  /api/workouts/{userId} → Récupérer l'historique d'un utilisateur (du + récent au + ancien)
 */
@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

    @Autowired
    private WorkoutHistoryRepository workoutHistoryRepository;

    // ── POST /api/workouts ────────────────────────────────────────────────────
    /**
     * Enregistre une séance terminée en base de données.
     *
     * Corps JSON attendu :
     * {
     *   "userId": 1,
     *   "nomSeance": "Programme Perte de Poids",
     *   "dureeMinutes": 35,
     *   "caloriesBrulees": 280,
     *   "exercicesEffectues": ["Jumping Jacks", "Burpees", "Mountain Climbers"]
     * }
     */
    @PostMapping
    public ResponseEntity<?> saveWorkout(@RequestBody Map<String, Object> body) {
        try {
            // ── Validation des champs obligatoires ─────────────────────────
            if (body.get("userId") == null || body.get("nomSeance") == null) {
                return ResponseEntity.badRequest()
                        .body("Les champs 'userId' et 'nomSeance' sont obligatoires.");
            }

            WorkoutHistory workout = new WorkoutHistory();
            workout.setUserId(((Number) body.get("userId")).longValue());
            workout.setNomSeance((String) body.get("nomSeance"));
            workout.setDateSeance(LocalDateTime.now());
            workout.setDureeMinutes(body.get("dureeMinutes") != null
                    ? ((Number) body.get("dureeMinutes")).intValue() : 0);
            workout.setCaloriesBrulees(body.get("caloriesBrulees") != null
                    ? ((Number) body.get("caloriesBrulees")).intValue() : 0);

            // ── Sérialisation de la liste d'exercices ──────────────────────
            if (body.get("exercicesEffectues") instanceof List<?> rawList) {
                @SuppressWarnings("unchecked")
                List<String> exercices = (List<String>) rawList;
                workout.setExercicesListe(exercices);
            }

            WorkoutHistory saved = workoutHistoryRepository.save(workout);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur lors de l'enregistrement de la séance : " + e.getMessage());
        }
    }

    // ── GET /api/workouts/{userId} ────────────────────────────────────────────
    /**
     * Retourne l'historique complet d'un utilisateur, du plus récent au plus ancien.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getWorkoutHistory(@PathVariable Long userId) {
        try {
            List<WorkoutHistory> history =
                    workoutHistoryRepository.findByUserIdOrderByDateSeanceDesc(userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur lors de la récupération de l'historique : " + e.getMessage());
        }
    }
}
