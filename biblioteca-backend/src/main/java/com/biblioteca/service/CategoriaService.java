package com.biblioteca.service;

import com.biblioteca.exception.NegocioException;
import com.biblioteca.model.Categoria;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.util.Contraste;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Regras da árvore de categorias.
 *
 * Antes este serviço só sabia gravar o nome. O resultado eram as 129 categorias
 * órfãs da migração: sem pai, sem cor, sem ordem, e invisíveis para o filtro
 * em pilhas, que só enxerga áreas com cor e subcategorias com pai.
 *
 * A estrutura é fixada pelo CHECK chk_categoria_estrutura, no banco:
 *
 *   AREA         categoriaPai = null, ordemExibicao > 0, cor preenchida
 *   SUBCATEGORIA categoriaPai = a área, ordemExibicao = 0, cor vazia
 *   LEGADA       categoriaPai = null, ordemExibicao = 0, cor vazia
 *
 * O serviço valida isso antes de chegar no banco, para a mensagem de erro
 * chegar em português em vez de vira erro de integridade referencial.
 */
@Service
public class CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    /**
     * Só as categorias em uso: as áreas e as subcategorias.
     *
     * As categorias legadas da migração ficam de fora de propósito. Elas não
     * apontam para livro nenhum e só servem ao rollback, e mostrá-las na tela
     * de administração enche a lista de linhas que não fazem sentido.
     */
    public List<Categoria> listarTodos() {
        return categoriaRepository.findAllReais();
    }

    public Optional<Categoria> buscarPorId(Long id) {
        return categoriaRepository.findById(id);
    }

    /**
     * A próxima ordem livre para uma área nova.
     *
     * Fica no fim da fileira de pilhas, que é a ordem em que a biblioteca
     * naturalmente acrescenta um assunto novo.
     */
    public int proximaOrdem() {
        return categoriaRepository.maiorOrdemDeArea() + 1;
    }

    // ════════════════════════════════════════════════════════════
    // Criar
    // ════════════════════════════════════════════════════════════

    @Transactional
    public Categoria salvar(Categoria categoria) {
        String nome = nomeObrigatorio(categoria.getNome());

        Categoria nova = new Categoria();
        nova.setNome(nome);

        Long paiId = idDoPai(categoria);

        if (paiId == null) {
            // Sem pai, a única coisa que faz sentido é ser uma área — e área
            // exige cor, senão nasce uma órfã invisível.
            nova.setCategoriaPai(null);
            nova.setCor(corObrigatoria(categoria.getCor()));
            nova.setOrdemExibicao(ordemDaArea(categoria.getOrdemExibicao()));

            if (categoriaRepository.existeAreaComNome(nome, null)) {
                throw new NegocioException("Já existe uma área chamada \"" + nome + "\".");
            }
        } else {
            Categoria area = categoriaRepository.findById(paiId)
                    .orElseThrow(() -> new NegocioException(
                            "A área de id " + paiId + " não existe. Cadastre a área antes das subcategorias."));

            if (area.getCategoriaPai() != null) {
                throw new NegocioException(
                        "\"" + area.getNome() + "\" é uma subcategoria, não uma área. "
                        + "Subcategorias não podem ter subcategorias — são dois níveis, e só.");
            }
            if (categoriaRepository.existeSubcategoriaComNome(nome, paiId, null)) {
                throw new NegocioException(
                        "A área \"" + area.getNome() + "\" já tem uma categoria chamada \"" + nome + "\".");
            }

            nova.setCategoriaPai(area);
            // O CHECK exige ordem 0 e cor vazia numa subcategoria. Gravar o que
            // veio do formulário violaria a constraint e o erro chegaria como 500.
            nova.setOrdemExibicao(0);
            nova.setCor(null);
        }

        return categoriaRepository.save(nova);
    }

    // ════════════════════════════════════════════════════════════
    // Editar
    // ════════════════════════════════════════════════════════════

    @Transactional
    public Categoria atualizar(Long id, Categoria dados) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Categoria não encontrada com id: " + id));

        String nome = nomeObrigatorio(dados.getNome());

        if (categoria.ehArea()) {
            atualizarArea(categoria, nome, dados);
        } else {
            atualizarSubcategoria(categoria, nome, dados);
        }

        return categoriaRepository.save(categoria);
    }

    private void atualizarArea(Categoria area, String nome, Categoria dados) {
        // Uma área não pode virar subcategoria por edição: ela tem filhas, e
        // rebaixá-las junto deixaria o acervo inteiro sem área. Quem quiser
        // essa mudança, apaga e recria — e a tela diz isso na mensagem.
        Long paiId = idDoPai(dados);
        if (paiId != null) {
            throw new NegocioException(
                    "\"" + area.getNome() + "\" é uma área e não pode virar subcategoria. "
                    + "Ela tem " + categoriaRepository.contarSubcategoriasDe(area.getId()) + " subcategoria(s) "
                    + "dependendo dela. Para mudar de assunto, crie uma área nova.");
        }

        if (categoriaRepository.existeAreaComNome(nome, area.getId())) {
            throw new NegocioException("Já existe outra área chamada \"" + nome + "\".");
        }
        area.setNome(nome);
        area.setCor(corObrigatoria(dados.getCor()));
        area.setOrdemExibicao(ordemDaArea(dados.getOrdemExibicao()));
    }

    private void atualizarSubcategoria(Categoria sub, String nome, Categoria dados) {
        Long paiId = idDoPai(dados);

        // Sem pai enviado, a subcategoria fica onde está. A tela sempre manda,
        // mas a API não pode depender disso.
        if (paiId != null && !paiId.equals(sub.getCategoriaPai().getId())) {
            Categoria novaArea = categoriaRepository.findById(paiId)
                    .orElseThrow(() -> new NegocioException(
                            "A área de id " + paiId + " não existe."));

            if (novaArea.getCategoriaPai() != null) {
                throw new NegocioException(
                        "\"" + novaArea.getNome() + "\" é uma subcategoria, não uma área.");
            }
            if (categoriaRepository.existeSubcategoriaComNome(nome, paiId, sub.getId())) {
                throw new NegocioException(
                        "A área \"" + novaArea.getNome() + "\" já tem uma categoria chamada \"" + nome + "\".");
            }
            sub.setCategoriaPai(novaArea);
        } else {
            Long atual = sub.getCategoriaPai().getId();
            if (categoriaRepository.existeSubcategoriaComNome(nome, atual, sub.getId())) {
                Categoria area = sub.getCategoriaPai();
                throw new NegocioException(
                        "A área \"" + area.getNome() + "\" já tem uma categoria chamada \"" + nome + "\".");
            }
        }

        sub.setNome(nome);
        sub.setOrdemExibicao(0);
        sub.setCor(null);
    }

    // ════════════════════════════════════════════════════════════
    // Excluir
    // ════════════════════════════════════════════════════════════

    @Transactional
    public void excluir(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Categoria não encontrada com id: " + id));

        if (categoria.ehArea() && categoria.getCor() != null) {
            long filhas = categoriaRepository.contarSubcategoriasDe(id);
            if (filhas > 0) {
                throw new NegocioException(
                        "\"" + categoria.getNome() + "\" tem " + filhas + " subcategoria(s). "
                        + "Apague ou mova as subcategorias antes de apagar a área.");
            }
        }

        long livros = categoriaRepository.contarLivrosDe(id);
        if (livros > 0) {
            throw new NegocioException(
                    "\"" + categoria.getNome() + "\" está em " + livros + " livro(s). "
                    + "Tirar a categoria esvaziaria esses livros de classificação.");
        }

        categoriaRepository.delete(categoria);
    }

    // ════════════════════════════════════════════════════════════
    // Validações de campo
    // ════════════════════════════════════════════════════════════

    private String nomeObrigatorio(String nome) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new NegocioException("A categoria precisa de um nome.");
        }
        String limpo = nome.trim();
        if (limpo.length() > 100) {
            throw new NegocioException("O nome da categoria é longo demais (máximo 100 caracteres).");
        }
        return limpo;
    }

    /** O id do pai, ou null se a categoria é uma área. */
    private Long idDoPai(Categoria categoria) {
        Categoria pai = categoria.getCategoriaPai();
        return pai == null ? null : pai.getId();
    }

    /**
     * A cor da área, validada no formato e no contraste.
     *
     * O contraste é a parte que importa: a cor da área fica atrás do branco da
     * lombada e do rótulo da capa. Uma cor clara passaria no teste de formato
     * e deixaria esse branco ilegível na tela.
     */
    private String corObrigatoria(String cor) {
        if (cor == null || cor.trim().isEmpty()) {
            throw new NegocioException(
                    "Escolha uma cor para a área. É ela que pinta a lombada dos livros dela.");
        }
        String normalizada = Contraste.normalizar(cor);
        if (normalizada == null) {
            throw new NegocioException(
                    "A cor \"" + cor + "\" não é válida. Use o formato #RRGGBB, "
                    + "como #8C2B2B.");
        }
        if (!Contraste.passaConBranco(normalizada)) {
            double razao = Contraste.contraBranco(normalizada);
            throw new NegocioException(
                    String.format(
                        "A cor %s tem contraste %.1f:1 com o branco, e o mínimo é %.1f:1. "
                        + "O branco da lombada sumiria. Escolha uma cor mais escura.",
                        normalizada, razao, Contraste.MINIMO));
        }
        return normalizada;
    }

    /**
     * A ordem da área.
     *
     * O CHECK exige maior que zero, e zero é o valor que distingue uma área de
     * uma categoria legada. Sem esta correção, uma área criada com ordem 0
     * seria aceita pelo formulário e rejeitada pelo banco.
     */
    private int ordemDaArea(Integer ordem) {
        return (ordem == null || ordem < 1) ? proximaOrdem() : ordem;
    }
}