package br.com.senai.telemetria.exception;

import java.time.Instant;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

public class GlobalExceptionHandler {
    
    private Map<String, Object> resposta(
        int status,
        String mensagem,
        String cmainho
    ) {
        return Map.of(
            "timestamp", Instant.now().toString(),
            "status", status,
            "message", mensagem,
            "path", cmainho
        );
    }

    @ExceptionHandler(ResponseStatusException.class) 
    public ResponseEntity<Map<String, Object>> tratarStatus(
        ResponseStatusException ex,
        HttpServletRequest request
    ) {
        int status = ex.getStatusCode().value();

        String mensagem = ex.getReason() != null
            ? ex.getReason()
            : "Não foi possível processar a requisição";
        
        return ResponseEntity.status(status).body(resposta(status, mensagem, request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class) 
    public ResponseEntity<Map<String, Object>> tratarValidacao(
        MethodArgumentNotValidException ex,
        HttpServletRequest request
    ) {
        String mensagem = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .findFirst()
            .map(erro -> erro.getDefaultMessage())
            .orElse("Dados inválidos");

        return ResponseEntity.badRequest().body(resposta(400, mensagem, request.getRequestURI()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class) 
    public ResponseEntity<Map<String, Object>> tratarJson(
        HttpMessageNotReadableException ex,
        HttpServletRequest request
    ) {
        return ResponseEntity.badRequest().body(resposta(400, "JSON inválido ou valor não permitido", request.getRequestURI()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class) 
    public ResponseEntity<Map<String, Object>> tratarIntegridade(
        DataIntegrityViolationException ex,
        HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(resposta(
            409,
            "Os dados informados violam uma restrição do banco",
            request.getRequestURI()
        ));
    }
}
