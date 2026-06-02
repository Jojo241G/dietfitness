package com.dietfitness.controller;

import com.dietfitness.model.Exercice;
import com.dietfitness.service.FitnessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercices")
public class FitnessController {

    @Autowired
    private FitnessService fitnessService;

    // GET /api/exercices → tous les exercices
    @GetMapping
    public ResponseEntity<?> getAllExercices() {
        try {
            List<Exercice> exercices = fitnessService.getAllExercices();
            return ResponseEntity.ok(exercices);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur : " + e.getMessage());
        }
    }

    // GET /api/exercices/objectif?valeur=perte_de_poids
    @GetMapping("/objectif")
    public ResponseEntity<?> getByObjectif(@RequestParam String valeur) {
        try {
            List<Exercice> exercices = fitnessService.getExercicesByObjectif(valeur);
            return ResponseEntity.ok(exercices);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur : " + e.getMessage());
        }
    }

    // GET /api/exercices/difficulte?valeur=facile
    @GetMapping("/difficulte")
    public ResponseEntity<?> getByDifficulte(@RequestParam String valeur) {
        try {
            List<Exercice> exercices = fitnessService.getExercicesByDifficulte(valeur);
            return ResponseEntity.ok(exercices);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur : " + e.getMessage());
        }
    }

    // GET /api/exercices/{id} → un exercice par ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable int id) {
        try {
            List<Exercice> exercices = fitnessService.getAllExercices();
            return exercices.stream()
                    .filter(e -> e.getId() == id)
                    .findFirst()
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur : " + e.getMessage());
        }
    }
}