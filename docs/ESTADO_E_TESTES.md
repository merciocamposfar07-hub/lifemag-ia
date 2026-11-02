# Implementação e testes — 02/11/2026

## Versão 0.1.2 — confirmado no repositório
- Mantidos layout A/B/C, ícone oficial e navegação sem redundâncias.
- Cadastro e histórico **fictícios**; conversa sem IA real e editor magistral demonstrativo.
- Comparação simples, lembrete de três dias e impressão de documentos demonstrativos.
- Corrigida a rejeição de datas inexistentes no cálculo de início, término e lembretes.
- Incluídos 17 testes automatizados no arquivo `testes/testar_logica.js`.
- Criado CI `.github/workflows/validacao.yml` para verificar sintaxe de JavaScript e executar os 17 testes em alterações no repositório.
- Criado fluxo **manual** `.github/workflows/publicar-pages.yml` para publicar somente os arquivos necessários do protótipo, quando Pages estiver autorizado.

## Evidências e limitações de verificação
- Versão anterior: 10 verificações PASSARAM em uma cópia de desenvolvimento, conforme relatório de 01/11/2026.
- Versão 0.1.2: código e testes foram gravados no GitHub. O resultado da nova execução automática ainda não foi confirmado aqui.
- Publicação: **não habilitada**. O fluxo GitHub Pages precisa de ativação em **Settings > Pages > Source: GitHub Actions** e execução manual em **Actions**. Repositório privado pode exigir plano GitHub Pro/Team/Enterprise.
- Publicação alternativa pela Vercel foi impedida por falta de autorização da conexão ao escopo da conta. Nenhuma implantação foi declarada como concluída.
- Testes visuais no iPhone real e no Chrome: **pendentes**.

## Antes de dados clínicos reais
Exigir autenticação, segregação e proteção dos dados conforme LGPD, backend seguro, auditoria, backups, integração IA e fontes confiáveis, revisão de segurança e interações, notificações remotas, assinaturas válidas, validação documental e testes em dispositivos.

**Não usar dados reais de pacientes; prescrições emitidas por esta versão são rascunhos sem assinatura.**
