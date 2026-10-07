package com.biblioteca.security;

import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gerenciador de tokens simples baseado em UUID.
 *
 * Não utiliza JWT nem Spring Security — os tokens são armazenados
 * em memória (mapa) durante a execução do servidor.
 *
 * Cada token guarda: id do usuário, email e tipo (ALUNO/BIBLIOTECARIO).
 * Quando o servidor reinicia, todos os tokens são invalidados.
 */
@Component
public class TokenUtil {

    // Mapa de token → dados do usuário autenticado
    private final ConcurrentHashMap<String, DadosToken> tokens = new ConcurrentHashMap<>();

    /**
     * Gera um novo token para o usuário e o armazena no mapa.
     */
    public String gerarToken(Long usuarioId, String email, String tipo) {
        String token = Base64.getEncoder().encodeToString(
                UUID.randomUUID().toString().getBytes()
        );
        tokens.put(token, new DadosToken(usuarioId, email, tipo));
        return token;
    }

    /**
     * Valida o token e retorna os dados associados.
     * Retorna null se o token não existir ou for inválido.
     */
    public DadosToken validar(String token) {
        if (token == null || token.isBlank()) return null;
        return tokens.get(token);
    }

    /**
     * Remove o token (logout).
     */
    public void invalidar(String token) {
        if (token != null) tokens.remove(token);
    }

    /**
     * Dados do usuário associados a um token ativo.
     */
    public static class DadosToken {
        private final Long usuarioId;
        private final String email;
        private final String tipo; // "ALUNO" ou "BIBLIOTECARIO"

        public DadosToken(Long usuarioId, String email, String tipo) {
            this.usuarioId = usuarioId;
            this.email = email;
            this.tipo = tipo;
        }

        public Long getUsuarioId() { return usuarioId; }
        public String getEmail() { return email; }
        public String getTipo() { return tipo; }

        public boolean isBibliotecario() {
            return "BIBLIOTECARIO".equals(tipo);
        }
    }
}
