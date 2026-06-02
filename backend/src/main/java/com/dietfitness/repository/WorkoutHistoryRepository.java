package com.dietfitness.repository;

import com.dietfitness.model.WorkoutHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository Spring Data JPA pour l'historique d'entraînement.
 * Hérite de toutes les opérations CRUD standard.
 */
@Repository
public interface WorkoutHistoryRepository extends JpaRepository<WorkoutHistory, Long> {

    /**
     * Récupère toutes les séances d'un utilisateur, triées du plus récent au plus ancien.
     *
     * @param userId identifiant de l'utilisateur
     * @return liste des séances triée par date décroissante
     */
    List<WorkoutHistory> findByUserIdOrderByDateSeanceDesc(Long userId);
}
