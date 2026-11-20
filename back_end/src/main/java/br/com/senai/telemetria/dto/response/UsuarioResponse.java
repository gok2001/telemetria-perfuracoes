package br.com.senai.telemetria.dto.response;

import br.com.senai.telemetria.entity.Usuario;
import br.com.senai.telemetria.enums.Cargo;
import br.com.senai.telemetria.enums.StatusUsuario;

public record UsuarioResponse(
    Integer id,
    String nome,
    String email,
    String cpf,
    Cargo cargo,
    StatusUsuario status
) {
    public static UsuarioResponse fromEntity(
        Usuario usuario
    ) {
        return new UsuarioResponse(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getCpf(),
            usuario.getCargo(),
            usuario.getStatus()
        );
    }
}
