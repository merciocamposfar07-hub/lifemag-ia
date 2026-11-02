# LifeMag IA — Prescrição Magistral Inteligente

**Status:** protótipo demonstrativo v0.1.1 • 01/11/2026

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

## Status funcional
Cadastro e histórico **fictícios**, registro de conversa sem IA, editor e revisão de fórmulas, comparação de versões, cálculo do lembrete de três dias, documentos demonstrativos e links a fontes científicas. **Não** inclui IA clínica real, checagem automatizada de interações, monitoramento científico em tempo real, banco seguro, assinatura ou notificações push.

## Uso e segurança
**Não inserir dados reais de pacientes.** O protótipo usa `localStorage`, sem autenticação nem infraestrutura para dados clínicos. As receitas geradas são rascunhos, não documentos assinados.

Para executar localmente: `python -m http.server 8000` na pasta do repositório e abrir `http://localhost:8000`.

**Publicação web:** a hospedagem GitHub Pages ainda **não está ativada**. O repositório está privado; preserve essa configuração até decidir o modelo de acesso. O link do repositório não equivale ao link do aplicativo publicado.

## Testes
10 testes automatizados de lógica passaram na cópia de desenvolvimento; testes visuais em iPhone e Chrome **ainda pendentes** devido ao bloqueio do ambiente automatizado.

O histórico do planejamento original permanece nos documentos anteriores desta conversa; esta versão do repositório é a base inicial versionada no GitHub.
