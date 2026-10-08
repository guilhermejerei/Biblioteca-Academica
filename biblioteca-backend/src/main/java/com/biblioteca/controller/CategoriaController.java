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

    /**
     * POST /api/categorias — cria uma área ou uma subcategoria.
     *
     * Qual dos dois depende do corpo: sem `categoriaPai` nasce uma ÁREA, que
     * exige cor e define a ordem das pilhas; com `categoriaPai` nasce uma
     * SUBCATEGORIA, ligada àquela área.
     *
     * Sem nenhum dos dois campos a categoria nasceria órfã — invisível para o
     * filtro em pilhas — e por isso o serviço recusa com mensagem explicando.
     */
    @PostMapping
    public ResponseEntity<Categoria> cadastrar(@RequestBody Categoria categoria) {
        Categoria novaCategoria = categoriaService.salvar(categoria);
        return ResponseEntity.status(HttpStatus.CREATED).body(novaCategoria);
    }

    /** A próxima ordem livre de área, para o formulário já vir preenchido. */
    @GetMapping("/proxima-ordem")
    public ResponseEntity<Map<String, Integer>> proximaOrdem() {
        return ResponseEntity.ok(Map.of("ordem", categoriaService.proximaOrdem()));
    }

    /**
     * PUT /api/categorias/{id} — renomeia, troca a cor e a ordem de uma área,
     * ou move uma subcategoria de área.
     *
     * Os erros não são mais capturados aqui: NegocioException sobe até o
     * GlobalExceptionHandler, que devolve 400 com a mensagem em português. Com o
     * try/catch antigo, tanto "categoria duplicada" quanto "área não encontrada"
     * viravam 404 sem corpo, e a tela não tinha o que mostrar.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Categoria> atualizar(
            @PathVariable Long id, @RequestBody Categoria categoria) {
        return ResponseEntity.ok(categoriaService.atualizar(id, categoria));
    }

    /**
     * DELETE /api/categorias/{id} — exclui, recusando com a contagem quando a
     * categoria ainda está em uso.
     *
     * A contagem importa: sem ela, apagar uma área com filhas batia no índice
     * estrangeiro do banco e o usuário recebia um 404 mudo, sem ideia do que
     * soltar primeiro.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        categoriaService.excluir(id);
        return ResponseEntity.noContent().build(); // 204
    }
}