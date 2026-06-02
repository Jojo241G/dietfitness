package com.dietfitness.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

/**
 * Service d'envoi d'emails (confirmation d'inscription, reset de mot de passe).
 * Utilise Spring Mail (SMTP Gmail ou autre fournisseur configuré dans application.properties).
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

@Value("${app.mail.from:ojoslath@gmail.com}")
private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    // ── Email de confirmation d'inscription ───────────────────────────────────
    public void envoyerEmailConfirmation(String destinataire, String prenom, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(destinataire);
            helper.setSubject("🥗 DietFitness — Confirmez votre adresse email");

            String lien = baseUrl + "/api/auth/confirm?token=" + token;

            String html = """
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background: #f7f3ec; margin: 0; padding: 0;">
                      <div style="max-width: 520px; margin: 40px auto; background: #fff;
                                  border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                        
                        <!-- Header -->
                        <div style="background: #1c3a2e; padding: 32px 40px; text-align: center;">
                          <h1 style="color: #fff; font-size: 28px; margin: 0; letter-spacing: -0.5px;">
                            🥗 DietFitness
                          </h1>
                          <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 13px;">
                            Votre compagnon nutrition & fitness
                          </p>
                        </div>
                        
                        <!-- Body -->
                        <div style="padding: 40px;">
                          <h2 style="color: #1c3a2e; font-size: 22px; margin: 0 0 12px;">
                            Bonjour %s ! 👋
                          </h2>
                          <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">
                            Merci de vous être inscrit(e) sur DietFitness. 
                            Pour activer votre compte et commencer votre parcours santé, 
                            cliquez sur le bouton ci-dessous.
                          </p>
                          
                          <div style="text-align: center; margin: 32px 0;">
                            <a href="%s" style="background: #1c3a2e; color: #fff; padding: 16px 40px;
                                               border-radius: 12px; text-decoration: none; font-weight: bold;
                                               font-size: 16px; display: inline-block;">
                              ✅ Confirmer mon adresse email
                            </a>
                          </div>
                          
                          <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 24px 0 0;">
                            Ce lien est valable 24 heures. Si vous n'avez pas créé de compte 
                            DietFitness, ignorez simplement cet email.
                          </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background: #f7f3ec; padding: 20px 40px; text-align: center;
                                    border-top: 1px solid #e8e4dc;">
                          <p style="color: #999; font-size: 11px; margin: 0;">
                            © 2025 DietFitness · Votre santé, notre mission
                          </p>
                        </div>
                      </div>
                    </body>
                    </html>
                    """.formatted(prenom, lien);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Erreur envoi email de confirmation : " + e.getMessage(), e);
        }
    }

    // ── Email de bienvenue après confirmation ─────────────────────────────────
    public void envoyerEmailBienvenue(String destinataire, String prenom) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(destinataire);
            helper.setSubject("🎉 Bienvenue sur DietFitness, " + prenom + " !");

            String html = """
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; background: #f7f3ec;">
                      <div style="max-width: 520px; margin: 40px auto; background: #fff;
                                  border-radius: 16px; overflow: hidden;">
                        <div style="background: #1c3a2e; padding: 32px 40px; text-align: center;">
                          <h1 style="color: #fff; margin: 0;">🥗 DietFitness</h1>
                        </div>
                        <div style="padding: 40px;">
                          <h2 style="color: #1c3a2e;">Votre compte est activé ! 🎉</h2>
                          <p style="color: #555; line-height: 1.6;">
                            Bienvenue %s ! Votre compte DietFitness est maintenant actif. 
                            Vous pouvez dès à présent vous connecter et commencer votre parcours 
                            nutrition & fitness personnalisé.
                          </p>
                          <p style="color: #555; line-height: 1.6;">
                            💪 Bon courage pour atteindre vos objectifs !
                          </p>
                        </div>
                      </div>
                    </body>
                    </html>
                    """.formatted(prenom);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (Exception e) {
            // Email de bienvenue non bloquant
            System.err.println("Email de bienvenue non envoyé : " + e.getMessage());
        }
    }
}
