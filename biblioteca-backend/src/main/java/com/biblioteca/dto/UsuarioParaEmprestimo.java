package com.biblioteca.dto;

import java.util.List;

/**
 * O que a tela de "Novo Empréstimo" precisa saber de cada pessoa.
 *
 * Não é o UsuarioDTO da tela de administração, e a diferença é o motivo de
 * existir: aqui não entra CPF, e-mail nem telefone. O bibliotecário no balcão
 * tem o cartão do usuário na mão e escolhe pelo nome; o CPF completo na lista
 * só roubaria largura e faria a pessoa ler números para achar o nome.
 *
 * E entra o que a tela de administración não mostra: os empréstimos em aberto
 * daquela pessoa. Descobrir que o usuário já está atrasado só depois de
 * confirmar o empréstimo novo é tarde demais; o bibliotecário precisa ver
 * antes.
 *
 * Os livros vão como título e id, sem o livro inteiro: são usados só para
 * listar "o que essa pessoa já está com".
 */
public class UsuarioParaEmprestimo {

    private Long id;
    private String nome;

    /** Empréstimos ainda em aberto (ATIVO ou ATRASADO). */
    private List<EmprestoAberto> emprestimos = List.of();

    public UsuarioParaEmprestimo() {}

    public UsuarioParaEmprestimo(Long id, String nome, List<EmprestoAberto> emprestimos) {
        this.id = id;
        this.nome = nome;
        this.emprestimos = emprestimos == null ? List.of() : emprestimos;
    }

    /** Um livro que a pessoa tem em mãos, e há quantos dias. */
    public record EmprestoAberto(Long id, String titulo, String status) {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public List<EmprestoAberto> getEmprestimos() { return emprestimos; }
    public void setEmprestimos(List<EmprestoAberto> emprestimos) {
        this.emprestimos = emprestimos == null ? List.of() : emprestimos;
    }
}