package com.dietfitness.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité JPA — Post du fil communautaire (V2)
 * Relation ManyToOne vers User (identifié par userId).
 * Un post appartient à une catégorie et peut accumuler des likes.
 */
@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Identifiant de l'auteur */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Prénom de l'auteur (dénormalisé pour éviter une jointure à chaque fetch du feed) */
    @Column(name = "auteur_prenom", nullable = false, length = 100)
    private String auteurPrenom;

    /**
     * Catégorie du post.
     * Valeurs acceptées : "General" | "Recettes" | "Motivation"
     */
    @Column(nullable = false, length = 30)
    private String categorie;

    /** Contenu textuel du post */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    /** Nombre de likes (incrémenté / décrémenté via endpoint dédié) */
    @Column(nullable = false)
    private int likes = 0;

    /** Date/heure de publication */
    @Column(name = "date_publication", nullable = false)
    private LocalDateTime datePublication;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        if (datePublication == null) {
            datePublication = LocalDateTime.now();
        }
        if (likes < 0) {
            likes = 0;
        }
    }
}
