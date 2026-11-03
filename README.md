# LifeMag IA — Prescrição Magistral Inteligente

**Status:** interface v0.3.0 • integração Cloudflare Access corrigida no GitHub em 03/11/2026; nova implantação e execução real da IA ainda dependem de confirmação.

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
- `testes/testar_clinica.js`: 12 testes do cadastro manual, da ficha clínica e do histórico.
- `testes/testar_ia.js`: 16 testes do serviço de IA com autenticação contextual e fontes.
- `database/schema-inicial.sql`: proposta de modelo PostgreSQL independente com isolamento por farmacêutico; NÃO implantado.
- `testes/testar_interface.js`: 39 verificações estáticas de interface, legibilidade e navegação.
- `.github/workflows/validacao.yml`: verificação automatizada de sintaxe e testes.
- `.github/workflows/publicar-pages.yml`: publicação automática do protótipo após alterações na branch `main`, com opção de execução manual.

## Ajustes de interface v0.1.3
- Home inspirada no visual clínico premium aprovado, com cartão de boas-vindas, identidade profissional, maior contraste e textos ampliados.
- Foto profissional opcional em **Configurações**; ao carregar, ela é redimensionada e fica apenas no armazenamento do navegador atual.
- Ícone oficial do app preservado; a nova formulação exibe o ícone oficial na Home.
- Barra inferior com **Início** + Acompanhar, Simulador, Ciência e Documentos; botão de Início também no cabeçalho e suporte ao histórico do navegador.
- Nome **LifeMag IA** e os demais fluxos A/B/C preservados.

## Navegação v0.1.5
- No iPhone, a Home utiliza diretamente o cabeçalho azul com foto/nome/CRF e elimina a barra clara redundante.
- Barra inferior com cinco destinos: **Início, Acompanhar, IA (central, destacado), Ciência e Documentos**.
- O botão central **IA** abre a tela Conversa Inteligente. Trata-se de navegação funcional, **não** de geração inteligente: não há backend, modelo de linguagem nem conexão segura com provedor de IA.
- Para ativar IA real, será necessário hospedar um backend autenticado, guardar credenciais somente no servidor, aplicar controles de segurança/LGPD, validação de evidências e revisão humana antes de gerar receitas.
- O Simulador permanece acessível dentro do Editor Studio Magistral e na navegação lateral de desktop.

## Módulo de atendimento clínico v0.2.0
- **Cadastro manual:** o aplicativo nasce sem pacientes pré-carregados, e não acessa o Portal CSC.
- Busca por nome ou telefone, prevenção conservadora de possíveis cadastros repetidos, e ação visível para **Iniciar avaliação clínica** depois de salvar um cadastro.
- **Ficha clínica individual em cada atendimento**: motivo/objetivo, sintomas, antecedentes, medicamentos, alergias, exames, riscos e plano de reavaliação. Os campos são preenchidos exclusivamente pelo farmacêutico.
- Avaliações anteriores são preservadas por atendimento; novas consultas começam com nova ficha vazia.
- Lista de atendimentos permite **reabrir avaliação** ou **abrir a formulação**; o editor mostra o resumo clínico sem inventar dados quando não forem registrados.
- Modelo de ficha clínica imprimível inclui os campos do atendimento, com marca explícita de **rascunho de teste**.
- Tipografia da ficha ajustada para leitura no iPhone, mantendo o layout Home aprovado v0.1.8.
- Modelo de banco isolado em `database/schema-inicial.sql`, **ainda não executado e sem backend/autenticação/armazenamento seguro**.
- Não cadastrar pacientes reais nesta versão. O `localStorage` não é prontuário protegido.


## Nova etapa v0.3.0 — Motor de consulta científica preparado (SEM implantação)
- Código de backend Cloudflare Worker em worker/index.js; requer Cloudflare Access, JWT RS256 válido, domínio da equipe, audiência e e-mails autorizados.
- Serviço Worker AI preparado para modelo Llama 3.3 70B fp8 fast, com resumos científicos recuperados do PubMed por meio da API Europe PMC.
- A interface Conversa Inteligente identifica o Worker autenticado no MESMO domínio. Quando ativo, envia somente a pergunta anônima e apresenta resposta + referências PubMed; o texto jamais passa automaticamente ao receituário.
- A Central Científica agora contém links separados para Farmacopeia Brasileira (8ª), Formulário Nacional (3ª), Fitoterápicos (3ª) e página oficial dos compêndios Anvisa de 2026. Essas monografias não foram indexadas nem lidas automaticamente.
- Workers static assets com builder scripts/build-worker.mjs e configuração wrangler.json. A URL GitHub Pages continua sem conexão IA.
- Teste novo testes/testar_ia.js para autenticação, ausência de evidência, dados pessoais e consulta.
- **Sem conta Cloudflare vinculada/configurada, NÃO há IA operante no endereço publicado.** Uso com pacientes reais segue vedado até autenticação, banco clínico protegido, controle LGPD e validação clínica. Ver docs/INTEGRACAO_IA_CLOUDFLARE.md.

## Status funcional
Cadastro e histórico **fictícios**, registro de conversa sem IA, editor e revisão de fórmulas, comparação de versões, cálculo do lembrete de três dias, documentos demonstrativos e links a fontes científicas. **Não** inclui IA clínica real, checagem automatizada de interações, monitoramento científico em tempo real, banco seguro, assinatura ou notificações push.

## Uso e segurança
**Não inserir dados reais de pacientes.** O protótipo usa `localStorage`, sem autenticação nem infraestrutura para dados clínicos. As receitas geradas são rascunhos, não documentos assinados.

Para executar localmente: `python -m http.server 8000` na pasta do repositório e abrir `http://localhost:8000`.

**Publicação web:** GitHub Pages foi habilitado pelo proprietário do repositório e a primeira publicação foi confirmada com sucesso na gravação fornecida. O repositório foi tornado público pelo proprietário para habilitar Pages gratuitamente. O fluxo de Pages passa a publicar automaticamente ao enviar alterações para `main`, com execução manual opcional. O fluxo envia somente `index.html`, arquivos do aplicativo em `src/` e o ícone oficial (sem publicar documentação e testes como parte do artefato do site). O código do repositório público continua visível a terceiros.

## Testes
17 testes de lógica, 39 verificações de interface, 12 testes clínicos e 16 verificações do Worker de IA estão versionados em GitHub Actions (total previsto: 84). A execução local de verificação passou; a publicação e a execução remota pelo GitHub Actions ainda precisam ser conferidas. A abertura da versão anterior no iPhone foi confirmada pelo proprietário, mas as mudanças visuais da v0.1.3 ainda exigem validação no aparelho.

O histórico do planejamento original permanece nos documentos anteriores desta conversa; esta versão do repositório é a base inicial versionada no GitHub.

## Autenticação simplificada na Cloudflare (03/11/2026)
- O proprietário ativou a política Zero Trust Free **LifeMag IA - Acesso Farmacêutico** para o Worker exclusivamente.
- Em 03/11, login One-time PIN funcionou mas servidor retornou 401 por falta dos três segredos exigidos na implementação anterior.
- Corrigido: Worker utiliza `ctx.access.getIdentity()` do runtime Cloudflare depois de autenticação. Nenhum campo `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` ou `ALLOWED_EMAILS` é obrigatório.
- O modelo antigo de `assets` no Wrangler não repassava a identidade ao Worker; por isso a interface passa a ser empacotada pelo script `scripts/build-worker.mjs` e servida diretamente pelo Worker autenticado.
- Código no GitHub foi alterado; a publicação automática na Cloudflare e o funcionamento em navegador devem ser confirmados. **Não usar prontuários reais**.
- Consulte `docs/INTEGRACAO_IA_CLOUDFLARE.md`.
