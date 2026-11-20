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

import br.com.senai.telemetria.dto.request.OperacaoRequest;
import br.com.senai.telemetria.dto.request.OperacaoStatusRequest;
import br.com.senai.telemetria.dto.response.OperacaoResponse;
import br.com.senai.telemetria.service.OperacaoService;
import jakarta.validation.Valid;

@RestController 
@RequestMapping("/api/operacoes") 
public class OperacaoController {
    
    private final OperacaoService operacaoService;

    public OperacaoController(OperacaoService operacaoService) {
        this.operacaoService = operacaoService;
    }

    @PostMapping 
    public ResponseEntity<OperacaoResponse> registrar(@Valid @RequestBody OperacaoRequest request) {
        OperacaoResponse response = operacaoService.registrar(request);

        URI location = URI.create("/api/operacoes/" + response.id());

        return ResponseEntity.created(location).body(response);
    }

    @GetMapping 
    public ResponseEntity<List<OperacaoResponse>> listar() {
        return ResponseEntity.ok(operacaoService.listar());
    }

    @GetMapping("/{id}") 
    public ResponseEntity<OperacaoResponse> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(operacaoService.buscarPorId(id));
    }

    @PatchMapping("/{id}/status") 
    public ResponseEntity<OperacaoResponse> alterarStatus(
        @PathVariable Integer id,
        @Valid @RequestBody OperacaoStatusRequest request
    ) {
        return ResponseEntity.ok(operacaoService.alterarStatus(id, request.status()));
    }
}
