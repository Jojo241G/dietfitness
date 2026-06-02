package com.dietfitness.model;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessage {
    private String role;     // "user" ou "coach"
    private String message;  // contenu du message
}