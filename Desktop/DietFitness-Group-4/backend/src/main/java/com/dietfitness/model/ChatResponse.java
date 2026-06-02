package com.dietfitness.model;

public class ChatResponse {
    private String reponse;
    private boolean success;

    public ChatResponse(String reponse, boolean success) {
        this.reponse = reponse;
        this.success = success;
    }

    public String getReponse() { return reponse; }
    public void setReponse(String reponse) { this.reponse = reponse; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
}