package com.biblioteca.service.capa;

import com.biblioteca.dto.RelatorioSincronizacao;
import com.biblioteca.exception.NegocioException;
import com.biblioteca.exception.RecursoNaoEncontradoException;
import com.biblioteca.model.CapaOrigem;
import com.biblioteca.model.CapaStatus;
import com.biblioteca.model.Livro;
import com.biblioteca.repository.LivroRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CapaLivroService {

    private static final Logger log = LoggerFactory.getLogger(CapaLivroService.class);

    private final LivroRepository livroRepository;
    private final ArmazenamentoCapaService armazenamentoCapaService;
    private final CapaCascataService capaCascataService;

    public CapaLivroService(
            LivroRepository livroRepository,
            ArmazenamentoCapaService armazenamentoCapaService,
            CapaCascataService capaCascataService
    ) {
        this.livroRepository = livroRepository;
        this.armazenamentoCapaService = armazenamentoCapaService;
        this.capaCascataService = capaCascataService;
    }

    /**
     * Executa a busca de capa de forma assíncrona após o cadastro do livro.
     * Não bloqueia a transação de cadastro e falhas deixam o status SEM_CAPA.
     */
    @Async
    public void buscarCapaAssincrono(Long livroId) {
        try {
            buscarCapaSincrono(livroId, false);
        } catch (Exception e) {
            log.error("Erro assíncrono ao processar capa do livro ID {}: {}", livroId, e.getMessage());
        }
    }

    /**
     * Executa a busca de capa para um livro específico.
     * Se forcar == true (ação de "Buscar capa novamente"), processa mesmo se status não for SEM_CAPA,
     * DESDE QUE a origem não seja MANUAL (capas manuais nunca são sobrescritas).
     */
    @Transactional
    public Livro buscarCapaSincrono(Long livroId, boolean forcar) {
        Livro livro = livroRepository.findById(livroId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Livro não encontrado com id: " + livroId));

        // Regra: Uma capa manual NUNCA é sobrescrita por busca automática
        if (livro.getCapaOrigem() == CapaOrigem.MANUAL) {
            log.info("Livro ID {} possui capa manual. Busca automática ignorada.", livroId);
            return livro;
        }

        // Se já tiver capa encontrada e não for para forçar
        if (!forcar && livro.getCapaStatus() == CapaStatus.ENCONTRADA) {
            return livro;
        }

        // Validação e normalização de ISBN
        IsbnUtil.ResultadoIsbn resultadoIsbn = IsbnUtil.validarEConverter(livro.getIsbn());
        if (!resultadoIsbn.valido()) {
            log.info("Livro ID {} possui ISBN inválido: {}. Motivo: {}", livroId, livro.getIsbn(), resultadoIsbn.motivo());
            livro.setCapaStatus(CapaStatus.SEM_CAPA);
            livro.setCapaAtualizadaEm(LocalDateTime.now());
            return livroRepository.save(livro);
        }

        String isbn13 = resultadoIsbn.isbn13();

        // Busca em cascata
        CapaCascataService.CapaEncontrada encontrada = capaCascataService.buscarCapaEmCascata(isbn13);
        if (encontrada == null || encontrada.bytes() == null || encontrada.bytes().length == 0) {
            log.info("Nenhuma capa externa encontrada para livro ID {} (ISBN {})", livroId, isbn13);
            livro.setCapaStatus(CapaStatus.SEM_CAPA);
            livro.setCapaAtualizadaEm(LocalDateTime.now());
            return livroRepository.save(livro);
        }

        // Valida imagem
        ImagemValidador.ResultadoValidacaoImagem validacao = ImagemValidador.validar(encontrada.bytes());
        if (!validacao.valida()) {
            log.warn("Imagem retornada para livro ID {} rejeitada: {}", livroId, validacao.motivoRejeicao());
            livro.setCapaStatus(CapaStatus.SEM_CAPA);
            livro.setCapaAtualizadaEm(LocalDateTime.now());
            return livroRepository.save(livro);
        }

        try {
            // Salva imagem no disco com nome gerado a partir do id do livro
            String nomeArquivo = armazenamentoCapaService.salvarCapa(livroId, encontrada.bytes(), validacao.formato().getExtensao());
            livro.setCapaArquivo(nomeArquivo);
            livro.setCapaOrigem(encontrada.origem());
            livro.setCapaAtualizadaEm(LocalDateTime.now());

            // Comparação de títulos
            boolean compativel = ImagemValidador.titulosCompativeis(livro.getTitulo(), encontrada.tituloFonte());
            if (!compativel) {
                log.warn("Título da fonte externa ('{}') divergiu do título cadastrado ('{}') para livro ID {}. Status definido para REVISAR.",
                        encontrada.tituloFonte(), livro.getTitulo(), livroId);
                livro.setCapaStatus(CapaStatus.REVISAR);
            } else {
                livro.setCapaStatus(CapaStatus.ENCONTRADA);
            }

            return livroRepository.save(livro);
        } catch (IOException e) {
            log.error("Erro ao salvar arquivo de capa para livro ID {}: {}", livroId, e.getMessage());
            livro.setCapaStatus(CapaStatus.SEM_CAPA);
            livro.setCapaAtualizadaEm(LocalDateTime.now());
            return livroRepository.save(livro);
        }
    }

    /**
     * Upload manual de capa pelo bibliotecário.
     */
    @Transactional
    public Livro salvarCapaManual(Long livroId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new NegocioException("Nenhum arquivo enviado.");
        }

        Livro livro = livroRepository.findById(livroId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Livro não encontrado com id: " + livroId));

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new NegocioException("Erro ao ler o arquivo enviado: " + e.getMessage());
        }

        ImagemValidador.ResultadoValidacaoImagem validacao = ImagemValidador.validar(bytes);
        if (!validacao.valida()) {
            throw new NegocioException("Imagem inválida: " + validacao.motivoRejeicao());
        }

        try {
            String nomeArquivo = armazenamentoCapaService.salvarCapa(livroId, bytes, validacao.formato().getExtensao());
            livro.setCapaArquivo(nomeArquivo);
            livro.setCapaOrigem(CapaOrigem.MANUAL);
            livro.setCapaStatus(CapaStatus.ENCONTRADA);
            livro.setCapaAtualizadaEm(LocalDateTime.now());
            return livroRepository.save(livro);
        } catch (IOException e) {
            throw new NegocioException("Erro ao salvar arquivo de capa no disco: " + e.getMessage());
        }
    }

    /**
     * Bibliotecário aprova uma capa em revisão.
     */
    @Transactional
    public Livro aprovarCapa(Long livroId) {
        Livro livro = livroRepository.findById(livroId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Livro não encontrado com id: " + livroId));

        if (livro.getCapaArquivo() == null || livro.getCapaArquivo().isBlank()) {
            throw new NegocioException("O livro não possui arquivo de capa para aprovar.");
        }

        livro.setCapaStatus(CapaStatus.ENCONTRADA);
        livro.setCapaAtualizadaEm(LocalDateTime.now());
        return livroRepository.save(livro);
    }

    /**
     * Bibliotecário rejeita uma capa em revisão (remove o arquivo e marca SEM_CAPA).
     */
    @Transactional
    public Livro rejeitarCapa(Long livroId) {
        Livro livro = livroRepository.findById(livroId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Livro não encontrado com id: " + livroId));

        armazenamentoCapaService.removerCapa(livroId);
        livro.setCapaArquivo(null);
        livro.setCapaOrigem(null);
        livro.setCapaStatus(CapaStatus.SEM_CAPA);
        livro.setCapaAtualizadaEm(LocalDateTime.now());
        return livroRepository.save(livro);
    }

    /**
     * Lista livros pendentes de revisão.
     */
    public List<Livro> listarLivrosEmRevisao() {
        return livroRepository.findByCapaStatus(CapaStatus.REVISAR);
    }

    /**
     * Dispara sincronização em lote para livros sem capa, com pausa de pelo menos 500ms entre eles.
     */
    public RelatorioSincronizacao sincronizarCapasLote() {
        List<Livro> livrosSemCapa = livroRepository.findByCapaStatus(CapaStatus.SEM_CAPA);
        int total = livrosSemCapa.size();
        int encontradas = 0;
        int semCapa = 0;
        int emRevisao = 0;
        List<RelatorioSincronizacao.ItemIsbnInvalido> invalidos = new ArrayList<>();

        for (int i = 0; i < total; i++) {
            Livro livro = livrosSemCapa.get(i);

            // Não sobrescrever MANUAL
            if (livro.getCapaOrigem() == CapaOrigem.MANUAL) {
                continue;
            }

            IsbnUtil.ResultadoIsbn resIsbn = IsbnUtil.validarEConverter(livro.getIsbn());
            if (!resIsbn.valido()) {
                invalidos.add(new RelatorioSincronizacao.ItemIsbnInvalido(
                        livro.getId(),
                        livro.getTitulo(),
                        livro.getIsbn(),
                        resIsbn.motivo()
                ));
                semCapa++;
            } else {
                try {
                    Livro atualizado = buscarCapaSincrono(livro.getId(), true);
                    if (atualizado.getCapaStatus() == CapaStatus.ENCONTRADA) {
                        encontradas++;
                    } else if (atualizado.getCapaStatus() == CapaStatus.REVISAR) {
                        emRevisao++;
                    } else {
                        semCapa++;
                    }
                } catch (Exception e) {
                    log.error("Erro ao sincronizar capa do livro {}: {}", livro.getId(), e.getMessage());
                    semCapa++;
                }

                // Pausa obrigatória de pelo menos 500ms entre chamadas externas
                try {
                    Thread.sleep(550);
                } catch (InterruptedException ignored) {}
            }
        }

        return new RelatorioSincronizacao(total, encontradas, semCapa, emRevisao, invalidos);
    }
}
