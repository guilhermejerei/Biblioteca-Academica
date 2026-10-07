package com.biblioteca.controller;

import com.biblioteca.model.Livro;
import com.biblioteca.repository.LivroRepository;
import com.biblioteca.service.capa.ArmazenamentoCapaService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.util.Optional;

@RestController
@RequestMapping("/api/capas")
public class CapaController {

    private final LivroRepository livroRepository;
    private final ArmazenamentoCapaService armazenamentoCapaService;

    public CapaController(LivroRepository livroRepository, ArmazenamentoCapaService armazenamentoCapaService) {
        this.livroRepository = livroRepository;
        this.armazenamentoCapaService = armazenamentoCapaService;
    }

    /**
     * Endpoint público para servir as imagens de capa dos livros.
     * Não requer autenticação pois é consumido diretamente por tags <img> do navegador.
     * Suporta cache com validade longa e ETag (retornando 304 Not Modified se apropriado).
     */
    @GetMapping("/{livroId}")
    public ResponseEntity<byte[]> obterCapa(
            @PathVariable Long livroId,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch
    ) throws IOException {
        Optional<Livro> optLivro = livroRepository.findById(livroId);
        if (optLivro.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Livro livro = optLivro.get();
        if (livro.getCapaArquivo() == null || livro.getCapaArquivo().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        Path arquivo = armazenamentoCapaService.recuperarArquivo(livro.getCapaArquivo());
        if (arquivo == null) {
            return ResponseEntity.notFound().build();
        }

        FileTime lastModified = Files.getLastModifiedTime(arquivo);
        long tamanho = Files.size(arquivo);
        String etag = "\"" + livroId + "-" + lastModified.toMillis() + "-" + tamanho + "\"";

        if (ifNoneMatch != null && ifNoneMatch.equals(etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                    .build();
        }

        byte[] bytes = Files.readAllBytes(arquivo);
        MediaType mediaType = determinarMediaType(livro.getCapaArquivo());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .eTag(etag)
                .contentType(mediaType)
                .contentLength(bytes.length)
                .body(bytes);
    }

    private MediaType determinarMediaType(String nomeArquivo) {
        String lower = nomeArquivo.toLowerCase();
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }
}
