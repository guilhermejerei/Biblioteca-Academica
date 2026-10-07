package com.biblioteca.repository;

import com.biblioteca.model.Autor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// JpaRepository já fornece os métodos básicos: save, findById, findAll, deleteById, etc.
@Repository
public interface AutorRepository extends JpaRepository<Autor, Long> {
}
