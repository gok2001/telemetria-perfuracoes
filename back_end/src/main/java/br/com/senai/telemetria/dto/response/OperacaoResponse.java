package br.com.senai.telemetria.dto.response;

import br.com.senai.telemetria.entity.Operacao;
import br.com.senai.telemetria.enums.StatusOperacao;

import java.time.Instant;

public record OperacaoResponse(

    Integer id,

    Integer usuarioId,
    String operador,

    Integer sondaId,
    String sonda,

    StatusOperacao status,

    Instant dataHoraInicio,
    Instant dataHoraFim

) {
    public static OperacaoResponse fromEntity(Operacao operacao) {
        return new OperacaoResponse(
            operacao.getId(),

            operacao.getUsuario().getId(),
            operacao.getUsuario().getNome(),
            
            operacao.getSonda().getId(),
            operacao.getSonda().getNome(),

            operacao.getStatus(),
            
            operacao.getDataHoraInicio(),
            operacao.getDataHoraFim()
        );
    }
}
