package br.com.senai.telemetria.dto.request;

import br.com.senai.telemetria.enums.StatusUsuario;

import jakarta.validation.constraints.NotNull;

public record UsuarioStatusRequest(
    @NotNull(message = "O status é obrigatório") 
    StatusUsuario status
) {
    
}
