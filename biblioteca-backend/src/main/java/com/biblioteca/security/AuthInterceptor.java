package com.biblioteca.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor de autenticação e autorização.
 *
 * Funciona como um "porteiro" que verifica, antes de cada requisição,
 * se o token é válido e se o usuário tem permissão para acessar o endpoint.
 *
 * Rotas públicas (sem token): /api/auth/login, /api/auth/register
 * Rotas só para BIBLIOTECARIO: POST/PUT/DELETE em livros, autores, categorias,
 *                               GET/PUT/DELETE em usuários, devoluções
 * Rotas autenticadas (qualquer tipo): GET livros, autores, categorias,
 *                                     GET/POST empréstimos próprios
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private TokenUtil tokenUtil;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String method = request.getMethod();
        String path   = request.getRequestURI();

        // --- Preflight CORS: OPTIONS deve passar sem autenticação ---
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // --- Rotas completamente públicas ---
        if (path.startsWith("/api/auth/")) {
            return true;
        }

        // --- Servir capas é público para permitir carregamento direto por tags <img> ---
        if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/capas/")) {
            return true;
        }

        // --- Extrai e valida o token ---
        String token = extrairToken(request);
        TokenUtil.DadosToken dados = tokenUtil.validar(token);

        if (dados == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"erro\":\"Não autenticado. Faça login para continuar.\"}");
            return false;
        }

        // Guarda os dados do usuário autenticado no request para uso nos controllers
        request.setAttribute("usuarioId",   dados.getUsuarioId());
        request.setAttribute("usuarioTipo", dados.getTipo());
        request.setAttribute("usuarioEmail", dados.getEmail());

        // --- Verificação de permissão por role ---

        // Apenas BIBLIOTECARIO pode modificar livros, autores e categorias
        if (isRotaBibliotecario(method, path) && !dados.isBibliotecario()) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"erro\":\"Acesso negado. Apenas bibliotecários podem executar esta operação.\"}");
            return false;
        }

        return true;
    }

    /**
     * Extrai o token do header Authorization: Bearer <token>
     */
    private String extrairToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    /**
     * Define quais combinações de método + path exigem role BIBLIOTECARIO.
     */
    private boolean isRotaBibliotecario(String method, String path) {
        // Modificar livros
        if (path.startsWith("/api/livros") && isModificacao(method)) return true;

        // Listar livros com capas pendentes de revisão
        if (path.equals("/api/livros/capas/revisao") && method.equals("GET")) return true;

        // Modificar autores
        if (path.startsWith("/api/autores") && isModificacao(method)) return true;

        // Modificar categorias
        if (path.startsWith("/api/categorias") && isModificacao(method)) return true;

        // Listar todos os usuários ou modificar qualquer usuário
        if (path.startsWith("/api/usuarios") && (method.equals("GET") || isModificacao(method))) return true;

        // Registrar devolução
        if (path.contains("/devolucao") && method.equals("PUT")) return true;

        // Listar todos os empréstimos (admin) — exceto os de um usuário específico e os filtros
        if (path.equals("/api/emprestimos") && method.equals("GET")) return true;
        if (path.equals("/api/emprestimos/ativos") && method.equals("GET")) return true;
        if (path.equals("/api/emprestimos/atrasados") && method.equals("GET")) return true;

        return false;
    }

    private boolean isModificacao(String method) {
        return method.equals("POST") || method.equals("PUT") || method.equals("DELETE");
    }
}
