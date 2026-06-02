package com.dietfitness.model;

import lombok.Data;
import java.util.List;

@Data
public class Plat {
    private int id;
    private String nom;
    private String categorie;
    private int calories;
    private int proteines;
    private int glucides;
    private int lipides;
    private String image;
    private String description;
    private List<String> allergenes;
    private List<String> contrindications;
}