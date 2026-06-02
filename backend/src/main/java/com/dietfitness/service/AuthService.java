package com.dietfitness.service;

import com.dietfitness.dto.AuthResponse;
import com.dietfitness.dto.LoginRequest;
import com.dietfitness.dto.RegisterRequest;
import com.dietfitness.model.User;
import com.dietfitness.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @Value("${app.jwt-secret:dietfitness-secret-key-2025}")
    private String jwtSecret;

    // ── Inscription ───────────────────────────────────────────────────────────
    public AuthResponse inscrire(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Un compte existe deja avec cet email.");
        }
        if (req.getPrenom() == null || req.getPrenom().isBlank()) {
            throw new IllegalArgumentException("Le prenom est obligatoire.");
        }
        if (req.getMotDePasse() == null || req.getMotDePasse().length() < 6) {
            throw new IllegalArgumentException("Le mot de passe doit faire au moins 6 caracteres.");
        }

        User user = new User();
        user.setPrenom(req.getPrenom().trim());
        user.setNom(req.getNom() != null ? req.getNom().trim() : "");
        user.setEmail(req.getEmail().trim().toLowerCase());
        user.setMotDePasse(passwordEncoder.encode(req.getMotDePasse()));
        user.setEmailConfirme(true);
        user.setPoids(req.getPoids());
        user.setTaille(req.getTaille());
        user.setObjectif(req.getObjectif() != null ? req.getObjectif() : "Maintien de forme");
        user.setCaloriesObjectif(calculerCaloriesObjectif(req));

        User saved = userRepository.save(user);
        String token = genererToken(saved);

        return new AuthResponse(
            token,
            saved.getId(),
            saved.getPrenom(),
            saved.getEmail(),
            saved.getObjectif(),
            saved.getPoids(),
            saved.getTaille(),
            saved.getCaloriesObjectif()
        );
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Email ou mot de passe incorrect."));

        if (!passwordEncoder.matches(req.getMotDePasse(), user.getMotDePasse())) {
            throw new IllegalArgumentException("Email ou mot de passe incorrect.");
        }

        String token = genererToken(user);

        return new AuthResponse(
            token,
            user.getId(),
            user.getPrenom(),
            user.getEmail(),
            user.getObjectif(),
            user.getPoids(),
            user.getTaille(),
            user.getCaloriesObjectif()
        );
    }

    // ── Token ─────────────────────────────────────────────────────────────────
    private String genererToken(User user) {
        String payload = user.getId() + ":" + user.getEmail() + ":" + System.currentTimeMillis();
        String encoded = Base64.getEncoder().encodeToString(payload.getBytes());
        String hash    = String.valueOf((payload + jwtSecret).hashCode());
        String sig     = Base64.getEncoder().encodeToString(hash.getBytes());
        return encoded + "." + sig;
    }

    // ── Calories objectif ─────────────────────────────────────────────────────
    private int calculerCaloriesObjectif(RegisterRequest req) {
        if (req.getPoids() == null || req.getTaille() == null) return 2000;
        double bmr  = 10 * req.getPoids() + 6.25 * req.getTaille() - 5 * 25 + 5;
        double tdee = bmr * 1.375;
        if ("Perte de poids".equals(req.getObjectif()))  return (int) (tdee - 400);
        if ("Prise de masse".equals(req.getObjectif()))  return (int) (tdee + 300);
        return (int) tdee;
    }
}