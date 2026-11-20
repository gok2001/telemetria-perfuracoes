package br.com.senai.telemetria.dto.request;

import br.com.senai.telemetria.enums.StatusOperacao;

import jakarta.validation.constraints.NotNull;

public record OperacaoRequest(

    @NotNull(message = "O operador é obrigatório") 
    Integer usuarioId,

    @NotNull(message = "A sonda é obrigatória") 
    Integer sondaId,
    
    @NotNull(message = "O status é obrigatório") 
    StatusOperacao status
) {
    
}
