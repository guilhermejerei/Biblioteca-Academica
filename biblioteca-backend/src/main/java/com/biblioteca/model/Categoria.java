package com.biblioteca.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

/**
 * Uma categoria do acervo, em dois níveis.
 *
 *   AREA         → categoriaPai = null, ordemExibicao > 0, cor preenchida
 *   SUBCATEGORIA → categoriaPai = a área, ordemExibicao = 0, cor vazia
 *
 * A distinção é feita pelo categoriaPai, não por um campo "tipo": assim não
 * existe a possibilidade de uma categoria ser área e subcategoria ao mesmo
 * tempo, que é o que o CHECK do banco (chk_categoria_estrutura) impede.
 *
 * A ordemExibicao só existe nas áreas, e é o que define a ordem fixa das
 * pilhas no filtro do acervo.
 */
@Entity
@Table(name = "categorias")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    /**
     * A área, quando esta categoria é uma subcategoria. Null quando é área.
     *
     * EAGER de propósito: a API devolve a categoria direto ao cliente e a
     * árvore do filtro precisa da área junto. Com LAZY o Jackson leria a área
     * fora da transação do repositório e estouraria LazyInitializationException,
     * sem a árvore ganhar nada com a preguiça.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categoria_pai_id")
    private Categoria categoriaPai;

    /** Ordem fixa de exibição da área. Zero nas subcategorias. */
    @Column(name = "ordem_exibicao", nullable = false)
    private Integer ordemExibicao = 0;

    /** Cor da área em hexadecimal, da paleta de index.css. Vazio nas subcategorias. */
    @Column(length = 7)
    private String cor;

    /**
     * Verdadeiro quando esta categoria é uma área (não tem pai).
     *
     * Não é campo no banco: é derivado, para não existir a possibilidade de
     * uma categoria discordar de si mesma sobre o próprio nível.
     */
    @JsonIgnore
    public boolean ehArea() {
        return categoriaPai == null;
    }

    public Categoria() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public Categoria getCategoriaPai() { return categoriaPai; }
    public void setCategoriaPai(Categoria categoriaPai) { this.categoriaPai = categoriaPai; }

    public Integer getOrdemExibicao() { return ordemExibicao; }
    public void setOrdemExibicao(Integer ordemExibicao) { this.ordemExibicao = ordemExibicao; }

    public String getCor() { return cor; }
    public void setCor(String cor) { this.cor = cor; }
}