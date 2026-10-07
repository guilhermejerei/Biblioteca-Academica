package com.biblioteca.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "livros")
public class Livro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, unique = true)
    private String isbn;

    @Column(name = "ano_publicacao")
    private Integer anoPublicacao;

    @Column(name = "quantidade_total", nullable = false)
    private Integer quantidadeTotal;

    @Column(name = "quantidade_disponivel", nullable = false)
    private Integer quantidadeDisponivel;

    @ManyToOne
    @JoinColumn(name = "autor_id", nullable = false)
    private Autor autor;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "livros_categorias",
        joinColumns = @JoinColumn(name = "livro_id"),
        inverseJoinColumns = @JoinColumn(name = "categoria_id")
    )
    private java.util.Set<Categoria> categorias = new java.util.LinkedHashSet<>();

    @Column(name = "capa_arquivo")
    private String capaArquivo;

    @Enumerated(EnumType.STRING)
    @Column(name = "capa_origem")
    private CapaOrigem capaOrigem;

    @Enumerated(EnumType.STRING)
    @Column(name = "capa_status", nullable = false)
    private CapaStatus capaStatus = CapaStatus.SEM_CAPA;

    @Column(name = "capa_atualizada_em")
    private java.time.LocalDateTime capaAtualizadaEm;

    // @JsonIgnore evita serializar empréstimos ao listar livros
    @JsonIgnore
    @OneToMany(mappedBy = "livro", cascade = CascadeType.ALL)
    private List<Emprestimo> emprestimos;

    public Livro() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public Integer getAnoPublicacao() { return anoPublicacao; }
    public void setAnoPublicacao(Integer anoPublicacao) { this.anoPublicacao = anoPublicacao; }

    public Integer getQuantidadeTotal() { return quantidadeTotal; }
    public void setQuantidadeTotal(Integer quantidadeTotal) { this.quantidadeTotal = quantidadeTotal; }

    public Integer getQuantidadeDisponivel() { return quantidadeDisponivel; }
    public void setQuantidadeDisponivel(Integer quantidadeDisponivel) { this.quantidadeDisponivel = quantidadeDisponivel; }

    public Autor getAutor() { return autor; }
    public void setAutor(Autor autor) { this.autor = autor; }

    public java.util.Set<Categoria> getCategorias() { return categorias; }
    public void setCategorias(java.util.Set<Categoria> categorias) { this.categorias = categorias; }

    public List<Emprestimo> getEmprestimos() { return emprestimos; }
    public void setEmprestimos(List<Emprestimo> emprestimos) { this.emprestimos = emprestimos; }

    public String getCapaArquivo() { return capaArquivo; }
    public void setCapaArquivo(String capaArquivo) { this.capaArquivo = capaArquivo; }

    public CapaOrigem getCapaOrigem() { return capaOrigem; }
    public void setCapaOrigem(CapaOrigem capaOrigem) { this.capaOrigem = capaOrigem; }

    public CapaStatus getCapaStatus() { return capaStatus; }
    public void setCapaStatus(CapaStatus capaStatus) { this.capaStatus = capaStatus; }

    public java.time.LocalDateTime getCapaAtualizadaEm() { return capaAtualizadaEm; }
    public void setCapaAtualizadaEm(java.time.LocalDateTime capaAtualizadaEm) { this.capaAtualizadaEm = capaAtualizadaEm; }

    /**
     * URL pública da capa quando encontrada e aprovada.
     * Retorna null se não houver capa ou se estiver em revisão/sem capa.
     */
    @com.fasterxml.jackson.annotation.JsonProperty("urlCapa")
    public String getUrlCapa() {
        if (capaStatus == CapaStatus.ENCONTRADA && capaArquivo != null && !capaArquivo.isBlank() && id != null) {
            return "/api/capas/" + id;
        }
        return null;
    }

    /**
     * URL para visualização interna da imagem mesmo em status REVISAR.
     */
    @com.fasterxml.jackson.annotation.JsonProperty("urlCapaInterna")
    public String getUrlCapaInterna() {
        if (capaArquivo != null && !capaArquivo.isBlank() && id != null) {
            return "/api/capas/" + id;
        }
        return null;
    }
}
