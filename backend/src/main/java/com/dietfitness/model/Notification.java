package com.dietfitness.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Utilisateur qui reçoit la notification */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Utilisateur qui a déclenché l'action */
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_prenom", length = 100)
    private String senderPrenom;

    /**
     * Type de notification :
     * LIKE         → quelqu'un a liké ton post
     * FRIEND_REQUEST → demande d'ami reçue
     * FRIEND_ACCEPTED → demande d'ami acceptée
     */
    @Column(nullable = false, length = 30)
    private String type;

    /** Message lisible ex: "Amina a aimé votre post" */
    @Column(nullable = false)
    private String message;

    /** ID du post concerné (pour les likes) */
    @Column(name = "post_id")
    private Long postId;

    /** ID de la demande d'ami concernée */
    @Column(name = "friendship_id")
    private Long friendshipId;

    @Column(nullable = false)
    private boolean lu = false;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}