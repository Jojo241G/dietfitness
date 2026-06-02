package com.dietfitness.service;

import com.dietfitness.model.Plat;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Value;


import java.util.List;

@Service
public class FoodService {

    @Value("${dietfitness.data.path}")
    private String dataPath;

    private final ObjectMapper mapper = new ObjectMapper();

    public List<Plat> getAllPlats() throws Exception {
        JsonNode root = mapper.readTree(new File(dataPath));
        JsonNode platsNode = root.get("plats");

        List<Plat> plats = new ArrayList<>();
        for (JsonNode node : platsNode) {
            plats.add(mapper.treeToValue(node, Plat.class));
        }
        return plats;
    }

    public List<Plat> getPlatsFiltered(List<String> allergies,
                                        List<String> conditions) throws Exception {
        List<Plat> tous = getAllPlats();
        List<Plat> filtres = new ArrayList<>();

        for (Plat plat : tous) {
            boolean allergieSafe = true;
            boolean conditionSafe = true;

            if (allergies != null) {
                for (String allergie : allergies) {
                    if (plat.getAllergenes().contains(allergie.toLowerCase())) {
                        allergieSafe = false;
                        break;
                    }
                }
            }

            if (conditions != null) {
                for (String condition : conditions) {
                    if (plat.getContrindications().contains(condition.toLowerCase())) {
                        conditionSafe = false;
                        break;
                    }
                }
            }

            if (allergieSafe && conditionSafe) {
                filtres.add(plat);
            }
        }
        return filtres;
    }
}