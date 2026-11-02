# Implementação e testes — 01/11/2026
## Implementado
- Layout adaptativo e ícone oficial escuro.
- Cadastro fictício, atendimento, histórico básico.
- Registro de conversa sem IA conectada.
- Editor com campos de substâncias, motor/coadjuvante, apresentação e posologia.
- Comparação básica de versões, avisos internos por data, fontes como links.
- Documento demonstrativo e impressão/Savar PDF no navegador.

## Testes locais executados
- `node --check src/app.js`: OK.
- `node --check src/store.js`: OK.
- `node testes/testar_logica.js`: 10 verificações, 0 erros, resultado PASSOU (em cópia local de código).
- Teste visual Chromium: bloqueado por política do ambiente em acesso a localhost; **não validado**.
- Página GitHub Pages: **não habilitada**, repositório privado; não inventar URL de app.
- Usabilidade no iPhone real: **não validada**.

## Pendências essenciais antes de dados clínicos reais
Login/autorização, LGPD, backend protegido, auditoria, backups, integração IA e fontes, cálculo terapêutico verificado, push, assinaturas, conformidade documental e testes no iOS.
