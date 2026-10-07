package com.biblioteca.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuração do Spring Security.
 *
 * O Spring Security tem seu próprio filtro CORS que roda ANTES do
 * WebMvcConfigurer. Se não configurarmos o CORS aqui, ele bloqueia
 * os requests OPTIONS (preflight) antes mesmo de chegarmos no nosso
 * AuthInterceptor ou no addCorsMappings do WebConfig.
 *
 * Solução: registrar um CorsConfigurationSource como bean e habilitá-lo
 * no SecurityFilterChain via http.cors(...).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Desativa proteção CSRF (API REST stateless não precisa)
            .csrf(AbstractHttpConfigurer::disable)
            // Habilita CORS usando o bean corsConfigurationSource definido abaixo
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Libera todos os endpoints — o AuthInterceptor cuida da proteção
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }

    /**
     * Fonte de configuração CORS usada pelo filtro do Spring Security.
     * Deve espelhar exatamente o que está em WebConfig.addCorsMappings().
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Origens permitidas (React no Vite e no CRA)
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000"
        ));

        // Métodos permitidos, incluindo OPTIONS para o preflight
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Cabeçalhos permitidos (inclui Authorization para o nosso token Bearer)
        config.setAllowedHeaders(List.of("*"));

        // Sem cookies/credenciais — usamos token no header
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    /**
     * Bean do BCryptPasswordEncoder disponível para injeção em qualquer classe.
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
