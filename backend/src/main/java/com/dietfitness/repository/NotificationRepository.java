package com.dietfitness.repository;

import com.dietfitness.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Toutes les notifications d'un utilisateur, du plus récent au plus ancien */
    List<Notification> findByUserIdOrderByDateCreationDesc(Long userId);

    /** Notifications non lues d'un utilisateur */
    List<Notification> findByUserIdAndLuFalseOrderByDateCreationDesc(Long userId);

    /** Nombre de notifications non lues */
    long countByUserIdAndLuFalse(Long userId);

    /** Marquer toutes les notifications d'un user comme lues */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.userId = :userId")
    void marquerToutesCommeLues(@Param("userId") Long userId);
}