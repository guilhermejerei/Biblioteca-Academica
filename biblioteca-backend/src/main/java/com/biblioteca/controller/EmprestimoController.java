package com.biblioteca.controller;

import com.biblioteca.dto.EmprestimoRequest;
import com.biblioteca.dto.EmprestimoResponse;
import com.biblioteca.dto.ProrrogacaoRequest;
import com.biblioteca.service.EmprestimoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emprestimos")
public class EmprestimoController {

    @Autowired
    private EmprestimoService emprestimoService;

    // GET /api/emprestimos
    @GetMapping
    public ResponseEntity<List<EmprestimoResponse>> listarTodos() {
        return ResponseEntity.ok(emprestimoService.listarTodos());
    }

    // GET /api/emprestimos/{id}
    @GetMapping("/{id}")
    public ResponseEntity<EmprestimoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(emprestimoService.buscarPorId(id));
    }

    // GET /api/emprestimos/usuario/{usuarioId}
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<EmprestimoResponse>> buscarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(emprestimoService.buscarPorUsuario(usuarioId));
    }

    // GET /api/emprestimos/ativos
    @GetMapping("/ativos")
    public ResponseEntity<List<EmprestimoResponse>> buscarAtivos() {
        return ResponseEntity.ok(emprestimoService.buscarAtivos());
    }

    // GET /api/emprestimos/atrasados
    @GetMapping("/atrasados")
    public ResponseEntity<List<EmprestimoResponse>> buscarAtrasados() {
        return ResponseEntity.ok(emprestimoService.buscarAtrasados());
    }

    // POST /api/emprestimos
    @PostMapping
    public ResponseEntity<EmprestimoResponse> realizarEmprestimo(@RequestBody EmprestimoRequest req) {
        EmprestimoResponse resp = emprestimoService.realizarEmprestimo(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    // PUT /api/emprestimos/{id}/devolucao
    @PutMapping("/{id}/devolucao")
    public ResponseEntity<EmprestimoResponse> registrarDevolucao(@PathVariable Long id) {
        return ResponseEntity.ok(emprestimoService.registrarDevolucao(id));
    }

    // PUT /api/emprestimos/{id}/prazo — prorrogação / encurtamento
    @PutMapping("/{id}/prazo")
    public ResponseEntity<EmprestimoResponse> atualizarPrazo(
            @PathVariable Long id,
            @RequestBody ProrrogacaoRequest req) {
        return ResponseEntity.ok(emprestimoService.atualizarPrazo(id, req.getNovaDataPrevista()));
    }
}
