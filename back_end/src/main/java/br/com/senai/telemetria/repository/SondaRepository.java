package br.com.senai.telemetria.repository;

import br.com.senai.telemetria.entity.Sonda;

import jakarta.persistence.LockModeType;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository 
public interface SondaRepository extends JpaRepository<Sonda, Integer> {
    boolean existsByCodigo(String codigo);

    @Lock(LockModeType.PESSIMISTIC_WRITE) 
    @Query("SELECT s FROM Sonda s WHERE s.id = :id") 
    Optional<Sonda> buscarPorIdComBloqueio(@Param("id") Integer id);
}
