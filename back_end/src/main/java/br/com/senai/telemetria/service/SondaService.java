package br.com.senai.telemetria.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.senai.telemetria.entity.Sonda;
import br.com.senai.telemetria.repository.SondaRepository;

@Service 
public class SondaService {
    private final SondaRepository sondaRepository;

    public SondaService(SondaRepository sondaRepository) {
        this.sondaRepository = sondaRepository;
    }

    @Transactional 
    public Sonda criarSonda(String codigo, String nome) {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("O código é obrigatório");
        }

        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("O nome é obrigatório");
        }

        codigo = codigo.trim();
        nome = nome.trim();

        if (sondaRepository.existsByCodigo(codigo)) {
            throw new IllegalArgumentException("Já existe uma sonda com esse código");
        }

        Sonda sonda = new Sonda();

        sonda.setCodigo(codigo);
        sonda.setNome(nome);
        sonda.setStatus("disponivel");

        return sondaRepository.save(sonda);
    }
}
