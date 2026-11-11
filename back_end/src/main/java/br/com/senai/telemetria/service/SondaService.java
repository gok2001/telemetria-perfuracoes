package br.com.senai.telemetria.service;

import org.springframework.stereotype.Service;

import br.com.senai.telemetria.entity.Sonda;
import br.com.senai.telemetria.repository.SondaRepository;
import jakarta.transaction.Transactional;

@Service 
public class SondaService {
    private final SondaRepository sondaRepository;

    public SondaService(SondaRepository sondaRepository) {
        this.sondaRepository = sondaRepository;
    }

    @Transactional 
    public Sonda criarSonda(Sonda sonda) {
        return sondaRepository.save(sonda);
    }
}
