package br.com.senai.telemetria.dto.request;

import br.com.senai.telemetria.enums.Cargo;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(

    @NotBlank(message = "O nome é obrigatório") 
    @Size(max = 150) 
    String nome,

    @NotBlank(message = "O email é obrigatório") 
    @Email(message = "Email inválido") 
    @Size(max = 150) 
    String email,

    @NotBlank(message = "O CPF é obrigatório") 
    @Pattern(
        regexp = "\\d{11}",
        message = "O CPF deve conter 11 números"
    ) 
    String cpf,

    @NotBlank(message = "A senha é obrigatória") 
    @Size(
        min = 8,
        message = "A senha deve ter pelo menos 8 caracteres"
    ) 
    String senha,

    @NotNull(message = "O cargo é obrigatório") 
    Cargo cargo
) {
    
}
