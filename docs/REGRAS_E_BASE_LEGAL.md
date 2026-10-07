# Regras de Negócio e Base Legal

> **Aviso importante:** Este documento foi elaborado para fins de organização interna do desenvolvimento.
> Ele **não constitui parecer jurídico** e **não garante conformidade legal**.
> Cada item marcado com ⚖️ **deve ser confirmado pela assessoria jurídica da instituição** antes
> de ser considerado em conformidade.

---

## 1 — Proteção de Dados Pessoais (LGPD — Lei 13.709/2018)

| Regra implementada | Base motivadora | Status jurídico |
|---|---|---|
| Coleta mínima: nome, identificação, vínculo, e-mail/telefone para avisos | Art. 6º, III (finalidade) e VI (necessidade) da LGPD | ⚖️ Confirmar com jurídico quais campos são estritamente necessários |
| Senhas armazenadas apenas com hash BCrypt — nunca em texto claro nem em logs | Art. 46 da LGPD (medidas de segurança) | ✅ Decisão técnica consolidada |
| Histórico de empréstimos visível apenas ao próprio usuário e ao bibliotecário | Art. 6º, III e VII da LGPD (finalidade e prevenção) | ⚖️ Confirmar com jurídico se o bibliotecário tem base legal para acesso irrestrito ao histórico |
| CPF não exposto em respostas de listagem geral (apenas para o próprio usuário e bibliotecário) | Art. 6º, III da LGPD | ✅ Decisão de design |
| Anonimização do histórico após prazo de retenção configurável | Art. 15 e 16 da LGPD (término do tratamento) | ⚖️ Confirmar prazo mínimo de retenção para fins de cobrança e prescrição |
| Solicitação de eliminação/anonimização pelo usuário | Art. 18, IV da LGPD (direito do titular) | ⚖️ Confirmar se dados necessários a débito em aberto impedem atendimento imediato |
| Dados pessoais do histórico anonimizados após prazo — estatísticas preservadas | Art. 12 e 16 da LGPD | ⚖️ Confirmar definição de "dado anonimizado" suficiente para o contexto |
| Log de auditoria sem dados pessoais desnecessários | Art. 46 da LGPD (medidas de segurança) | ⚖️ Confirmar tempo de retenção dos logs de acesso com o encarregado de dados |
| Retenção de logs configurável (padrão 6 meses) | Boas práticas de segurança da informação | ⚖️ Confirmar com jurídico se a instituição tem obrigação legal de prazo mínimo maior |

### Questão pendente — Menores de idade
O sistema pode receber cadastros de alunos de graduação com 17 anos de idade.
O cadastro é baseado em vínculo institucional (matrícula validada pelo bibliotecário),
**sem uso de consentimento como base legal** para tratamento de dados.

> ⚖️ **Pendente de confirmação jurídica:** A base legal adequada para tratamento de dados
> de menores vinculados institucionalmente (art. 14 vs. art. 7º, III ou IX da LGPD)
> **não foi definida**. A assessoria jurídica deve confirmar se o vínculo institucional
> é base suficiente ou se é necessário consentimento dos responsáveis para menores de 18 anos.

---

## 2 — Penalidades por Atraso

| Regra implementada | Base motivadora | Status jurídico |
|---|---|---|
| Penalidade configurável: suspensão (padrão) ou multa financeira | Regulamento interno da instituição | ⚖️ Instituições públicas podem ter restrições à cobrança de multa financeira. Confirmar com jurídico |
| Modo padrão: suspensão proporcional (dias de suspensão por dia de atraso) | Prática de universidades públicas brasileiras | ⚖️ Confirmar regulamento interno vigente |
| Multa financeira: valor por dia por item, com teto configurável | Para instituições privadas ou com regulamento que a autorize | ⚖️ Confirmar com jurídico a legalidade e o teto máximo aplicável |
| Multa nunca excede o valor de referência do exemplar | Princípio de proporcionalidade | ⚖️ Confirmar se este limite é exigido pelo regulamento interno |
| Sem juros nem multa sobre multa | Princípio de proibição de anatocismo (art. 591 do Código Civil) | ⚖️ Confirmar aplicabilidade ao contexto institucional |

---

## 3 — Prescrição de Débitos

| Regra implementada | Base motivadora | Status jurídico |
|---|---|---|
| Prazo de prescrição configurável, padrão 5 anos | Art. 206, §5º, I do Código Civil (dívidas líquidas por instrumento) | ⚖️ **Pendente de confirmação jurídica:** verificar se o prazo aplicável é este ou outro específico para o tipo de relação jurídica da instituição |
| Débitos prescritos registrados como "prescrito" e não cobrados | Princípio da prescrição extintiva | ⚖️ Confirmar se a instituição pode/deve manter esses registros e por quanto tempo |

---

## 4 — Direitos Autorais e Cópia

| Regra | Status |
|---|---|
| O sistema gerencia **apenas empréstimo de exemplares físicos** | ✅ Escopo definido |
| **Fora de escopo:** digitalização, reprodução, cópia ou empréstimo de e-books | ⚖️ Qualquer expansão para materiais digitais exige licença específica (Lei 9.610/1998 — Lei de Direitos Autorais) |
| **Fora de escopo:** empréstimo entre bibliotecas (comutação bibliográfica) | ⚖️ Requer acordo interinstitucional e base legal própria |

---

## 5 — Acessibilidade

| Regra implementada | Base motivadora | Status |
|---|---|---|
| Interface navegável por teclado, foco visível, rótulos ARIA | Lei 13.146/2015 (LBI), art. 63; eMAG v3.1 | ⚠️ Implementado parcialmente — auditoria completa com tecnologia assistiva não realizada |
| Mensagens de erro em texto (não apenas por cor) | WCAG 2.1 critério 1.4.1 | ✅ |
| Contraste de texto | WCAG 2.1 critério 1.4.3 (AA) | ⚠️ Paleta não foi formalmente auditada |
| Campo "versão em formato acessível" no cadastro do título | LBI art. 67 | ✅ Campo implementado no modelo |
| Sem coleta de dados sobre deficiência dos usuários | LGPD art. 11 (dados sensíveis) | ✅ Nenhum campo desse tipo existe |

> **Aviso:** Conformidade com WCAG exige validação manual com tecnologias assistivas
> (leitores de tela, navegação por teclado) e não pode ser garantida apenas por revisão de código.

---

## 6 — Autenticação e Segurança

| Regra implementada | Motivação | Status |
|---|---|---|
| JWT com segredo em variável de ambiente | Boa prática de segurança | ✅ |
| Verificação do campo `ativo` do usuário a cada requisição | Garantir que inativações tenham efeito imediato | ✅ |
| Senhas nunca em logs nem em respostas da API | LGPD art. 46 | ✅ |
| Token sem dados pessoais além do ID e perfil | Minimização de dados | ✅ |

---

## 7 — Retenção e Anonimização

| Prazo / Configuração | Padrão implementado | Confirmação necessária |
|---|---|---|
| Retenção do histórico de empréstimos | Configurável (padrão: 5 anos) | ⚖️ Confirmar com jurídico prazo mínimo para fins de cobrança |
| Retenção de logs de acesso | Configurável (padrão: 6 meses) | ⚖️ Confirmar se há obrigação legal de prazo maior |
| Prazo de prescrição de débitos | Configurável (padrão: 5 anos) | ⚖️ Ver seção 3 |

---

*Documento gerado automaticamente durante o desenvolvimento. Última atualização: outubro de 2026.*
*Mantenha este documento atualizado sempre que uma regra for adicionada ou alterada.*
