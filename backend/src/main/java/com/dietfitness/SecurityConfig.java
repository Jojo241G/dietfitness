package com.dietfitness;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuration Spring Security V3.
 *
 * On active Spring Security uniquement pour BCryptPasswordEncoder.
 * Toutes les routes sont ouvertes (pas de JWT filter côté Spring pour l'instant —
 * la validation du token est faite côté frontend via AsyncStorage).
 *
 * Pour la production, ajoutez un JwtAuthenticationFilter.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** Bean BCrypt réutilisé dans AuthService */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /** Désactive la protection HTTP de Spring Security (CSRF, login form, etc.) */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());
        return http.build();
    }
}
