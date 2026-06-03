/**
 * Service d'intégration avec l'API Google Gemini AI.
 * Permet de générer des conseils et réponses automatisés pour le fitness et la nutrition.
 * * @author Cedvianney
 */
package com.dietfitness.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    public String envoyerMessage(String contexte, String messageUtilisateur) throws Exception {

        String promptComplet = construirePrompt(contexte, messageUtilisateur);

        // 💡 Correction : Utilisation sécurisée de Jackson pour générer un JSON valide à 100%
        ObjectNode rootNode = objectMapper.createObjectNode();
        ArrayNode contentsArray = rootNode.putArray("contents");
        ObjectNode contentObject = contentsArray.addObject();
        ArrayNode partsArray = contentObject.putArray("parts");
        partsArray.addObject().put("text", promptComplet);

        ObjectNode generationConfig = rootNode.putObject("generationConfig");
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 500);

        String requestBody = objectMapper.writeValueAsString(rootNode);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString());

        System.out.println("=== GEMINI STATUS : " + response.statusCode() + " ===");

        if (response.statusCode() != 200) {
            System.out.println("=== GEMINI ERROR BODY : " + response.body() + " ===");
        }

        return extraireReponse(response.body());
    }

    private String construirePrompt(String contexte, String message) {
        return "Tu es Coach DietFitness, un coach nutrition et fitness spécialisé dans "
             + "l'alimentation camerounaise (Ndolé, Koki, Taro, Eru, etc.). Tu réponds toujours en français.\n\n"
             + "Contexte utilisateur : " + contexte + "\n\n"
             + "Question : " + message + "\n\n"
             + "Réponds de façon courte et pratique (max 3 paragraphes).";
    }

    private String extraireReponse(String jsonResponse) {
        try {
            // 💡 Correction : Utilisation des packages de désérialisation officiels
            JsonNode root = objectMapper.readTree(jsonResponse);

            // Vérifie si l'API a retourné une erreur bloquante
            if (root.has("error")) {
                String erreur = root.get("error").get("message").asText();
                System.out.println("Erreur Gemini : " + erreur);
                return "Le coach est temporairement indisponible. Réessaie dans quelques instants.";
            }

            // Extraction sécurisée du nœud textuel
            JsonNode textNode = root
                    .path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (!textNode.isMissingNode() && textNode.asText() != null) {
                return textNode.asText();
            }

            return "Je n'ai pas pu générer une réponse. Réessaie !";

        } catch (Exception e) {
            System.out.println("Erreur parsing Gemini : " + e.getMessage());
            return "Erreur technique lors de l'analyse de la réponse.";
        }
    }
}