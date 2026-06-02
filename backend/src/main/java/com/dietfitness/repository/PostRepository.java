package com.dietfitness.repository;

import com.dietfitness.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Repository Spring Data JPA pour les posts du fil communautaire.
 */
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * Récupère tous les posts du feed triés du plus récent au plus ancien.
     */
    List<Post> findAllByOrderByDatePublicationDesc();

    /**
     * Filtre les posts par catégorie (General / Recettes / Motivation).
     */
    List<Post> findByCategorieOrderByDatePublicationDesc(String categorie);

    /**
     * Recherche les posts d'un utilisateur par son userId.
     */
    List<Post> findByUserIdOrderByDatePublicationDesc(Long userId);

    /**
     * Incrémente le compteur de likes d'un post de façon atomique.
     * Évite les race conditions sans avoir à charger l'entité complète.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.likes = p.likes + 1 WHERE p.id = :postId")
    void incrementLikes(@Param("postId") Long postId);

    /**
     * Décrémente le compteur de likes (plancher à 0 géré dans le service).
     */
    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.likes = p.likes - 1 WHERE p.id = :postId AND p.likes > 0")
    void decrementLikes(@Param("postId") Long postId);
}
