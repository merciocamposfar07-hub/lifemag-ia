# LifeMag IA — Prescrição Magistral Inteligente

**Status:** protótipo demonstrativo v0.1.3 • 02/11/2026

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
- `testes/testar_interface.js`: 16 verificações estáticas de interface, legibilidade e navegação.
- `.github/workflows/validacao.yml`: verificação automatizada de sintaxe e testes.
- `.github/workflows/publicar-pages.yml`: publicação automática do protótipo após alterações na branch `main`, com opção de execução manual.

## Ajustes de interface v0.1.3
- Home inspirada no visual clínico premium aprovado, com cartão de boas-vindas, identidade profissional, maior contraste e textos ampliados.
- Foto profissional opcional em **Configurações**; ao carregar, ela é redimensionada e fica apenas no armazenamento do navegador atual.
- Ícone oficial do app preservado; a nova formulação exibe o ícone oficial na Home.
- Barra inferior com **Início** + Acompanhar, Simulador, Ciência e Documentos; botão de Início também no cabeçalho e suporte ao histórico do navegador.
- Nome **LifeMag IA** e os demais fluxos A/B/C preservados.

## Status funcional
Cadastro e histórico **fictícios**, registro de conversa sem IA, editor e revisão de fórmulas, comparação de versões, cálculo do lembrete de três dias, documentos demonstrativos e links a fontes científicas. **Não** inclui IA clínica real, checagem automatizada de interações, monitoramento científico em tempo real, banco seguro, assinatura ou notificações push.

## Uso e segurança
**Não inserir dados reais de pacientes.** O protótipo usa `localStorage`, sem autenticação nem infraestrutura para dados clínicos. As receitas geradas são rascunhos, não documentos assinados.

Para executar localmente: `python -m http.server 8000` na pasta do repositório e abrir `http://localhost:8000`.

**Publicação web:** GitHub Pages foi habilitado pelo proprietário do repositório e a primeira publicação foi confirmada com sucesso na gravação fornecida. O repositório foi tornado público pelo proprietário para habilitar Pages gratuitamente. O fluxo de Pages passa a publicar automaticamente ao enviar alterações para `main`, com execução manual opcional. O fluxo envia somente `index.html`, arquivos do aplicativo em `src/` e o ícone oficial (sem publicar documentação e testes como parte do artefato do site). O código do repositório público continua visível a terceiros.

## Testes
17 testes de lógica e 16 verificações estáticas de interface estão **versionados no repositório** e incluídos na validação GitHub Actions. O resultado desta nova execução **ainda não foi confirmado** nesta revisão. A abertura da versão anterior no iPhone foi confirmada pelo proprietário, mas as mudanças visuais da v0.1.3 ainda exigem validação no aparelho.

O histórico do planejamento original permanece nos documentos anteriores desta conversa; esta versão do repositório é a base inicial versionada no GitHub.
