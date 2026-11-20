
package br.com.senai.telemetria.controller;

import br.com.senai.telemetria.dto.request.SondaRequest;
import br.com.senai.telemetria.dto.response.SondaResponse;
import br.com.senai.telemetria.entity.Sonda;
import br.com.senai.telemetria.service.SondaService;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sondas")
public class SondaController {

    private final SondaService sondaService;

    public SondaController(SondaService sondaService) {
        this.sondaService = sondaService;
    }

    @PostMapping
    public ResponseEntity<SondaResponse> criarSonda(
            @Valid @RequestBody SondaRequest request) {

        Sonda sonda = sondaService.criarSonda(
            request.codigo(),
            request.nome()
        );

        SondaResponse response = SondaResponse.fromEntity(sonda);

        URI location = URI.create("/api/sondas/" + sonda.getId());

        return ResponseEntity
            .created(location)
            .body(response);
    }

    @GetMapping
    public ResponseEntity<List<SondaResponse>> listarSondas() {

        List<SondaResponse> response = sondaService
            .listarSondas()
            .stream()
            .map(SondaResponse::fromEntity)
            .toList();

        return ResponseEntity.ok(response);
    }
}
