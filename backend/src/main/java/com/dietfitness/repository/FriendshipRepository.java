package com.dietfitness.repository;

import com.dietfitness.model.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /** Vérifie si une demande existe déjà entre deux utilisateurs */
    @Query("SELECT f FROM Friendship f WHERE (f.senderId = :userId1 AND f.receiverId = :userId2) OR (f.senderId = :userId2 AND f.receiverId = :userId1)")
    Optional<Friendship> findBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /** Toutes les demandes reçues en attente */
    List<Friendship> findByReceiverIdAndStatut(Long receiverId, String statut);

    /** Toutes les demandes envoyées en attente */
    List<Friendship> findBySenderIdAndStatut(Long senderId, String statut);

    /** Tous les amis acceptés d'un utilisateur */
    @Query("SELECT f FROM Friendship f WHERE (f.senderId = :userId OR f.receiverId = :userId) AND f.statut = 'ACCEPTED'")
    List<Friendship> findAllFriends(@Param("userId") Long userId);

    /** Nombre de demandes en attente reçues */
    long countByReceiverIdAndStatut(Long receiverId, String statut);
}