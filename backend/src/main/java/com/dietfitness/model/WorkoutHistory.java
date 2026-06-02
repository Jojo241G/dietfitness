package com.dietfitness.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entité JPA — Historique d'entraînement (V2)
 * Relation ManyToOne vers User (identifié par userId).
 * Stocke une séance terminée avec ses exercices (liste sérialisée en JSON).
 */
@Entity
@Table(name = "workout_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Identifiant de l'utilisateur propriétaire de la séance */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Nom de la séance (ex: "Programme Perte de Poids") */
    @Column(name = "nom_seance", nullable = false)
    private String nomSeance;

    /** Date et heure de fin de la séance */
    @Column(name = "date_seance", nullable = false)
    private LocalDateTime dateSeance;

    /** Durée en minutes */
    @Column(name = "duree_minutes", nullable = false)
    private int dureeMinutes;

    /** Calories estimées brûlées */
    @Column(name = "calories_brulees")
    private int caloriesBrulees;

    /**
     * Liste des noms d'exercices effectués, stockée sous forme de chaîne
     * séparée par des virgules pour éviter une table de jointure supplémentaire.
     * Ex : "Jumping Jacks,Burpees,Mountain Climbers"
     */
    @Column(name = "exercices_effectues", columnDefinition = "TEXT")
    private String exercicesEffectues;

    // ── Méthodes utilitaires ──────────────────────────────────────────────────

    /** Retourne la liste des exercices sous forme de List<String>. */
    @Transient
    public List<String> getExercicesListe() {
        if (exercicesEffectues == null || exercicesEffectues.isBlank()) {
            return List.of();
        }
        return List.of(exercicesEffectues.split(","));
    }

    /** Accepte une List<String> et la sérialise en chaîne CSV. */
    public void setExercicesListe(List<String> liste) {
        this.exercicesEffectues = liste == null ? "" : String.join(",", liste);
    }
}
