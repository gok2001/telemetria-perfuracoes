package br.com.senai.telemetria.service;

import br.com.senai.telemetria.entity.Sonda;
import br.com.senai.telemetria.repository.SondaRepository;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class SondaServiceIntegrationTest {

    @Autowired
    private SondaService sondaService;

    @Autowired
    private SondaRepository sondaRepository;

    @Test
    void deveCriarSondaEPersistirNoBanco() {

        String codigo = "SONDA-TESTE-INTEGRACAO";

        Sonda sonda = sondaService.criarSonda(
            codigo,
            "Sonda de Teste"
        );

        assertNotNull(sonda.getId());
        assertEquals(codigo, sonda.getCodigo());
        assertEquals("Sonda de Teste", sonda.getNome());
        assertEquals("disponivel", sonda.getStatus());

        Sonda sondaSalva = sondaRepository
            .findById(sonda.getId())
            .orElseThrow();

        assertEquals(codigo, sondaSalva.getCodigo());
        assertEquals("Sonda de Teste", sondaSalva.getNome());
    }

    @Test
    void deveListarSondaPersistida() {

        Sonda sonda = sondaService.criarSonda(
            "SONDA-LISTAGEM-INTEGRACAO",
            "Sonda de Listagem"
        );

        List<Sonda> sondas = sondaService.listarSondas();

        assertTrue(
            sondas.stream().anyMatch(
                item -> item.getId().equals(sonda.getId())
            )
        );
    }
}
