package com.dietfitness.controller;

import com.dietfitness.model.Friendship;
import com.dietfitness.model.Notification;
import com.dietfitness.model.User;
import com.dietfitness.repository.NotificationRepository;
import com.dietfitness.repository.UserRepository;
import com.dietfitness.service.FriendshipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller REST — Amis & Notifications (V3)
 *
 * POST /api/friends/request              → Envoyer demande d'ami
 * POST /api/friends/{id}/accept          → Accepter demande
 * POST /api/friends/{id}/refuse          → Refuser demande
 * GET  /api/friends/{userId}             → Liste des amis
 * GET  /api/friends/{userId}/pending     → Demandes reçues en attente
 * GET  /api/friends/status               → Statut relation entre 2 users
 * GET  /api/social/search?email=...      → Rechercher utilisateur par email
 * GET  /api/notifications/{userId}       → Toutes les notifications
 * GET  /api/notifications/{userId}/unread → Notifications non lues
 * POST /api/notifications/{userId}/read  → Marquer tout comme lu
 */
@RestController
@CrossOrigin(origins = "*")
public class FriendshipController {

    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // ── Envoyer une demande d'ami ─────────────────────────────────────────────
    @PostMapping("/api/friends/request")
    public ResponseEntity<?> envoyerDemande(@RequestBody Map<String, Object> body) {
        try {
            Long senderId   = ((Number) body.get("senderId")).longValue();
            Long receiverId = ((Number) body.get("receiverId")).longValue();
            Friendship f = friendshipService.envoyerDemande(senderId, receiverId);
            return ResponseEntity.ok(f);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Accepter une demande ──────────────────────────────────────────────────
    @PostMapping("/api/friends/{id}/accept")
    public ResponseEntity<?> accepter(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long userId = ((Number) body.get("userId")).longValue();
            Friendship f = friendshipService.accepterDemande(id, userId);
            return ResponseEntity.ok(f);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Refuser une demande ───────────────────────────────────────────────────
    @PostMapping("/api/friends/{id}/refuse")
    public ResponseEntity<?> refuser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long userId = ((Number) body.get("userId")).longValue();
            Friendship f = friendshipService.refuserDemande(id, userId);
            return ResponseEntity.ok(f);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Liste des amis ────────────────────────────────────────────────────────
    @GetMapping("/api/friends/{userId}")
    public ResponseEntity<?> getAmis(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(friendshipService.getAmis(userId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Demandes reçues en attente ────────────────────────────────────────────
    @GetMapping("/api/friends/{userId}/pending")
    public ResponseEntity<?> getPending(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(friendshipService.getDemandesRecues(userId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Statut relation ───────────────────────────────────────────────────────
    @GetMapping("/api/friends/status")
    public ResponseEntity<?> getStatut(
            @RequestParam Long userId1,
            @RequestParam Long userId2) {
        try {
            String statut = friendshipService.getStatutRelation(userId1, userId2);
            return ResponseEntity.ok(Map.of("statut", statut));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Recherche utilisateur par email ───────────────────────────────────────
    @GetMapping("/api/social/search")
    public ResponseEntity<?> searchByEmail(
            @RequestParam String email,
            @RequestParam(required = false) Long currentUserId) {
        try {
            if (email == null || email.isBlank() || !email.contains("@")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Email invalide."));
            }

            Optional<User> optUser = userRepository.findByEmail(email.trim().toLowerCase());
            if (optUser.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("erreur", "Aucun utilisateur trouvé."));
            }

            User user = optUser.get();

            // Statut de relation si currentUserId fourni
            String statut = "NONE";
            Long friendshipId = null;
            if (currentUserId != null && !currentUserId.equals(user.getId())) {
                statut = friendshipService.getStatutRelation(currentUserId, user.getId());
                var friendship = friendshipService.getDemandesRecues(user.getId())
                        .stream()
                        .filter(f -> ((Number) f.get("senderId")).longValue() == currentUserId)
                        .findFirst();
            }

            return ResponseEntity.ok(Map.of(
                "id",       user.getId(),
                "prenom",   user.getPrenom(),
                "nom",      user.getNom() != null ? user.getNom() : "",
                "email",    user.getEmail(),
                "objectif", user.getObjectif() != null ? user.getObjectif() : "",
                "statut",   statut
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Toutes les notifications ──────────────────────────────────────────────
    @GetMapping("/api/notifications/{userId}")
    public ResponseEntity<?> getNotifications(@PathVariable Long userId) {
        try {
            List<Notification> notifs =
                    notificationRepository.findByUserIdOrderByDateCreationDesc(userId);
            return ResponseEntity.ok(notifs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Notifications non lues ────────────────────────────────────────────────
    @GetMapping("/api/notifications/{userId}/unread")
    public ResponseEntity<?> getUnread(@PathVariable Long userId) {
        try {
            long count = notificationRepository.countByUserIdAndLuFalse(userId);
            List<Notification> notifs =
                    notificationRepository.findByUserIdAndLuFalseOrderByDateCreationDesc(userId);
            return ResponseEntity.ok(Map.of("count", count, "notifications", notifs));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ── Marquer tout comme lu ─────────────────────────────────────────────────
    @PostMapping("/api/notifications/{userId}/read")
    public ResponseEntity<?> marquerLu(@PathVariable Long userId) {
        try {
            notificationRepository.marquerToutesCommeLues(userId);
            return ResponseEntity.ok(Map.of("message", "Notifications marquées comme lues."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }
}