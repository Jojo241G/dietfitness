package com.dietfitness.model;

import lombok.Data;
import java.util.List;

@Data
public class Exercice {
    private int id;
    private String nom;
    private String categorie;
    private String difficulte;
    private int duree_minutes;
    private int calories_brulees;
    private List<String> muscles_cibles;
    private List<String> objectifs;
    private int series;
    private int repetitions;
    private String description;
    private String image;
}