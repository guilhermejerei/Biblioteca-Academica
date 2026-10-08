package com.biblioteca.service;

import com.biblioteca.dto.ArvoreCategorias;
import com.biblioteca.dto.FiltroAcervo;
import com.biblioteca.dto.FiltroCategoria;
import com.biblioteca.dto.PaginaLivros;
import com.biblioteca.model.Livro;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.repository.LivroBuscaRepository;
import com.biblioteca.repository.LivroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LivroBuscaService {

    /** Teto de itens por página, para ninguém pedir a lista inteira por engano. */
    public static final int TAMANHO_MAXIMO = 100;

    @Autowired private LivroBuscaRepository buscaRepository;
    @Autowired private LivroRepository      livroRepository;
    @Autowired private CategoriaRepository  categoriaRepository;

    // ═══════════════════════════════════════════════════════════
    // Árvore de categorias
    // ═══════════════════════════════════════════════════════════

    /**
     * As áreas em ordem fixa, com as subcategorias de cada uma.
     *
     * @param mostrarVazias o bibliotecário vê as categorias sem livro nenhum;
     *                      o público não, porque uma pilha com 0 não tem o que
     *                      oferecer e só polui a fileira
     */
    @Transactional(readOnly = true)
    public ArvoreCategorias arvore(boolean mostrarVazias, FiltroCategoria filtroCat, FiltroAcervo acervo) {
        var areas = categoriaRepository.findAreasOrdenadas();
        var subcategorias = categoriaRepository.findSubcategorias();

        // As contagens são calculadas sempre, para quem vê. mostrarVazias só
        // decide o que ENTRA na resposta — cortar a consulta junto faria o
        // bibliotecário ver total 0 em tudo, que é pior que ver a lista longa.
        Map<Long, Long> totalSub = buscaRepository.totalPorSubcategoria(acervo);
        Map<Long, Long> totalArea = buscaRepository.totalPorArea(acervo);
        FiltroCategoria filtro = filtroCat == null ? FiltroCategoria.vazio() : filtroCat;
        Map<Long, Long> facetaArea = buscaRepository.contagemPorAreaDentroDoFiltro(filtro, acervo);
        Map<Long, Long> facetaSub = buscaRepository.contagemPorCategoriaDentroDoFiltro(filtro, acervo);

        Map<Long, List<CategoriaRepository.SubcategoriaRow>> porArea =
                subcategorias.stream().collect(Collectors.groupingBy(
                        CategoriaRepository.SubcategoriaRow::areaId));

        List<ArvoreCategorias.No> nos = new ArrayList<>();
        for (CategoriaRepository.AreaRow area : areas) {
            List<ArvoreCategorias.Sub> subs = new ArrayList<>();
            for (CategoriaRepository.SubcategoriaRow sc : porArea.getOrDefault(area.id(), List.of())) {
                long total = totalSub.getOrDefault(sc.id(), 0L);
                if (!mostrarVazias && total == 0) continue;
                subs.add(new ArvoreCategorias.Sub(sc.id(), sc.nome(), total,
                        facetaSub.getOrDefault(sc.id(), 0L)));
            }
            long totalDaArea = totalArea.getOrDefault(area.id(), 0L);
            // uma área sem nenhuma subcategoria visível também sai da fileira
            if (!mostrarVazias && subs.isEmpty()) continue;

            subs.sort(Comparator.comparing(ArvoreCategorias.Sub::nome));
            nos.add(new ArvoreCategorias.No(area.id(), area.nome(), area.ordem(),
                    area.cor(), totalDaArea, subs));
        }

        return new ArvoreCategorias(areaNosOrdenados(areas, nos));
    }

    private List<ArvoreCategorias.No> areaNosOrdenados(
            List<CategoriaRepository.AreaRow> areas, List<ArvoreCategorias.No> jaMontados) {
        Map<Long, ArvoreCategorias.No> porId = jaMontados.stream()
                .collect(Collectors.toMap(ArvoreCategorias.No::id, Function.identity()));
        List<ArvoreCategorias.No> ordenados = new ArrayList<>();
        for (CategoriaRepository.AreaRow area : areas) {
            ArvoreCategorias.No no = porId.get(area.id());
            if (no != null) ordenados.add(no);
        }
        return ordenados;
    }

    /** Subcategoria -> ids das subcategorias de sua área, para expandir áreas. */
    @Transactional(readOnly = true)
    public Map<Long, Set<Long>> subcategoriasPorArea() {
        Map<Long, Set<Long>> porArea = new LinkedHashMap<>();
        for (CategoriaRepository.SubcategoriaRow sc : categoriaRepository.findSubcategorias()) {
            porArea.computeIfAbsent(sc.areaId(), k -> new java.util.LinkedHashSet<>()).add(sc.id());
        }
        return porArea;
    }

    /** Os ids de área que existem, para validar o que chega pela URL. */
    @Transactional(readOnly = true)
    public Set<Long> idsDeAreas() {
        return new LinkedHashSet<>(categoriaRepository.findIdsDasAreas());
    }

    /** Os ids de subcategoria que existem, para validar o que chega pela URL. */
    @Transactional(readOnly = true)
    public Set<Long> idsDeSubcategorias() {
        return new LinkedHashSet<>(categoriaRepository.findIdsDasSubcategorias());
    }

    // ═══════════════════════════════════════════════════════════
    // Busca
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public PaginaLivros buscar(FiltroCategoria filtroCat, FiltroAcervo acervo,
                               int pagina, int tamanho) {
        FiltroCategoria filtro = filtroCat == null ? FiltroCategoria.vazio() : filtroCat;
        FiltroAcervo base = acervo == null ? FiltroAcervo.vazio() : acervo;

        int tam = Math.min(Math.max(tamanho, 1), TAMANHO_MAXIMO);
        int pag = Math.max(pagina, 1);

        long totalModo = buscaRepository.contar(filtro, base);
        long totalOutro = buscaRepository.contar(
                filtro.comModo(filtro.ehTodas() ? FiltroCategoria.Modo.QUALQUER
                                                : FiltroCategoria.Modo.TODAS), base);

        long totalQualquer = filtro.ehTodas() ? totalOutro : totalModo;
        long totalTodas    = filtro.ehTodas() ? totalModo   : totalOutro;

        List<Long> ids = buscaRepository.idsDaPagina(filtro, base, pag, tam);
        List<Livro> itens = new ArrayList<>(ids.isEmpty()
                ? List.of()
                : livroRepository.findByIdIn(ids));
        // findAllById não garante ordem; a consulta pediu por título
        Map<Long, Integer> posicao = new LinkedHashMap<>();
        for (int i = 0; i < ids.size(); i++) posicao.put(ids.get(i), i);
        itens.sort(Comparator.comparingInt(l -> posicao.getOrDefault(l.getId(), Integer.MAX_VALUE)));

        PaginaLivros resposta = new PaginaLivros();
        resposta.setItens(itens);
        resposta.setPagina(pag);
        resposta.setTamanho(tam);
        resposta.setTotal(totalModo);
        resposta.setTotalPaginas((int) Math.ceil(totalModo / (double) tam));
        resposta.setTotalNoModo(totalModo);
        resposta.setTotalQualquer(totalQualquer);
        resposta.setTotalTodas(totalTodas);
        resposta.setModo(filtro.getModoTexto());
        // só interessa avisar quando o modo atual é o "todas" e ele zerou
        resposta.setZeroNoModo(totalModo == 0 && totalOutro > 0);
        resposta.setPorSubcategoria(facetasSubcategoria(filtro, base, totalModo));
        resposta.setPorArea(facetasArea(filtro, base, totalModo));
        return resposta;
    }

    /**
     * Quantos livros cada subcategoria traria se fosse marcada agora.
     *
     * No modo "todas" é só a interseção: marcar mais uma coisa só pode reduzir
     * o resultado, nunca aumentar. No "qualquer" é a união do resultado atual
     * com os livros da categoria, e a união tem que descontar a parte que já
     * estava lá: |atual ∪ novos| = |atual| + |novos| − |em comum|.
     */
    private Map<Long, Long> facetasSubcategoria(FiltroCategoria filtro, FiltroAcervo acervo, long total) {
        if (filtro.ehTodas()) {
            return buscaRepository.contagemPorCategoriaDentroDoFiltro(filtro, acervo);
        }
        Map<Long, Long> totalPorCategoria = buscaRepository.contagemPorCategoria(acervo);
        Map<Long, Long> emComum = buscaRepository.contagemPorCategoriaDentroDoFiltro(filtro, acervo);

        Map<Long, Long> facetas = new LinkedHashMap<>();
        for (Map.Entry<Long, Long> e : totalPorCategoria.entrySet()) {
            long novos = e.getValue();
            long sobrepostos = emComum.getOrDefault(e.getKey(), 0L);
            facetas.put(e.getKey(), total + novos - sobrepostos);
        }
        return facetas;
    }

    /** O mesmo raciocínio da faceta de subcategoria, agrupado por área. */
    private Map<Long, Long> facetasArea(FiltroCategoria filtro, FiltroAcervo acervo, long total) {
        Map<Long, Long> porArea = buscaRepository.contagemPorAreaDentroDoFiltro(filtro, acervo);
        if (filtro.ehTodas()) return porArea;

        // No modo "qualquer" marcar uma área é o mesmo que marcar qualquer
        // subcategoria dela, então a faceta da área é a união do resultado atual
        // com os livros que têm alguma subcategoria daquela área. A contagem
        // por área já vem com o filtro aplicado, então basta somar e descontar.
        Map<Long, Long> totais = buscaRepository.totalPorArea(acervo);
        Map<Long, Long> facetas = new LinkedHashMap<>();
        for (Map.Entry<Long, Long> e : totais.entrySet()) {
            long sobrepostos = porArea.getOrDefault(e.getKey(), 0L);
            facetas.put(e.getKey(), total + e.getValue() - sobrepostos);
        }
        return facetas;
    }
}