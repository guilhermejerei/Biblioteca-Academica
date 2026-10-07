package com.biblioteca.controller;

import com.biblioteca.dto.CadastroRequest;
import com.biblioteca.dto.LoginRequest;
import com.biblioteca.dto.LoginResponse;
import com.biblioteca.dto.UsuarioDTO;
import com.biblioteca.model.Usuario;
import com.biblioteca.model.Usuario.TipoUsuario;
import com.biblioteca.repository.UsuarioRepository;
import com.biblioteca.security.TokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TokenUtil tokenUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    /**
     * POST /api/auth/login
     * Body: { "email": "...", "senha": "..." }
     * Retorna token + dados básicos do usuário autenticado.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getSenha() == null) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Email e senha são obrigatórios."));
        }

        Optional<Usuario> optUsuario = usuarioRepository.findByEmail(request.getEmail());

        if (optUsuario.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erro", "Email ou senha inválidos."));
        }

        Usuario usuario = optUsuario.get();

        // Verifica a senha usando BCrypt
        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erro", "Email ou senha inválidos."));
        }

        // Gera token e retorna os dados do usuário (sem a senha)
        String token = tokenUtil.gerarToken(usuario.getId(), usuario.getEmail(), usuario.getTipo().name());

        LoginResponse response = new LoginResponse(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTipo().name()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/register
     * Body: { "nome": "...", "cpf": "...", "email": "...", "telefone": "...", "senha": "...", "tipo": "ALUNO" }
     * Cria uma nova conta e retorna os dados do usuário criado.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody CadastroRequest request) {
        // Validações básicas
        if (request.getNome() == null || request.getNome().isBlank())
            return ResponseEntity.badRequest().body(Map.of("erro", "Nome é obrigatório."));
        if (request.getEmail() == null || request.getEmail().isBlank())
            return ResponseEntity.badRequest().body(Map.of("erro", "Email é obrigatório."));
        if (request.getCpf() == null || request.getCpf().isBlank())
            return ResponseEntity.badRequest().body(Map.of("erro", "CPF é obrigatório."));
        if (request.getSenha() == null || request.getSenha().length() < 6)
            return ResponseEntity.badRequest().body(Map.of("erro", "Senha deve ter ao menos 6 caracteres."));

        // Verifica unicidade
        if (usuarioRepository.existsByEmail(request.getEmail()))
            return ResponseEntity.badRequest().body(Map.of("erro", "Este email já está cadastrado."));
        if (usuarioRepository.existsByCpf(request.getCpf()))
            return ResponseEntity.badRequest().body(Map.of("erro", "Este CPF já está cadastrado."));

        // Determina o tipo de conta
        TipoUsuario tipo;
        try {
            tipo = TipoUsuario.valueOf(request.getTipo().toUpperCase());
        } catch (Exception e) {
            tipo = TipoUsuario.ALUNO; // padrão: ALUNO
        }

        // Cria o usuário com a senha hasheada
        Usuario novoUsuario = new Usuario();
        novoUsuario.setNome(request.getNome());
        novoUsuario.setCpf(request.getCpf());
        novoUsuario.setEmail(request.getEmail());
        novoUsuario.setTelefone(request.getTelefone());
        novoUsuario.setSenha(passwordEncoder.encode(request.getSenha()));
        novoUsuario.setTipo(tipo);

        Usuario salvo = usuarioRepository.save(novoUsuario);

        UsuarioDTO dto = new UsuarioDTO(
                salvo.getId(), salvo.getNome(), salvo.getCpf(),
                salvo.getEmail(), salvo.getTelefone(), salvo.getTipo().name()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * POST /api/auth/logout
     * Header: Authorization: Bearer <token>
     * Invalida o token do usuário.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            tokenUtil.invalidar(token);
        }
        return ResponseEntity.ok(Map.of("mensagem", "Logout realizado com sucesso."));
    }
}
