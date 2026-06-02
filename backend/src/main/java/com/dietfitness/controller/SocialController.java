package com.dietfitness.controller;

import com.dietfitness.model.Post;
import com.dietfitness.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
public class SocialController {

    @Autowired
    private PostRepository postRepository;

    // ── POST /api/posts ───────────────────────────────────────────────────────
    @PostMapping("/api/posts")
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> body) {
        try {
            String contenu      = (String) body.get("contenu");
            String categorie    = (String) body.get("categorie");
            String auteurPrenom = (String) body.get("auteurPrenom");

            if (contenu == null || contenu.isBlank()) {
                return ResponseEntity.badRequest().body("Le contenu est obligatoire.");
            }
            if (!List.of("General", "Recettes", "Motivation").contains(categorie)) {
                return ResponseEntity.badRequest().body("Categorie invalide.");
            }

            Post post = new Post();
            post.setUserId(((Number) body.get("userId")).longValue());
            post.setAuteurPrenom(auteurPrenom != null ? auteurPrenom : "Anonyme");
            post.setCategorie(categorie);
            post.setContenu(contenu);
            post.setLikes(0);
            post.setDatePublication(LocalDateTime.now());

            Post saved = postRepository.save(post);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }

    // ── GET /api/posts ────────────────────────────────────────────────────────
    @GetMapping("/api/posts")
    public ResponseEntity<?> getPosts(@RequestParam(required = false) String categorie) {
        try {
            List<Post> posts;
            if (categorie != null && !categorie.isBlank()) {
                posts = postRepository.findByCategorieOrderByDatePublicationDesc(categorie);
            } else {
                posts = postRepository.findAllByOrderByDatePublicationDesc();
            }
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }

    // ── POST /api/posts/{id}/like ─────────────────────────────────────────────
    @PostMapping("/api/posts/{id}/like")
    public ResponseEntity<?> toggleLike(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Optional<Post> optPost = postRepository.findById(id);
            if (optPost.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            boolean liked = Boolean.TRUE.equals(body.get("liked"));
            if (liked) {
                postRepository.incrementLikes(id);
            } else {
                postRepository.decrementLikes(id);
            }

            Post updated = postRepository.findById(id).orElseThrow();
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }
}