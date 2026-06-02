package com.dietfitness.service;

import com.dietfitness.model.Exercice;

import com.fasterxml.jackson.databind.JsonNode;      // 💡 Corrigé ici
import com.fasterxml.jackson.databind.ObjectMapper;  // 💡 Corrigé ici
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class FitnessService {

    private final String dataPath = "src/main/resources/data/data.json";

    private final ObjectMapper mapper = new ObjectMapper();

    // Retourne tous les exercices
    public List<Exercice> getAllExercices() throws Exception {
        JsonNode root = mapper.readTree(new File(dataPath));
        JsonNode exercicesNode = root.get("exercices");

        List<Exercice> exercices = new ArrayList<>();
        for (JsonNode node : exercicesNode) {
            exercices.add(mapper.treeToValue(node, Exercice.class));
        }
        return exercices;
    }

    // Filtre les exercices selon l'objectif de l'utilisateur
    public List<Exercice> getExercicesByObjectif(String objectif) throws Exception {
        List<Exercice> tous = getAllExercices();
        List<Exercice> filtres = new ArrayList<>();

        for (Exercice ex : tous) {
            if (ex.getObjectifs().contains(objectif.toLowerCase())) {
                filtres.add(ex);
            }
        }
        return filtres;
    }

    // Filtre par difficulté
    public List<Exercice> getExercicesByDifficulte(String difficulte) throws Exception {
        List<Exercice> tous = getAllExercices();
        List<Exercice> filtres = new ArrayList<>();

        for (Exercice ex : tous) {
            if (ex.getDifficulte().equalsIgnoreCase(difficulte)) {
                filtres.add(ex);
            }
        }
        return filtres;
    }
}