package com.biblioteca.service.capa;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;

@Service
public class ArmazenamentoCapaService {

    private final Path diretorioBase;

    public ArmazenamentoCapaService(@Value("${app.capas.diretorio:./uploads/capas}") String caminhoDiretorio) {
        this.diretorioBase = Paths.get(caminhoDiretorio).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.diretorioBase);
        } catch (IOException e) {
            throw new RuntimeException("Não foi possível inicializar o diretório de capas: " + this.diretorioBase, e);
        }
    }

    public Path getDiretorioBase() {
        return diretorioBase;
    }

    /**
     * Salva a imagem da capa gerando o nome no servidor a partir do ID do livro.
     * Retorna apenas o nome do arquivo gerado (ex: capa_livro_1.jpg).
     */
    public synchronized String salvarCapa(Long livroId, byte[] bytes, String extensao) throws IOException {
        if (livroId == null) {
            throw new IllegalArgumentException("ID do livro não pode ser nulo");
        }

        // Remove capa anterior se existir
        removerCapa(livroId);

        String nomeArquivo = "capa_livro_" + livroId + "." + extensao.toLowerCase().replace(".", "");
        Path destino = resolverCaminhoSeguro(nomeArquivo);

        Files.write(destino, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return nomeArquivo;
    }

    /**
     * Recupera o arquivo associado ao nome registrado no livro.
     */
    public Path recuperarArquivo(String nomeArquivo) {
        if (nomeArquivo == null || nomeArquivo.isBlank()) {
            return null;
        }
        Path arquivo = resolverCaminhoSeguro(nomeArquivo);
        if (Files.exists(arquivo) && Files.isRegularFile(arquivo)) {
            return arquivo;
        }
        return null;
    }

    /**
     * Remove qualquer arquivo existente associado a esse livro.
     */
    public synchronized void removerCapa(Long livroId) {
        if (livroId == null) return;
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(diretorioBase, "capa_livro_" + livroId + ".*")) {
            for (Path p : stream) {
                Files.deleteIfExists(p);
            }
        } catch (IOException ignored) {}
    }

    /**
     * Garante que o arquivo esteja estritamente contido no diretório de capas,
     * impedindo qualquer tentativa de path traversal (como ../).
     */
    public Path resolverCaminhoSeguro(String nomeArquivo) {
        if (nomeArquivo == null || nomeArquivo.contains("/") || nomeArquivo.contains("\\") || nomeArquivo.contains("..")) {
            throw new SecurityException("Tentativa de acesso a caminho inválido: " + nomeArquivo);
        }
        Path resolvido = diretorioBase.resolve(nomeArquivo).normalize();
        if (!resolvido.startsWith(diretorioBase)) {
            throw new SecurityException("Tentativa de escape de diretório: " + nomeArquivo);
        }
        return resolvido;
    }
}
