package com.dietfitness.controller;

import com.dietfitness.model.ChatMessage;
import com.dietfitness.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    // POST /api/chat
    // Corps attendu :
    // {
    //   "message": "Que manger après le sport ?",
    //   "profil": { "prenom": "Marie", "poids": 68, ... }
    // }
    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        try {
            String message = (String) body.get("message");

            if (message == null || message.isBlank()) {
                return ResponseEntity.badRequest()
                        .body("Le champ 'message' est obligatoire.");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> profil = (Map<String, Object>) body.get("profil");

            ChatMessage reponse = chatService.traiterMessage(message, profil);
            return ResponseEntity.ok(reponse);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur du chatbot : " + e.getMessage());
        }
    }

    // GET /api/chat/test → vérifie que le chatbot est en ligne
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Coach DietFitness est en ligne ! Posez vos questions.");
    }
}