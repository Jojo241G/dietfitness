package com.dietfitness.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Réponse renvoyée après un login réussi */
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;   // JWT
    private Long userId;
    private String prenom;
    private String email;
    private String objectif;
    private Double poids;
    private Double taille;
    private Integer caloriesObjectif;
}
