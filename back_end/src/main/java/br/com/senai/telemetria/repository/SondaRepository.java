package br.com.senai.telemetria.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.senai.telemetria.entity.Sonda;

@Repository 
public interface SondaRepository extends JpaRepository<Sonda, Integer> {
    boolean existsByCodigo(String Codigo);
}
