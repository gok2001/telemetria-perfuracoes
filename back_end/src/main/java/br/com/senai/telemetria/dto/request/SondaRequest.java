package br.com.senai.telemetria.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SondaRequest(

    @NotBlank(message = "O código é obrigatório")
    @Size(max = 50, message = "O código deve ter até 50 caracteres")
    String codigo,

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 150, message = "O nome deve ter até 150 caracteres")
    String nome

) {}