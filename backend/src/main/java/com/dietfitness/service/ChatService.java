/**
 * Service gérant la logique métier du système de Chat.
 * Fait la liaison entre le contrôleur et l'intégration de l'IA.
 * * @author Cedvianney
 */
package com.dietfitness.service;

import com.dietfitness.model.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ChatService {

    @Autowired
    private GeminiService geminiService;

    public ChatMessage traiterMessage(String messageUtilisateur,
                                      Map<String, Object> profilUtilisateur) throws Exception {

        // Construit le contexte depuis le profil utilisateur
        String contexte = construireContexte(profilUtilisateur);

        // Envoie à Gemini et récupère la réponse
        String reponseIA = geminiService.envoyerMessage(contexte, messageUtilisateur);

        return new ChatMessage("coach", reponseIA);
    }

    private String construireContexte(Map<String, Object> profil) {
        if (profil == null || profil.isEmpty()) {
            return "Aucun profil utilisateur fourni.";
        }

        // 💡 Sécurisation : On extrait proprement en évitant les chaînes "null" textuelles dans le prompt
        String prenom = obtenirValeurSecurisee(profil, "prenom", "Utilisateur");
        String poids = obtenirValeurSecurisee(profil, "poids", "?");
        String taille = obtenirValeurSecurisee(profil, "taille", "?");
        String objectif = obtenirValeurSecurisee(profil, "objectif", "Remise en forme");
        String allergies = obtenirValeurSecurisee(profil, "allergies", "Aucune");
        String conditions = obtenirValeurSecurisee(profil, "conditions_medicales", "Aucune");

        return String.format(
            "Prénom: %s | Poids: %s kg | Taille: %s cm | Objectif: %s | Allergies: %s | Conditions médicales: %s",
            prenom, poids, taille, objectif, allergies, conditions
        );
    }

    // Méthode utilitaire pour nettoyer les entrées du profil
    private String obtenirValeurSecurisee(Map<String, Object> profil, String cle, String valeurParDefaut) {
        Object valeur = profil.get(cle);
        if (valeur == null || valeur.toString().trim().isEmpty() || "null".equalsIgnoreCase(valeur.toString())) {
            return valeurParDefaut;
        }
        return valeur.toString().trim();
    }
}