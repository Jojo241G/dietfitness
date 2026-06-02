package com.dietfitness.dto;

import lombok.Data;

/** Corps de la requête POST /api/auth/register */
@Data
public class RegisterRequest {
    private String prenom;
    private String nom;
    private String email;
    private String motDePasse;
    private Double poids;
    private Double taille;
    private String objectif;
}
