package com.dietfitness.service;

import com.dietfitness.model.Friendship;
import com.dietfitness.model.Notification;
import com.dietfitness.model.User;
import com.dietfitness.repository.FriendshipRepository;
import com.dietfitness.repository.NotificationRepository;
import com.dietfitness.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FriendshipService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // ── Envoyer une demande d'ami ─────────────────────────────────────────────
    public Friendship envoyerDemande(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous ajouter vous-même.");
        }

        // Vérifier si une relation existe déjà
        Optional<Friendship> existing = friendshipRepository.findBetweenUsers(senderId, receiverId);
        if (existing.isPresent()) {
            String statut = existing.get().getStatut();
            if ("ACCEPTED".equals(statut)) throw new IllegalArgumentException("Vous êtes déjà amis.");
            if ("PENDING".equals(statut))  throw new IllegalArgumentException("Une demande est déjà en attente.");
            if ("REFUSED".equals(statut)) {
                // Permettre de renvoyer une demande après un refus
                Friendship f = existing.get();
                f.setStatut("PENDING");
                f.setSenderId(senderId);
                f.setReceiverId(receiverId);
                f.setDateDemande(LocalDateTime.now());
                f.setDateReponse(null);
                friendshipRepository.save(f);
                envoyerNotification(receiverId, senderId, "FRIEND_REQUEST", null, f.getId());
                return f;
            }
        }

        // Créer la demande
        Friendship friendship = new Friendship();
        friendship.setSenderId(senderId);
        friendship.setReceiverId(receiverId);
        friendship.setStatut("PENDING");
        Friendship saved = friendshipRepository.save(friendship);

        // Notifier le destinataire
        envoyerNotification(receiverId, senderId, "FRIEND_REQUEST", null, saved.getId());

        return saved;
    }

    // ── Accepter une demande ──────────────────────────────────────────────────
    public Friendship accepterDemande(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Demande introuvable."));

        if (!friendship.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("Action non autorisée.");
        }

        friendship.setStatut("ACCEPTED");
        friendship.setDateReponse(LocalDateTime.now());
        Friendship saved = friendshipRepository.save(friendship);

        // Notifier l'expéditeur
        envoyerNotification(friendship.getSenderId(), userId, "FRIEND_ACCEPTED", null, friendshipId);

        return saved;
    }

    // ── Refuser une demande ───────────────────────────────────────────────────
    public Friendship refuserDemande(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Demande introuvable."));

        if (!friendship.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("Action non autorisée.");
        }

        friendship.setStatut("REFUSED");
        friendship.setDateReponse(LocalDateTime.now());
        return friendshipRepository.save(friendship);
    }

    // ── Liste des amis ────────────────────────────────────────────────────────
    public List<Map<String, Object>> getAmis(Long userId) {
        List<Friendship> friendships = friendshipRepository.findAllFriends(userId);

        return friendships.stream().map(f -> {
            Long amiId = f.getSenderId().equals(userId) ? f.getReceiverId() : f.getSenderId();
            Optional<User> ami = userRepository.findById(amiId);
            return Map.<String, Object>of(
                "friendshipId", f.getId(),
                "userId",       amiId,
                "prenom",       ami.map(User::getPrenom).orElse("Inconnu"),
                "nom",          ami.map(User::getNom).orElse(""),
                "email",        ami.map(User::getEmail).orElse(""),
                "objectif",     ami.map(User::getObjectif).orElse("")
            );
        }).toList();
    }

    // ── Demandes reçues en attente ────────────────────────────────────────────
    public List<Map<String, Object>> getDemandesRecues(Long userId) {
        List<Friendship> demandes = friendshipRepository.findByReceiverIdAndStatut(userId, "PENDING");

        return demandes.stream().map(f -> {
            Optional<User> sender = userRepository.findById(f.getSenderId());
            return Map.<String, Object>of(
                "friendshipId", f.getId(),
                "senderId",     f.getSenderId(),
                "prenom",       sender.map(User::getPrenom).orElse("Inconnu"),
                "nom",          sender.map(User::getNom).orElse(""),
                "email",        sender.map(User::getEmail).orElse(""),
                "dateDemande",  f.getDateDemande().toString()
            );
        }).toList();
    }

    // ── Statut de relation entre deux users ───────────────────────────────────
    public String getStatutRelation(Long userId1, Long userId2) {
        return friendshipRepository.findBetweenUsers(userId1, userId2)
                .map(Friendship::getStatut)
                .orElse("NONE");
    }

    // ── Envoyer une notification ──────────────────────────────────────────────
    public void envoyerNotification(Long userId, Long senderId, String type,
                                     Long postId, Long friendshipId) {
        User sender = userRepository.findById(senderId).orElse(null);
        String senderPrenom = sender != null ? sender.getPrenom() : "Quelqu'un";

        String message = switch (type) {
            case "LIKE"            -> senderPrenom + " a aimé votre post 💚";
            case "FRIEND_REQUEST"  -> senderPrenom + " vous a envoyé une demande d'ami 👋";
            case "FRIEND_ACCEPTED" -> senderPrenom + " a accepté votre demande d'ami 🎉";
            default                -> senderPrenom + " a interagi avec vous";
        };

        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setSenderId(senderId);
        notif.setSenderPrenom(senderPrenom);
        notif.setType(type);
        notif.setMessage(message);
        notif.setPostId(postId);
        notif.setFriendshipId(friendshipId);
        notif.setLu(false);
        notificationRepository.save(notif);
    }
}