package com.dietfitness.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité JPA — Compte utilisateur (V3)
 * Gère l'inscription, le login par email/mot de passe hashé (BCrypt),
 * et la confirmation par email via un token UUID.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(nullable = false, length = 100)
    private String nom;

    /** Email unique — sert d'identifiant de connexion */
    @Column(nullable = false, unique = true, length = 180)
    private String email;

    /** Mot de passe hashé BCrypt — jamais stocké en clair */
    @Column(nullable = false)
    private String motDePasse;

    /** true une fois que l'utilisateur a cliqué sur le lien de confirmation */
    @Column(nullable = false)
    private boolean emailConfirme = false;

    /** Token UUID envoyé par email pour la confirmation */
    @Column(name = "token_confirmation", unique = true)
    private String tokenConfirmation;

    /** Date d'expiration du token (24h) */
    @Column(name = "token_expiration")
    private LocalDateTime tokenExpiration;

    /** Date d'inscription */
    @Column(name = "date_inscription", nullable = false)
    private LocalDateTime dateInscription;

    // ── Métriques du profil ───────────────────────────────────────────────────
    private Double poids;     // kg
    private Double taille;    // cm
    private Double poidsObjectif;
    private String objectif;  // "Perte de poids" | "Prise de masse" | "Maintien de forme"
    private Integer caloriesObjectif; // kcal/jour

    @PrePersist
    protected void onCreate() {
        if (dateInscription == null) {
            dateInscription = LocalDateTime.now();
        }
    }
}
