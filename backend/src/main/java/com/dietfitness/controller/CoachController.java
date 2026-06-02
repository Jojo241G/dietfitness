package com.dietfitness.controller;

import com.dietfitness.service.ChatService;
import com.dietfitness.model.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller REST — AI Coach Personnel (V2)
 *
 * Endpoint exposé :
 *   POST /api/coach/chat → Envoyer un message au coach IA, recevoir une réponse contextuelle
 *
 * Ce controller s'appuie sur le ChatService et GeminiService déjà existants en V1.
 * Il ajoute uniquement le préfixage du contexte utilisateur (calories, objectif)
 * pour des réponses personnalisées.
 */
@RestController
@RequestMapping("/api/coach")
public class CoachController {

    @Autowired
    private ChatService chatService;  // Réutilise le service Gemini existant

    // =========================================================================
    // ── POST /api/coach/chat ──────────────────────────────────────────────────
    // =========================================================================
    /**
     * Reçoit le message de l'utilisateur et le profil de contexte,
     * injecte le contexte nutritionnel dans le prompt Gemini, et retourne
     * une réponse personnalisée du coach IA.
     *
     * Corps JSON attendu :
     * {
     *   "message": "Que manger après ma séance de ce soir ?",
     *   "profil": {
     *     "prenom":          "Koffi",
     *     "objectif":        "Perte de poids",
     *     "caloriesObjectif": 2000,
     *     "caloriesConsommees": 1340,
     *     "caloriesBrulees": 320,
     *     "poids":           75,
     *     "taille":          178
     *   }
     * }
     *
     * Réponse JSON :
     * {
     *   "text": "Bonjour Koffi ! Après ta séance, je te conseille...",
     *   "sender": "coach",
     *   "time": "14:32"
     * }
     */
    @PostMapping("/chat")
    public ResponseEntity<?> coachChat(@RequestBody Map<String, Object> body) {
        try {
            String messageUtilisateur = (String) body.get("message");

            if (messageUtilisateur == null || messageUtilisateur.isBlank()) {
                return ResponseEntity.badRequest()
                        .body("Le champ 'message' est obligatoire.");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> profil = (Map<String, Object>) body.get("profil");

            // ── Construction du prompt contextuel ─────────────────────────
            String messageEnrichi = buildContextualPrompt(messageUtilisateur, profil);

            // ── Délégation au ChatService V1 (Gemini) ────────────────────
            ChatMessage reponse = chatService.traiterMessage(messageEnrichi, profil);

            return ResponseEntity.ok(reponse);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur du coach IA : " + e.getMessage());
        }
    }

    // ── GET /api/coach/status → health check ─────────────────────────────────
    @GetMapping("/status")
    public ResponseEntity<String> status() {
        return ResponseEntity.ok("Coach IA DietFitness opérationnel ✅");
    }

    // =========================================================================
    // ── Méthode privée : injection de contexte dans le prompt ─────────────────
    // =========================================================================
    /**
     * Préfixe le message de l'utilisateur avec son contexte nutritionnel
     * pour permettre au modèle Gemini de donner des conseils personnalisés.
     */
    private String buildContextualPrompt(String message, Map<String, Object> profil) {
        if (profil == null) return message;

        StringBuilder ctx = new StringBuilder();
        ctx.append("[CONTEXTE UTILISATEUR]\n");

        if (profil.get("prenom") != null)
            ctx.append("Prénom : ").append(profil.get("prenom")).append("\n");
        if (profil.get("objectif") != null)
            ctx.append("Objectif santé : ").append(profil.get("objectif")).append("\n");
        if (profil.get("caloriesObjectif") != null)
            ctx.append("Objectif calorique journalier : ").append(profil.get("caloriesObjectif")).append(" kcal\n");
        if (profil.get("caloriesConsommees") != null)
            ctx.append("Calories consommées aujourd'hui : ").append(profil.get("caloriesConsommees")).append(" kcal\n");
        if (profil.get("caloriesBrulees") != null)
            ctx.append("Calories brûlées aujourd'hui : ").append(profil.get("caloriesBrulees")).append(" kcal\n");
        if (profil.get("poids") != null && profil.get("taille") != null) {
            ctx.append("Poids : ").append(profil.get("poids")).append(" kg, ")
               .append("Taille : ").append(profil.get("taille")).append(" cm\n");
        }

        ctx.append("[FIN CONTEXTE]\n\n");
        ctx.append("Message de l'utilisateur : ").append(message);

        return ctx.toString();
    }
}
