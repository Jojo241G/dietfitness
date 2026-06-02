package com.dietfitness.dto;

import lombok.Data;

/** Corps de la requête POST /api/auth/login */
@Data
public class LoginRequest {
    private String email;
    private String motDePasse;
}
