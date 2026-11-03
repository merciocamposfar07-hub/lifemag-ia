# Próxima etapa — infraestrutura clínica segura do LifeMag IA

## Escopo fechado
- Produto exclusivo para farmacêuticos, independente do Portal CSC.
- Cadastro exclusivamente manual pelo farmacêutico. A base de pacientes começa vazia.
- Home v0.1.8 aprovada, acesso à IA e rotas A/B/C não devem ser alterados.
- Não utilizar dados clínicos reais no protótipo publicado por GitHub Pages.

## Fase seguinte: transformar demonstração em aplicação de uso clínico
1. **Hospedagem de API autenticada.** Criar um serviço privado com TLS, sessões seguras e identidade profissional; não armazenar segredo de API de IA no navegador.
2. **Banco isolado.** Implementar e validar, em ambiente de testes, o esboço `database/schema-inicial.sql`. Criar regras de acesso por profissional na API e no PostgreSQL. Não reutilizar banco, tabelas ou credenciais CSC.
3. **Migração controlada.** O `localStorage` atual guarda dados somente do protótipo; não migrar dados fictícios automaticamente nem usar como prontuário.
4. **Proteção de dados.** Controle de acesso, criptografia em trânsito e repouso, backups/restauração, logs sem conteúdo clínico, política de retenção, papéis e permissões, resposta a incidentes e documentação LGPD.
5. **Testes negativos obrigatórios.** Acesso entre dois farmacêuticos, mudança indevida de `patient_id`, `encounter_id`, tentativa de vazamento por filtros/API, sessões expiradas, restore de backups.
6. **IA clínica.** Somente após serviços protegidos: modelo acessado por backend, referências verificáveis, avaliação de riscos, fontes datadas e confirmação expressa do farmacêutico antes de salvar/prescrever.
7. **Documentos reais.** Templates profissionais, validação de dados obrigatórios, assinatura, controle de versão e trilha de auditoria.

## Situação em 02/11/2026
- **Implementado em protótipo:** cadastro manual, avaliação por atendimento, revisão, rascunhos de formulação, históricos demonstrativos.
- **Somente especificado:** esquema SQL de banco e regras RLS propostas.
- **Ainda não implantado:** serviço de backend, autenticação, conexão a banco real, processamento de IA, assinatura e segurança clínica de produção.

Esta documentação é um plano técnico, não certificação de conformidade regulatória.
