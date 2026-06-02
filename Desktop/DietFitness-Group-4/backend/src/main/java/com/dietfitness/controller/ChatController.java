package com.dietfitness.controller;

import com.dietfitness.model.ChatRequest;
import com.dietfitness.model.ChatResponse;
import com.dietfitness.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final GeminiService geminiService;

    public ChatController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/send")
    public ResponseEntity<ChatResponse> envoyerMessage(@RequestBody ChatRequest request) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ChatResponse("Le message ne peut pas être vide.", false));
        }

        String reponse = geminiService.genererReponse(
                request.getMessage(),
                request.getProfil()
        );

        return ResponseEntity.ok(new ChatResponse(reponse, true));
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("✅ DietFitness Backend opérationnel !");
    }
}