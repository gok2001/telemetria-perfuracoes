package br.com.senai.telemetria.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.senai.telemetria.dto.request.UsuarioRequest;
import br.com.senai.telemetria.dto.request.UsuarioStatusRequest;
import br.com.senai.telemetria.dto.response.UsuarioResponse;
import br.com.senai.telemetria.service.UsuarioService;
import jakarta.validation.Valid;

@RestController 
@RequestMapping("/api/usuarios") 
public class UsuarioController {
    
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping 
    public ResponseEntity<UsuarioResponse> cadastrar(@Valid @RequestBody UsuarioRequest request) {
        var usuario = usuarioService.cadastrar(request);

        return ResponseEntity
            .created(URI.create("/api/usuarios/" + usuario.getId()))
            .body(UsuarioResponse.fromEntity(usuario));
    }

    @GetMapping 
    public ResponseEntity<List<UsuarioResponse>> listar() {
        var usuarios = usuarioService.listar().stream().map(UsuarioResponse::fromEntity).toList();

        return ResponseEntity.ok(usuarios);
    }

    @PatchMapping("/{id}/status") 
    public ResponseEntity<UsuarioResponse> alterarStatus(
        @PathVariable Integer id,
        @Valid @RequestBody UsuarioStatusRequest request
    ) {
        var usuario = usuarioService.alterarStatus(id, request.status());

        return ResponseEntity.ok(UsuarioResponse.fromEntity(usuario));
    }
}
