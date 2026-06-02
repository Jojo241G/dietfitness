package com.dietfitness.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String motDePasse = credentials.get("motDePasse");

        // Authentification demo (pas de base de données réelle)
        if (email != null && motDePasse != null && !email.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "token", "demo-token-" + System.currentTimeMillis(),
                "message", "Connexion réussie"
            ));
        }

        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", "Email ou mot de passe invalide"
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(Map.of("status", "OK", "service", "DietFitness Auth"));
    }
}