package br.com.senai.telemetria.dto.request;

import br.com.senai.telemetria.enums.StatusOperacao;

import jakarta.validation.constraints.NotNull;

public record OperacaoStatusRequest(

    @NotNull(message = "O status é obrigatório") 
    StatusOperacao status
) {
    
}
