package com.dietfitness.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
public class DataService {

    private JsonNode dbData;
    private final ObjectMapper mapper = new ObjectMapper();

    public DataService() {
        try {
            InputStream is = getClass().getResourceAsStream("/data/db.json");
            if (is != null) {
                dbData = mapper.readTree(is);
            }
        } catch (Exception e) {
            System.out.println("⚠️ Impossible de charger db.json : " + e.getMessage());
        }
    }

    public JsonNode getPlats() {
        return dbData != null ? dbData.get("plats") : mapper.createArrayNode();
    }

    public JsonNode getExercices() {
        return dbData != null ? dbData.get("exercices") : mapper.createArrayNode();
    }

    public String getContexteNutrition() {
        if (dbData == null) return "Données non disponibles";

        StringBuilder sb = new StringBuilder("Plats camerounais disponibles :\n");
        JsonNode plats = dbData.get("plats");
        if (plats != null) {
            plats.forEach(plat -> {
                sb.append("- ").append(plat.get("nom").asText())
                  .append(" (").append(plat.get("calories").asInt()).append(" kcal")
                  .append(", ").append(plat.get("proteines").asInt()).append("g protéines)")
                  .append("\n");
            });
        }
        return sb.toString();
    }
}