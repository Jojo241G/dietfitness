package com.dietfitness.model;

import java.util.List;

public class Profile {
    private String prenom;
    private Double poids;
    private Double taille;
    private String objectif;
    private List<String> allergies;
    private List<String> conditionsMedicales;

    // Constructeur vide obligatoire pour Jackson
    public Profile() {}

    // Getters & Setters
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public Double getPoids() { return poids; }
    public void setPoids(Double poids) { this.poids = poids; }

    public Double getTaille() { return taille; }
    public void setTaille(Double taille) { this.taille = taille; }

    public String getObjectif() { return objectif; }
    public void setObjectif(String objectif) { this.objectif = objectif; }

    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) { this.allergies = allergies; }

    public List<String> getConditionsMedicales() { return conditionsMedicales; }
    public void setConditionsMedicales(List<String> conditionsMedicales) {
        this.conditionsMedicales = conditionsMedicales;
    }
}