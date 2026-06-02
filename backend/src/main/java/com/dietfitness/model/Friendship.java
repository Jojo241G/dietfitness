package com.dietfitness.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "friendships")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    /**
     * PENDING  → demande envoyée, pas encore traitée
     * ACCEPTED → amis
     * REFUSED  → refusée
     */
    @Column(nullable = false, length = 20)
    private String statut = "PENDING";

    @Column(name = "date_demande", nullable = false)
    private LocalDateTime dateDemande;

    @Column(name = "date_reponse")
    private LocalDateTime dateReponse;

    @PrePersist
    protected void onCreate() {
        if (dateDemande == null) {
            dateDemande = LocalDateTime.now();
        }
    }
}