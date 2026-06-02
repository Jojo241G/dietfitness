package com.dietfitness.model;

public class ChatRequest {
    private String message;
    private Profile profil;

    public ChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Profile getProfil() { return profil; }
    public void setProfil(Profile profil) { this.profil = profil; }
}