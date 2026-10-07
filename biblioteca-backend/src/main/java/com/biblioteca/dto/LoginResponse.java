package com.biblioteca.dto;

/**
 * Dados retornados após um login bem-sucedido.
 * O frontend armazena o token e o utiliza no header Authorization.
 */
public class LoginResponse {

    private String token;
    private Long id;
    private String nome;
    private String email;
    private String tipo; // "ALUNO" ou "BIBLIOTECARIO"

    public LoginResponse() {}

    public LoginResponse(String token, Long id, String nome, String email, String tipo) {
        this.token = token;
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.tipo = tipo;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
}
