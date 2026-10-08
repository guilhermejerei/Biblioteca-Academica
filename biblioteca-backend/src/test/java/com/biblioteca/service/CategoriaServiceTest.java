package com.biblioteca.service;

import com.biblioteca.exception.NegocioException;
import com.biblioteca.model.Categoria;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.util.Contraste;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regras da árvore de categorias.
 *
 * O que se testa aqui é o defeito que motivou a mudança: a tela criava
 * categoria só com o nome, e a API aceitava. O resultado era uma categoria
 * órfã — sem pai, sem cor, sem ordem — que não aparecia em lugar nenhum do
 * acervo. Nenhum teste pegaria isso olhando só o código do CRUD: é preciso
 * conferir que o estado gravado é um dos três que o banco aceita.
 */
@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    @Mock private CategoriaRepository categoriaRepository;
    @InjectMocks private CategoriaService service;

    private static Categoria area(Long id, String nome) {
        Categoria c = new Categoria();
        c.setId(id);
        c.setNome(nome);
        c.setCor("#8C2B2B");
        c.setOrdemExibicao(1);
        return c;                       // categoriaPai nulo = área
    }

    private static Categoria sub(Long id, String nome, Categoria pai) {
        Categoria c = new Categoria();
        c.setId(id);
        c.setNome(nome);
        c.setCategoriaPai(pai);
        return c;                       // ordem 0 e cor nula = subcategoria
    }

    private static Categoria entrada(String nome) {
        Categoria c = new Categoria();
        c.setNome(nome);
        return c;
    }

    /**
     * Um pai precisa existir no repositório, não só no objeto.
     *
     * O serviço relê a área pelo id antes de aceitar a subcategoria, para não
     * confiar no objeto que veio no corpo da requisição. Todo teste que cria
     * subcategoria precisa deste stub — sem ele o repositório devolve vazio e
     * o teste falha pelo motivo errado, de "área não existe".
     */
    private void areaExiste(Categoria a) {
        when(categoriaRepository.findById(a.getId())).thenReturn(Optional.of(a));
    }

    // ════════════════════════════════════════════════════════════
    // Criar
    // ════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Criar área")
    class CriarArea {

        @Test
        @DisplayName("sem categoriaPai nasce uma ÁREA, com cor e ordem")
        void criaAreaComPaiNulo() {
            Categoria entrada = entrada("Direito");
            entrada.setCor("#5A3D8C");
            when(categoriaRepository.maiorOrdemDeArea()).thenReturn(10);
            when(categoriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            Categoria salva = service.salvar(entrada);

            assertThat(salva.getCategoriaPai()).isNull();
            assertThat(salva.getCor()).isEqualTo("#5A3D8C");
            // ordem vem da última da fileira, que é onde assunto novo entra
            assertThat(salva.getOrdemExibicao()).isEqualTo(11);
        }

        @Test
        @DisplayName("sem cor é recusado — era assim que nascia a órfã")
        void recusaAreaSemCor() {
            assertThatThrownBy(() -> service.salvar(entrada("Sem cor")))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("cor");

            verify(categoriaRepository, never()).save(any());
        }

        @Test
        @DisplayName("nome repetido é recusado, sem diferenciar maiúsculas")
        void recusaNomeDuplicado() {
            // O serviço repassa o nome como está; quem insensibiliza é o LOWER
            // na consulta. O stub precisa casar com o que o serviço passou,
            // não com a grafia que o teste usou para escrever.
            when(categoriaRepository.existeAreaComNome("literatura", null)).thenReturn(true);

            assertThatThrownBy(() -> {
                Categoria c = entrada("literatura");
                c.setCor("#8C2B2B");
                service.salvar(c);
            })
                    .isInstanceOf(NegocioException.class)
                    // A mensagem devolve o nome como o usuário digitou
                    .hasMessageContaining("literatura");

            verify(categoriaRepository, never()).save(any());
        }

        @Test
        @DisplayName("ordem zero vira a próxima — o CHECK exige maior que zero")
        void corrigeOrdemZero() {
            Categoria entrada = entrada("Nova");
            entrada.setCor("#8C2B2B");
            entrada.setOrdemExibicao(0);
            when(categoriaRepository.maiorOrdemDeArea()).thenReturn(4);
            when(categoriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            assertThat(service.salvar(entrada).getOrdemExibicao()).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("Criar subcategoria")
    class CriarSubcategoria {

        @Test
        @DisplayName("com categoriaPai nasce ligada à área, ordem 0 e cor nula")
        void criaSubcategoriaLigada() {
            Categoria pai = area(130L, "Literatura");
            areaExiste(pai);

            Categoria entrada = entrada("Ficção Científica");
            entrada.setCategoriaPai(pai);

            when(categoriaRepository.existeSubcategoriaComNome(anyString(), anyLong(), any()))
                    .thenReturn(false);
            when(categoriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            Categoria salva = service.salvar(entrada);

            assertThat(salva.getCategoriaPai().getId()).isEqualTo(130L);
            // o CHECK chk_categoria_estrutura exige exatamente estes dois valores
            assertThat(salva.getOrdemExibicao()).isZero();
            assertThat(salva.getCor()).isNull();
        }

        @Test
        @DisplayName("mesmo nome na MESMA área é recusado")
        void recusaDuplicataNaMesmaArea() {
            Categoria pai = area(130L, "Literatura");
            areaExiste(pai);

            Categoria entrada = entrada("Ficção Científica");
            entrada.setCategoriaPai(pai);

            when(categoriaRepository.existeSubcategoriaComNome(anyString(), anyLong(), any()))
                    .thenReturn(true);

            assertThatThrownBy(() -> service.salvar(entrada))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("Literatura");

            verify(categoriaRepository, never()).save(any());
        }

        @Test
        @DisplayName("mesmo nome em área diferente é aceito")
        void aceitaMesmoNomeEmAreasDiferentes() {
            // Uma categoria como "História" faz sentido em História e Sociedade
            // e em Ciências. A unicidade é por área, não global.
            Categoria pai = area(130L, "Literatura");
            areaExiste(pai);

            Categoria entrada = entrada("História");
            entrada.setCategoriaPai(pai);

            when(categoriaRepository.existeSubcategoriaComNome(anyString(), anyLong(), any()))
                    .thenReturn(false);
            when(categoriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            assertThat(service.salvar(entrada).getNome()).isEqualTo("História");
        }

        @Test
        @DisplayName("pai que é subcategoria cria um terceiro nível — recusado")
        void recusaTerceiroNivel() {
            Categoria subPai = sub(192L, "Fantasia", area(130L, "Literatura"));
            Categoria entrada = entrada("Fantasias Urbanas");
            entrada.setCategoriaPai(subPai);

            when(categoriaRepository.findById(192L)).thenReturn(Optional.of(subPai));

            assertThatThrownBy(() -> service.salvar(entrada))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("dois níveis");

            verify(categoriaRepository, never()).save(any());
        }

        @Test
        @DisplayName("pai inexistente é recusado com o id na mensagem")
        void recusaPaiInexistente() {
            Categoria entrada = entrada("Órfã");
            entrada.setCategoriaPai(area(9999L, "Não existe"));

            when(categoriaRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.salvar(entrada))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("9999");
        }

        @Test
        @DisplayName("cor e ordem enviadas são descartadas numa subcategoria")
        void ignoraCorNaSubcategoria() {
            // A tela antiga mandava a categoria inteira, com o que o formulário
            // tivesse. Gravar isso violaria o CHECK e o erro viraria 500.
            Categoria pai = area(130L, "Literatura");
            areaExiste(pai);

            Categoria entrada = entrada("Com Extras");
            entrada.setCategoriaPai(pai);
            entrada.setCor("#FF0000");
            entrada.setOrdemExibicao(7);

            when(categoriaRepository.existeSubcategoriaComNome(anyString(), anyLong(), any()))
                    .thenReturn(false);
            when(categoriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            Categoria salva = service.salvar(entrada);

            assertThat(salva.getCor()).isNull();
            assertThat(salva.getOrdemExibicao()).isZero();
        }
    }

    // ════════════════════════════════════════════════════════════
    // Editar
    // ════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Editar")
    class Editar {

        @Test
        @DisplayName("mover subcategoria de área realmente muda o pai")
        void moveSubcategoriaDeArea() {
            // Este era o defeito: o PUT aceitava o pai novo e devolvia 200,
            // mas a subcategoria continuava na área antiga.
            Categoria sub = sub(192L, "História", area(130L, "Literatura"));
            when(categoriaRepository.findById(192L)).thenReturn(Optional.of(sub));

            Categoria novaArea = area(132L, "Ciências");
            when(categoriaRepository.findById(132L)).thenReturn(Optional.of(novaArea));
            when(categoriaRepository.existeSubcategoriaComNome(anyString(), anyLong(), any()))
                    .thenReturn(false);
            when(categoriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            Categoria dados = entrada("História");
            dados.setCategoriaPai(novaArea);

            Categoria salva = service.atualizar(192L, dados);

            assertThat(salva.getCategoriaPai().getId()).isEqualTo(132L);
        }

        @Test
        @DisplayName("área não pode ser rebaixada a subcategoria")
        void recusaRebaixarArea() {
            // Rebaixar deixaria as filhas órfãs, e o acervo inteiro daquela
            // área sem classificação.
            when(categoriaRepository.findById(130L))
                    .thenReturn(Optional.of(area(130L, "Literatura")));
            when(categoriaRepository.contarSubcategoriasDe(130L)).thenReturn(9L);

            Categoria dados = entrada("Literatura");
            dados.setCor("#8C2B2B");
            dados.setCategoriaPai(area(132L, "Ciências"));

            assertThatThrownBy(() -> service.atualizar(130L, dados))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("9 subcategoria");

            verify(categoriaRepository, never()).save(any());
        }

        @Test
        @DisplayName("trocar a cor e a ordem de uma área funciona")
        void trocaCorEOrdemDaArea() {
            Categoria alvo = area(130L, "Literatura");
            when(categoriaRepository.findById(130L)).thenReturn(Optional.of(alvo));
            when(categoriaRepository.existeAreaComNome(anyString(), anyLong())).thenReturn(false);
            when(categoriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            Categoria dados = entrada("Literatura");
            dados.setCor("#3f7a3f");
            dados.setOrdemExibicao(3);

            Categoria salva = service.atualizar(130L, dados);

            assertThat(salva.getCor()).isEqualTo("#3F7A3F");   // normalizada
            assertThat(salva.getOrdemExibicao()).isEqualTo(3);
        }

        @Test
        @DisplayName("renomear sem mudar o nome não acusa duplicidade")
        void renomearParaOMesmoNome() {
            // O id precisa ser ignorado na checagem: senão editar sem mudar o
            // nome diz que a categoria conflita consigo mesma.
            Categoria alvo = area(130L, "Literatura");
            when(categoriaRepository.findById(130L)).thenReturn(Optional.of(alvo));
            when(categoriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            Categoria dados = entrada("Literatura");
            dados.setCor("#8C2B2B");

            Categoria salva = service.atualizar(130L, dados);

            ArgumentCaptor<Long> idIgnorado = ArgumentCaptor.forClass(Long.class);
            verify(categoriaRepository).existeAreaComNome(
                    org.mockito.ArgumentMatchers.eq("Literatura"), idIgnorado.capture());

            // O id da própria categoria é repassado para ser ignorado
            assertThat(idIgnorado.getValue()).isEqualTo(130L);
            assertThat(salva.getNome()).isEqualTo("Literatura");
        }

        @Test
        @DisplayName("categoria inexistente na edição")
        void recusaIdInexistente() {
            when(categoriaRepository.findById(9999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.atualizar(9999L, entrada("Qualquer")))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("9999");
        }
    }

    // ════════════════════════════════════════════════════════════
    // Excluir
    // ════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Excluir")
    class Excluir {

        @Test
        @DisplayName("área com subcategorias é recusada, dizendo quantas")
        void recusaAreaComFilhas() {
            // Antes isso batia na chave estrangeira e a tela recebia 404 mudo.
            when(categoriaRepository.findById(130L))
                    .thenReturn(Optional.of(area(130L, "Literatura")));
            when(categoriaRepository.contarSubcategoriasDe(130L)).thenReturn(9L);

            assertThatThrownBy(() -> service.excluir(130L))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("9 subcategoria");

            verify(categoriaRepository, never()).delete(any());
        }

        @Test
        @DisplayName("categoria em uso por livro é recusada, dizendo quantos")
        void recusaCategoriaEmUso() {
            when(categoriaRepository.findById(140L))
                    .thenReturn(Optional.of(sub(140L, "Aventura e Distopia", area(130L, "Literatura"))));
            when(categoriaRepository.contarLivrosDe(140L)).thenReturn(3L);

            assertThatThrownBy(() -> service.excluir(140L))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("3 livro");

            verify(categoriaRepository, never()).delete(any());
        }

        @Test
        @DisplayName("categoria sem uso é apagada")
        void apagaCategoriaLivre() {
            Categoria alvo = sub(199L, "Sem uso", area(130L, "Literatura"));
            when(categoriaRepository.findById(199L)).thenReturn(Optional.of(alvo));
            when(categoriaRepository.contarLivrosDe(199L)).thenReturn(0L);

            service.excluir(199L);

            verify(categoriaRepository).delete(alvo);
        }
    }

    // ════════════════════════════════════════════════════════════
    // Validações de campo
    // ════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Campos")
    class Campos {

        @Test
        @DisplayName("nome vazio é recusado")
        void recusaNomeVazio() {
            assertThatThrownBy(() -> service.salvar(entrada("   ")))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("nome");
        }

        @Test
        @DisplayName("cor fora do formato é recusada")
        void recusaCorForaDoFormato() {
            Categoria c = entrada("Com cor inválida");
            c.setCor("azul");

            assertThatThrownBy(() -> service.salvar(c))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("#RRGGBB");
        }

        @Test
        @DisplayName("cor clara demais é recusada com a razão do contraste")
        void recusaCorClara() {
            Categoria c = entrada("Clara");
            c.setCor("#F0E0D0");

            assertThatThrownBy(() -> service.salvar(c))
                    .isInstanceOf(NegocioException.class)
                    .hasMessageContaining("contraste");
        }
    }
}