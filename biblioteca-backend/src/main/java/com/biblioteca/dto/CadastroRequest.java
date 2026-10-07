package com.biblioteca.dto;

/**
 * Dados recebidos no corpo da requisição de cadastro de conta.
 */
public class CadastroRequest {

    private String nome;
    private String cpf;
    private String email;
    private String telefone;
    private String senha;
    private String tipo; // "ALUNO" ou "BIBLIOTECARIO"

    public CadastroRequest() {}

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
}
