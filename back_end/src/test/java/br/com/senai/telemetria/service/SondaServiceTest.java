package br.com.senai.telemetria.service;

import br.com.senai.telemetria.entity.Sonda;
import br.com.senai.telemetria.repository.SondaRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SondaServiceTest {
    private SondaRepository sondaRepository;
    private SondaService sondaService;

    @BeforeEach 
    void prepararTeste() {
        sondaRepository = mock(SondaRepository.class);
        sondaService = new SondaService(sondaRepository);
    }

    @Test
    void deveCriarSondaComDadosValidos() {

        Sonda sondaSalva = new Sonda();
        sondaSalva.setCodigo("SONDA-001");
        sondaSalva.setNome("Sonda Principal");
        sondaSalva.setStatus("disponivel");

        when(sondaRepository.save(any(Sonda.class))).thenReturn(sondaSalva);

        Sonda resultado = sondaService.criarSonda("SONDA-001", "Sonda Principal");

        assertEquals("SONDA-001", resultado.getCodigo());
        assertEquals("Sonda Principal", resultado.getNome());
        assertEquals("disponivel", resultado.getStatus());

        verify(sondaRepository).save(any(Sonda.class));
    }

    @Test 
    void naoDeveCriarSondaSemNome() {

        assertThrows(IllegalArgumentException.class, () -> sondaService.criarSonda("SONDA-001", ""));

        verify(sondaRepository, never()).save(any(Sonda.class));
    }

    @Test 
    void naoDeveCriarSondaComCodigoDuplicado() {

        when(sondaRepository.existsByCodigo("SONDA-001")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> sondaService.criarSonda("SONDA-001", "Sonda Principal"));

        verify(sondaRepository, never()).save(any(Sonda.class));
    }

    @Test 
    void deveListarSondas() {

        Sonda sonda = new Sonda();
        sonda.setCodigo("SONDA-001");

        when(sondaRepository.findAll()).thenReturn(List.of(sonda));

        List<Sonda> resultado = sondaService.listarSondas();

        assertEquals(1, resultado.size());
        assertEquals("SONDA-001", resultado.get(0).getCodigo());
    }
}
