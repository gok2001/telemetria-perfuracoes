package br.com.senai.telemetria.service;

import br.com.senai.telemetria.dto.request.OperacaoRequest;
import br.com.senai.telemetria.dto.response.OperacaoResponse;
import br.com.senai.telemetria.entity.Operacao;
import br.com.senai.telemetria.entity.Sonda;
import br.com.senai.telemetria.entity.Usuario;
import br.com.senai.telemetria.enums.Cargo;
import br.com.senai.telemetria.enums.StatusOperacao;
import br.com.senai.telemetria.enums.StatusUsuario;
import br.com.senai.telemetria.repository.OperacaoRepository;
import br.com.senai.telemetria.repository.SondaRepository;
import br.com.senai.telemetria.repository.UsuarioRepository;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service 
public class OperacaoService {
    
    private final OperacaoRepository operacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final SondaRepository sondaRepository;

    public OperacaoService(
        OperacaoRepository operacaoRepository,
        UsuarioRepository usuarioRepository,
        SondaRepository sondaRepository
    ) {
        this.operacaoRepository = operacaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.sondaRepository = sondaRepository;
    }

    @Transactional 
    public OperacaoResponse registrar(OperacaoRequest request) {

        Usuario usuario = usuarioRepository
            .findById(request.usuarioId())
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Usuário não encontrado"
                )
            );

        if (usuario.getStatus() != StatusUsuario.ATIVO) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "O operador está inativo"
            );
        }

        if (usuario.getCargo() != Cargo.OPERADOR) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "O usuário precisa ser um operador"
            );
        }

        Sonda sonda = sondaRepository
            .buscarPorIdComBloqueio(request.sondaId())
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Sonda não encontrada"
                )
            );

        boolean existeOperacao = operacaoRepository.existsBySondaIdAndDataHoraFimIsNull(sonda.getId());

        if (existeOperacao) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A sonda já possui uma operação em andamento"
            );
        }

        if (request.status() == StatusOperacao.DESLIGADO) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Uma nova operação não pode iniciar desligada"
            );
        }

        Operacao operacao = new Operacao();

        operacao.setUsuario(usuario);
        operacao.setSonda(sonda);
        operacao.setStatus(request.status());
        operacao.setDataHoraInicio(Instant.now());

        Operacao salva = operacaoRepository.save(operacao);

        return OperacaoResponse.fromEntity(salva);
    }

    @Transactional(readOnly = true) 
    public List<OperacaoResponse> listar() {
        
        return operacaoRepository
            .findAllByOrderByDataHoraInicioDesc()
            .stream()
            .map(OperacaoResponse::fromEntity)
            .toList();
    }

    @Transactional(readOnly = true) 
    public OperacaoResponse buscarPorId(Integer id) {

        Operacao operacao = operacaoRepository
            .findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Operação não encontrada"
                )
            );
        
        return OperacaoResponse.fromEntity(operacao);
    }

    @Transactional 
    public OperacaoResponse alterarStatus(Integer id, StatusOperacao novoStatus) {

        Operacao operacao = operacaoRepository
            .findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Operação não encontrado"
                )
            );
        
        sondaRepository
            .buscarPorIdComBloqueio(operacao.getSonda().getId())
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Sonda não encontrada"
                )
            );

        if (operacao.getDataHoraFim() != null) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A operação já foi encerrada"
            );
        }

        operacao.setStatus(novoStatus);

        if (novoStatus == StatusOperacao.DESLIGADO) {
            operacao.setDataHoraFim(Instant.now());
        }

        Operacao salva = operacaoRepository.save(operacao);

        return OperacaoResponse.fromEntity(salva);
    }
}
