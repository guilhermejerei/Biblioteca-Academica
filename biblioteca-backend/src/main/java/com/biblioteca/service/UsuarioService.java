package com.biblioteca.service;

import com.biblioteca.dto.UsuarioDTO;
import com.biblioteca.dto.UsuarioParaEmprestimo;
import com.biblioteca.model.Usuario;
import com.biblioteca.model.Usuario.TipoUsuario;
import com.biblioteca.repository.EmprestimoRepository;
import com.biblioteca.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmprestimoRepository emprestimoRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // Converte entidade Usuario para DTO seguro (sem senha)
    private UsuarioDTO toDTO(Usuario u) {
        return new UsuarioDTO(
                u.getId(), u.getNome(), u.getCpf(),
                u.getEmail(), u.getTelefone(),
                u.getTipo() != null ? u.getTipo().name() : null
        );
    }

    public List<UsuarioDTO> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Quem pode levar livro, no formato enxuto da tela de empr��stimo.
     *
     * S�� o nome e o que a pessoa j�� tem em aberto. CPF n��o entra: o
     * bibliotec��rio tem o cart��o na m��o e escolhe pelo nome, e uma lista de
     * onze d��gitos ao lado de cada um s�� rouba largura e obriga a ler n��mero
     * para achar o nome.
     */
    @Transactional(readOnly = true)
    public List<UsuarioParaEmprestimo> listarParaEmprestimo() {
        // Duas consultas, e o cruzamento é feito aqui. Filtrar a coleção de
        // empréstimos direto no WHERE do fetch tentado antes e um erro
        // silencioso: num LEFT JOIN FETCH a condição "status IN (ATIVO,
        // ATRASADO)" descarta a PESSOA inteira quando todos os empréstimos
        // dela já foram devolvidos, em vez de devolver a pessoa com a lista
        // vazia. Aluno que devolveu tudo sumia do balcão.
        Map<Long, List<UsuarioParaEmprestimo.EmprestoAberto>> abertosPorUsuario =
                emprestimoRepository.listarAbertosComLivro().stream()
                        .filter(e -> e.getUsuario() != null)
                        .collect(Collectors.groupingBy(
                                e -> e.getUsuario().getId(),
                                Collectors.mapping(
                                        e -> new UsuarioParaEmprestimo.EmprestoAberto(
                                                e.getId(),
                                                e.getLivro() != null ? e.getLivro().getTitulo() : "(sem título)",
                                                e.getStatus() != null ? e.getStatus().name() : null),
                                        Collectors.toList())));

        return usuarioRepository.listarAlunos().stream()
                .map(u -> new UsuarioParaEmprestimo(
                        u.getId(), u.getNome(),
                        abertosPorUsuario.getOrDefault(u.getId(), List.of())))
                .collect(Collectors.toList());
    }

    public Optional<UsuarioDTO> buscarPorId(Long id) {
        return usuarioRepository.findById(id).map(this::toDTO);
    }

    public UsuarioDTO salvar(Usuario usuario) {
        // Hash da senha antes de salvar
        if (usuario.getSenha() != null && !usuario.getSenha().startsWith("$2a$")) {
            usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        }
        if (usuario.getTipo() == null) {
            usuario.setTipo(TipoUsuario.ALUNO);
        }
        return toDTO(usuarioRepository.save(usuario));
    }

    public UsuarioDTO atualizar(Long id, Usuario usuarioAtualizado) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com id: " + id));

        usuario.setNome(usuarioAtualizado.getNome());
        usuario.setCpf(usuarioAtualizado.getCpf());
        usuario.setEmail(usuarioAtualizado.getEmail());
        usuario.setTelefone(usuarioAtualizado.getTelefone());

        // Atualiza a senha apenas se uma nova for fornecida
        if (usuarioAtualizado.getSenha() != null && !usuarioAtualizado.getSenha().isBlank()) {
            usuario.setSenha(passwordEncoder.encode(usuarioAtualizado.getSenha()));
        }

        // Atualiza o tipo se informado
        if (usuarioAtualizado.getTipo() != null) {
            usuario.setTipo(usuarioAtualizado.getTipo());
        }

        return toDTO(usuarioRepository.save(usuario));
    }

    public void excluir(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new RuntimeException("Usuário não encontrado com id: " + id);
        }
        usuarioRepository.deleteById(id);
    }
}
