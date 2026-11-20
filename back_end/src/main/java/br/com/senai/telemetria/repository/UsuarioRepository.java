package br.com.senai.telemetria.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.senai.telemetria.entity.Usuario;

@Repository 
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    boolean existsByEmail(String email);

    boolean existsByCpf(String cpf);
}
