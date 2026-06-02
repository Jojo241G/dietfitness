package com.dietfitness.controller;

import com.dietfitness.model.Plat;
import com.dietfitness.service.FoodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/plats")
public class FoodController {

    @Autowired
    private FoodService foodService;

    // GET /api/plats → tous les plats
    @GetMapping
    public ResponseEntity<?> getAllPlats() {
        try {
            List<Plat> plats = foodService.getAllPlats();
            return ResponseEntity.ok(plats);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur lors de la lecture des plats : " + e.getMessage());
        }
    }

    // GET /api/plats/filtrer?allergies=arachides&conditions=hypertension
    @GetMapping("/filtrer")
    public ResponseEntity<?> getPlatsFiltres(
            @RequestParam(required = false) String allergies,
            @RequestParam(required = false) String conditions) {
        try {
            // Convertit les paramètres en listes
            List<String> listeAllergies = allergies != null
                    ? Arrays.asList(allergies.split(","))
                    : List.of();

            List<String> listeConditions = conditions != null
                    ? Arrays.asList(conditions.split(","))
                    : List.of();

            List<Plat> plats = foodService.getPlatsFiltered(listeAllergies, listeConditions);
            return ResponseEntity.ok(plats);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur lors du filtrage : " + e.getMessage());
        }
    }

    // GET /api/plats/{id} → un seul plat par ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getPlatById(@PathVariable int id) {
        try {
            List<Plat> plats = foodService.getAllPlats();
            return plats.stream()
                    .filter(p -> p.getId() == id)
                    .findFirst()
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur : " + e.getMessage());
        }
    }
}