package com.biblioteca.controller;

import com.biblioteca.dto.ArvoreCategorias;
import com.biblioteca.dto.FiltroAcervo;
import com.biblioteca.dto.FiltroCategoria;
import com.biblioteca.model.Categoria;
import com.biblioteca.service.CategoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

    @Autowired
    private com.biblioteca.service.LivroBuscaService buscaService;

    /**
     * Os ids de área e de subcategoria existentes, para validar o que chega
     * pela URL. Um id desconhecido é descartado em silêncio em vez de derrubar
     * a requisição — link antigo e categoria apagada não podem quebrar a página.
     */
    @GetMapping("/ids")
    public ResponseEntity<?> ids() {
        return ResponseEntity.ok(Map.of(
                "areas", buscaService.idsDeAreas(),
                "subcategorias", buscaService.idsDeSubcategorias()));
    }

    // GET /api/categorias — lista todas as categorias
    @GetMapping
    public ResponseEntity<List<Categoria>> listarTodos() {
        List<Categoria> categorias = categoriaService.listarTodos();
        return ResponseEntity.ok(categorias);
    }

    /**
     * GET /api/categorias/arvore — as áreas na ordem fixa, com as subcategorias,
     * a cor e as contagens.
     *
     * Precisa vir antes de /{id} no mapeamento, senão "arvore" seria lido como id.
     *
     * Quem não é bibliotecário não vê as categorias sem livro nenhum: uma pilha
     * com zero não tem o que oferecer e só polui a fileira.
     */
    @GetMapping("/arvore")
    public ResponseEntity<ArvoreCategorias> arvore(
            @RequestParam(required = false) List<Long> cat,
            @RequestParam(required = false) List<Long> area,
            @RequestParam(required = false) String modo,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Long autor,
            @RequestParam(required = false) String epoca,
            @RequestParam(required = false) Boolean disponiveis,
            @RequestAttribute(value = "usuarioTipo", required = false) String usuarioTipo) {

        boolean bibliotecario = "BIBLIOTECARIO".equals(usuarioTipo);
        FiltroCategoria filtroCat = Filtros.categorias(cat, area, modo, buscaService);
        FiltroAcervo acervo = Filtros.acervo(texto, autor, epoca, disponiveis);

        return ResponseEntity.ok(buscaService.arvore(bibliotecario, filtroCat, acervo));
    }

    // GET /api/categorias/{id} — busca categoria por ID
    @GetMapping("/{id}")
    public ResponseEntity<Categoria> buscarPorId(@PathVariable Long id) {
        return categoriaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/categorias — cadastra nova categoria
    @PostMapping
    public ResponseEntity<Categoria> cadastrar(@RequestBody Categoria categoria) {
        Categoria novaCategoria = categoriaService.salvar(categoria);
        return ResponseEntity.status(HttpStatus.CREATED).body(novaCategoria);
    }

    // PUT /api/categorias/{id} — atualiza categoria existente
    @PutMapping("/{id}")
    public ResponseEntity<Categoria> atualizar(@PathVariable Long id, @RequestBody Categoria categoria) {
        try {
            Categoria categoriaAtualizada = categoriaService.atualizar(id, categoria);
            return ResponseEntity.ok(categoriaAtualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE /api/categorias/{id} — exclui categoria
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        try {
            categoriaService.excluir(id);
            return ResponseEntity.noContent().build(); // 204
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}