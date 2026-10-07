package com.biblioteca.repository;

import com.biblioteca.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Necessário para buscar o usuário pelo email durante o login
    Optional<Usuario> findByEmail(String email);

    // Verificações de unicidade antes de salvar
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
}
