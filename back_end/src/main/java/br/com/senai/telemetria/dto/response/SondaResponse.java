package br.com.senai.telemetria.dto.response;

import br.com.senai.telemetria.entity.Sonda;

public record SondaResponse(
    Integer id,
    String codigo,
    String nome,
    String status
) {
    public static SondaResponse fromEntity(Sonda sonda) {
        return new SondaResponse(
            sonda.getId(),
            sonda.getCodigo(),
            sonda.getNome(),
            sonda.getStatus()
        );
    }
}