package br.com.senai.telemetria.repository;

import br.com.senai.telemetria.entity.Operacao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository 
public interface OperacaoRepository extends JpaRepository<Operacao, Integer> {
    boolean existsBySondaIdAndDataHoraFimIsNull(Integer sondaId);

    List<Operacao> findAllByOrderByDataHoraInicioDesc();
}
