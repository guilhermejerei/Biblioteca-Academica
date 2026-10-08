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

    /**
     * As 1 a 4 categorias do livro.
     *
     * EAGER por causa do uso no JSON e no filtro do acervo — é o mesmo
     * comportamento que o ManyToMany antigo tinha, para não introduzir
     * LazyInitializationException na serialização nem N+1 na listagem.
     */
    @OneToMany(mappedBy = "livro", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<LivroCategoria> livroCategorias = new java.util.ArrayList<>();

    /**
     * Nome da categoria como estava antes da migração para duas categorias.
     * Só de leitura — nenhuma regra de negócio olha para cá. Existe para dar
     * um caminho de volta se a classificação for revista.
     */
    @Column(name = "categoria_legada")
    private String categoriaLegada;

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

    public java.util.List<LivroCategoria> getLivroCategorias() { return livroCategorias; }
    public void setLivroCategorias(java.util.List<LivroCategoria> livroCategorias) {
        this.livroCategorias = livroCategorias;
    }

    public String getCategoriaLegada() { return categoriaLegada; }
    public void setCategoriaLegada(String categoriaLegada) { this.categoriaLegada = categoriaLegada; }

    /**
     * Atalho para o JSON: só as categorias, sem o wrapper da ligação.
     * Mantém o formato que o frontend já consome ("categorias": [{id, nome}]).
     */
    @com.fasterxml.jackson.annotation.JsonProperty("categorias")
    public java.util.List<Categoria> getCategorias() {
        return livroCategorias.stream()
                .map(LivroCategoria::getCategoria)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * A categoria principal do livro, ou null se alguma inconsistência dejar o
     * livro sem nenhuma principal. É dela que sai a cor da lombada e a
     * etiqueta da capa.
     */
    @JsonIgnore
    public Categoria getCategoriaPrincipal() {
        return livroCategorias.stream()
                .filter(LivroCategoria::isPrincipal)
                .map(LivroCategoria::getCategoria)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

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
     * URL interna da capa, útil enquanto ela está em REVISAR (ainda não
     * publicada, mas o bibliotecário precisa ver para aprovar).
     */
    @com.fasterxml.jackson.annotation.JsonProperty("urlCapaInterna")
    public String getUrlCapaInterna() {
        if (capaArquivo != null && !capaArquivo.isBlank() && id != null) {
            return "/api/capas/" + id;
        }
        return null;
    }

    /**
     * Categoria principal do livro, com a cor da sua área. É daqui que a
     * estante tira a cor da lombada e a etiqueta da capa.
     */
    @com.fasterxml.jackson.annotation.JsonProperty("categoriaPrincipal")
    public Categoria getCategoriaPrincipalSerializada() { return getCategoriaPrincipal(); }
}
