package com.biblioteca.controller;

import com.biblioteca.model.Livro;
import com.biblioteca.service.LivroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Os erros agora são tratados pelo GlobalExceptionHandler — não há try/catch aqui.
 */
@RestController
@RequestMapping("/api/livros")
public class LivroController {

    @Autowired
    private LivroService livroService;

    @Autowired
    private com.biblioteca.service.capa.CapaLivroService capaLivroService;

    @GetMapping
    public ResponseEntity<List<Livro>> listarTodos() {
        return ResponseEntity.ok(livroService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Livro> buscarPorId(@PathVariable Long id) {
        return livroService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/isbn/{isbn}")
    public ResponseEntity<Livro> buscarPorIsbn(@PathVariable String isbn) {
        return livroService.buscarPorIsbn(isbn)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Livro> cadastrar(@RequestBody Livro livro) {
        return ResponseEntity.status(HttpStatus.CREATED).body(livroService.salvar(livro));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Livro> atualizar(@PathVariable Long id, @RequestBody Livro livro) {
        return ResponseEntity.ok(livroService.atualizar(id, livro));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        livroService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Dispara nova busca externa de capa para um livro específico.
     */
    @PostMapping("/{id}/capa/buscar")
    public ResponseEntity<Livro> buscarCapaNovamente(@PathVariable Long id) {
        Livro atualizado = capaLivroService.buscarCapaSincrono(id, true);
        return ResponseEntity.ok(atualizado);
    }

    /**
     * Upload manual de arquivo de capa pelo bibliotecário.
     */
    @PostMapping(value = "/{id}/capa", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Livro> uploadCapaManual(
            @PathVariable Long id,
            @RequestParam(value = "arquivo", required = false) org.springframework.web.multipart.MultipartFile arquivo,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file
    ) {
        org.springframework.web.multipart.MultipartFile upload = arquivo != null ? arquivo : file;
        Livro atualizado = capaLivroService.salvarCapaManual(id, upload);
        return ResponseEntity.ok(atualizado);
    }

    /**
     * Lista livros pendentes de revisão de capa (títulos divergentes).
     */
    @GetMapping("/capas/revisao")
    public ResponseEntity<List<Livro>> listarCapasParaRevisao() {
        return ResponseEntity.ok(capaLivroService.listarLivrosEmRevisao());
    }

    /**
     * Bibliotecário aprova a capa de um livro em revisão.
     */
    @PutMapping("/{id}/capa/aprovar")
    public ResponseEntity<Livro> aprovarCapa(@PathVariable Long id) {
        Livro atualizado = capaLivroService.aprovarCapa(id);
        return ResponseEntity.ok(atualizado);
    }

    /**
     * Bibliotecário rejeita a capa de um livro em revisão.
     */
    @PutMapping("/{id}/capa/rejeitar")
    public ResponseEntity<Livro> rejeitarCapa(@PathVariable Long id) {
        Livro atualizado = capaLivroService.rejeitarCapa(id);
        return ResponseEntity.ok(atualizado);
    }

    /**
     * Sincronização em lote das capas de livros existentes sem capa.
     */
    @PostMapping("/capas/sincronizar")
    public ResponseEntity<com.biblioteca.dto.RelatorioSincronizacao> sincronizarCapasEmLote() {
        com.biblioteca.dto.RelatorioSincronizacao relatorio = capaLivroService.sincronizarCapasLote();
        return ResponseEntity.ok(relatorio);
    }
}
