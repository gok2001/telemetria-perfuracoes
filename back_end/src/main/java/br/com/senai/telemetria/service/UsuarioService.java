package br.com.senai.telemetria.service;

import br.com.senai.telemetria.dto.request.UsuarioRequest;
import br.com.senai.telemetria.entity.Usuario;
import br.com.senai.telemetria.enums.StatusUsuario;
import br.com.senai.telemetria.repository.UsuarioRepository;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service 
public class UsuarioService {
    
    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional 
    public Usuario cadastrar(UsuarioRequest request) {

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        String cpf = request.cpf();

        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        if (usuarioRepository.existsByCpf(cpf)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado");
        }

        Usuario usuario = new Usuario();

        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        usuario.setCpf(cpf);
        usuario.setSenha(passwordEncoder.encode(request.senha()));
        usuario.setCargo(request.cargo());
        usuario.setStatus(StatusUsuario.ATIVO);

        return usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true) 
    public List<Usuario> listar() {
        return usuarioRepository.findAll();
    }

    @Transactional(readOnly = true) 
    public Usuario buscarPorId(Integer id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado")
        );
    }

    @Transactional 
    public Usuario alterarStatus(Integer id, StatusUsuario status) {
        Usuario usuario = buscarPorId(id);

        usuario.setStatus(status);

        return usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public Usuario autenticar(String email, String senha) {
        if (email == null || email.isBlank() || senha == null || senha.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail e senha são obrigatórios");
        }

        String emailNormalizado = email.trim().toLowerCase(Locale.ROOT);

        Usuario usuario = usuarioRepository.findAll().stream()
            .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(emailNormalizado))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos"));

        if (usuario.getStatus() == StatusUsuario.INATIVO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuário inativo. Contate o Controlador.");
        }

        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos");
        }

        return usuario;
    }
}
