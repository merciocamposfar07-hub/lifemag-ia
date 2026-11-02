# LifeMag IA — Prescrição Magistral Inteligente

**Status:** protótipo demonstrativo v0.1.2 • 02/11/2026

Este repositório contém o código-fonte do LifeMag IA, **isolado dos sistemas CSC**. O desenvolvimento segue o visual aprovado A (Clínico Premium), B (Conversa Inteligente) e C (Studio Magistral), usando o ícone oficial escuro.

## Estrutura
- `index.html`: entrada do aplicativo.
- `src/style.css`: layout responsivo.
- `src/store.js`: protótipo de dados locais e datas.
- `src/app.js`: cadastro, acompanhamento, editor, simulador, consultas e documentos.
- `assets/icone-oficial-escuro.png`: símbolo oficial.
- `docs/DECISOES.md`: requisitos e decisões aprovados.
- `docs/FLUXOGRAMA.md`: fluxograma funcional.
- `docs/MATRIZ_NAVEGACAO.md`: destinos sem redundância.
- `docs/ESTADO_E_TESTES.md`: funcionalidades, testes, falhas e pendências.
- `testes/testar_logica.js`: 17 testes de lógica, datas e armazenamento fictício.
- `.github/workflows/validacao.yml`: verificação automatizada de sintaxe e testes.
- `.github/workflows/publicar-pages.yml`: publicação manual do protótipo, quando GitHub Pages for habilitado.

## Status funcional
Cadastro e histórico **fictícios**, registro de conversa sem IA, editor e revisão de fórmulas, comparação de versões, cálculo do lembrete de três dias, documentos demonstrativos e links a fontes científicas. **Não** inclui IA clínica real, checagem automatizada de interações, monitoramento científico em tempo real, banco seguro, assinatura ou notificações push.

## Uso e segurança
**Não inserir dados reais de pacientes.** O protótipo usa `localStorage`, sem autenticação nem infraestrutura para dados clínicos. As receitas geradas são rascunhos, não documentos assinados.

Para executar localmente: `python -m http.server 8000` na pasta do repositório e abrir `http://localhost:8000`.

**Publicação web:** foi preparado um fluxo manual de GitHub Pages, porém o serviço **ainda não está ativado** e **não há link público validado**. Para ativar, abra **Settings > Pages > Source > GitHub Actions**; depois **Actions > LifeMag IA — publicar protótipo no GitHub Pages > Run workflow**. GitHub Pages em repositório privado exige plano GitHub Pro/Team/Enterprise elegível. Não alterar a privacidade sem decisão expressa. O fluxo publica apenas `index.html`, `src/` necessário à tela e o ícone oficial; não publica a documentação e os testes.

## Testes
17 testes automatizados de lógica estão **versionados no repositório** e o fluxo de validação automática foi incluído; a execução desse novo fluxo **ainda não foi confirmada**. Os 10 testes anteriores passaram na cópia local de desenvolvimento. Testes visuais no iPhone e no Chrome **ainda pendentes**.

O histórico do planejamento original permanece nos documentos anteriores desta conversa; esta versão do repositório é a base inicial versionada no GitHub.
