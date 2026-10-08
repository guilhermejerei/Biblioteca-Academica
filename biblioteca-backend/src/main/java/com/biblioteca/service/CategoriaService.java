package com.biblioteca.service;

import com.biblioteca.model.Categoria;
import com.biblioteca.repository.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    /**
     * Só as categorias em uso: as áreas e as subcategorias.
     *
     * As 129 categorias que sobraram da migração ficam de fora de propósito.
     * Elas não apontam para livro nenhum e só servem ao rollback, e mostrá-las
     * na tela de administração enche a lista de linhas que não fazem sentido.
     */
    public List<Categoria> listarTodos() {
        return categoriaRepository.findAllReais();
    }

    public Optional<Categoria> buscarPorId(Long id) {
        return categoriaRepository.findById(id);
    }

    public Categoria salvar(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    public Categoria atualizar(Long id, Categoria categoriaAtualizada) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada com id: " + id));

        categoria.setNome(categoriaAtualizada.getNome());

        return categoriaRepository.save(categoria);
    }

    public void excluir(Long id) {
        if (!categoriaRepository.existsById(id)) {
            throw new RuntimeException("Categoria não encontrada com id: " + id);
        }
        categoriaRepository.deleteById(id);
    }
}
