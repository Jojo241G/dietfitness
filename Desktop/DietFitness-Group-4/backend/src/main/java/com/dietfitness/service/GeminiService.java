package com.dietfitness.service;

import com.dietfitness.model.Profile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class GeminiService {

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Value("${openrouter.api.url}")
    private String apiUrl;

    private final WebClient webClient;
    private final ObjectMapper mapper = new ObjectMapper();
    private final DataService dataService;

    public GeminiService(DataService dataService) {
        this.dataService = dataService;
        this.webClient = WebClient.builder().build();
    }

    public String genererReponse(String messageUtilisateur, Profile profil) {
        try {
            String prompt = construirePrompt(messageUtilisateur, profil);

            // Corps de la requête OpenRouter
            ObjectNode body = mapper.createObjectNode();
            body.put("model", "mistralai/mistral-7b-instruct:free");

            ArrayNode messages = body.putArray("messages");

            ObjectNode systemMsg = messages.addObject();
            systemMsg.put("role", "system");
            systemMsg.put("content",
                "Tu es un coach fitness et nutritionniste expert en alimentation camerounaise. " +
                "Tu t'appelles Coach DietFitness. Reponds toujours en francais. " +
                "Sois bienveillant, precis et adapte tes conseils au profil utilisateur.");

            ObjectNode userMsg = messages.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", prompt);

            // Appel API OpenRouter
            String responseJson = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("HTTP-Referer", "http://localhost:8080")
                    .header("X-Title", "DietFitness")
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Extraction de la reponse
            JsonNode responseNode = mapper.readTree(responseJson);
            return responseNode
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content")
                    .asText("Je suis la pour vous aider !");

        } catch (Exception e) {
            System.out.println("Erreur OpenRouter : " + e.getMessage());
            return "Desole, je rencontre une difficulte technique. Reessayez dans un moment.";
        }
    }

    private String construirePrompt(String message, Profile profil) {
        StringBuilder prompt = new StringBuilder();

        if (profil != null) {
            prompt.append("PROFIL UTILISATEUR :\n");
            if (profil.getPrenom() != null)
                prompt.append("- Prenom : ").append(profil.getPrenom()).append("\n");
            if (profil.getPoids() != null)
                prompt.append("- Poids : ").append(profil.getPoids()).append(" kg\n");
            if (profil.getTaille() != null)
                prompt.append("- Taille : ").append(profil.getTaille()).append(" cm\n");
            if (profil.getObjectif() != null)
                prompt.append("- Objectif : ").append(profil.getObjectif()).append("\n");
            if (profil.getAllergies() != null && !profil.getAllergies().isEmpty())
                prompt.append("- Allergies : ")
                      .append(String.join(", ", profil.getAllergies())).append("\n");
            if (profil.getConditionsMedicales() != null && !profil.getConditionsMedicales().isEmpty())
                prompt.append("- Conditions medicales : ")
                      .append(String.join(", ", profil.getConditionsMedicales())).append("\n");
        }

        prompt.append("\nDONNEES NUTRITIONNELLES :\n");
        prompt.append(dataService.getContexteNutrition());
        prompt.append("\nQUESTION : ").append(message);
        prompt.append("\n\nReponds en max 3 paragraphes courts. ");
        prompt.append("Utilise des references a la cuisine camerounaise quand c'est pertinent.");

        return prompt.toString();
    }
}