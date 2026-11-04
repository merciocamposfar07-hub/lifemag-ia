# LifeMag IA — Prescrição Magistral Inteligente

**Status:** v0.4.4 • primeira carga automática de 13 sínteses institucionais pesquisáveis via SQLite FTS5; PubMed via Europe PMC preservado, documentos completos e Consensus ainda pendentes.

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

## Pesquisa científica anônima — 03/11/2026
- Na Conversa Inteligente, quando não há atendimento selecionado, o LifeMag IA agora oferece **pesquisa científica anônima**, sem exigir cadastro de paciente.
- A pesquisa utiliza a API autenticada no mesmo domínio, com referências PubMed por Europe PMC e revisão farmacêutica obrigatória.
- Mensagens dessa área são transitórias na memória da página e **não são gravadas** como pacientes, consultas ou prontuários.
- Após registrar pacientes reais de maneira segura em fase futura, o módulo poderá ser conectado ao fluxo clínico formal. Não usar dados reais até implantar controles LGPD e banco seguro.
- Validação das três suítes pré-existentes adaptadas: 17 testes de lógica, 42 de interface e 12 clínicos (71 no total), além de 16 testes dedicados do Worker versionados no CI.
- Revisão do cache `v0.3.2` para que a interface atualizada apareça no Worker quando o build automático da Cloudflare concluir.

## Revisão da Conversa Inteligente e fontes científicas — v0.3.3 (03/11/2026)
- **Interface somente IA:** removidos o espaço vazio causado pelo min-height do chat e o alinhamento inferior do campo de pergunta. A entrada foi movida para perto do cabeçalho, com tipografia maior, indicador de conexão e mensagens logo abaixo. Também foi compactado o chat de atendimentos. Home v0.1.8 inalterada.
- **Europe PMC/PubMed real:** corrigido parâmetro inválido `sort=RELEVANCE` (padrão da API já é relevância), `resultType=core` para resumos, filtro `SRC:MED`, consultas mais amplas quando necessário e identificação adequada de HTTP/ausência de resumos. A IA não inventa resposta quando a pesquisa externa falha.
- **RAG híbrido preparado:** mecanismo ativo de pesquisa online PubMed/Europe PMC e módulo opcional Cloudflare D1 FTS5 para compêndios oficiais versionados e revisados. Schema `database/base-cientifica-d1.sql`, consulta `worker/science-index.js` e detalhes `docs/FONTES_CIENTIFICAS_RAG.md`.
- **Situação explícita:** a base D1 de monografias ainda NÃO está implantada, preenchida ou revisada. As referências da Anvisa existentes na Central Científica continuam apenas links até ingestão e verificação de suas monografias. Consensus não integrado.
- **Validação:** 17 testes de lógica + 45 de interface + 12 de fluxos clínicos (74 verificações locais); 19 testes do Worker e 6 da futura base indexada também versionados nos workflows. Execução remota e resposta científica de ponta a ponta devem ser verificadas após a publicação Cloudflare.
- **Pacientes reais:** continuam proibidos até banco clínico seguro, LGPD e validação técnica das propostas magistrais.

## v0.4.0 — proposta de formulação e ampliação de fontes
- Servidor usa Cloudflare Workers AI com resposta JSON estruturada para **composição, doses e formas químicas, MOTOR/COADJUVANTE/OPCIONAL, via, posologia, horários, refeições, duração, revisão e monitoramento**. A IA apresenta primeiro o quadro com campos de formulação quando os dados/evidências permitem.
- A validação automática verifica referências e presença da dose no conteúdo recuperado, mas NÃO substitui verificação clínica, farmacotécnica ou aprovação profissional.
- Em caso de informações insuficientes, não libera uma posologia personalizada.
- Consensus API preparado como opção explícita. O recurso fica indisponível até haver chave própria em Cloudflare Secrets; não consome chamadas automaticamente.
- A indexação oficial D1 permanece **não implantada e não preenchida**. Os sites Anvisa, Conitec, OMS, atividade física e nutrição continuam catálogo até ingestão de textos revisados.
- Documentação e procedimento: `docs/ATIVACAO_FONTES_E_FORMULACOES.md`.
- A quantidade manipulada e o preenchimento automático do editor a partir do rascunho ainda exigem etapa complementar.

### Verificação de implantação — 04/11/2026
- Implementação versionada no GitHub: primeiro resultado do assistente em JSON estruturado, incluindo quantidade para manipular. O Worker rejeita saídas livres sem estrutura (HTTP 502) para evitar apresentar prosa imprecisa como receituário.
- Regra de conferência de dose: concentração/unidade citada E substância presente no estudo indicado. É conferência textual conservadora, NÃO prova de dose ideal, eficácia individual, segurança nem ausência de interações.
- No catálogo: Farmacopeia Brasileira 8ª edição, Formulário Nacional 3ª edição, Fitoterápicos 3ª edição e diretrizes. A existência de links no app NÃO representa leitura das monografias.
- O armazenamento das monografias em D1 ainda não está provisionado; o script de importação exige cópia oficial, integridade, licenciamento e revisão identificada. É necessário vincular \`SCIENCE_DB\` no Worker após criar banco próprio.
- A chave \`CONSENSUS_API_KEY\` precisa estar nos Secrets do Cloudflare Worker para ligar a API oficial. O conector Consensus do ChatGPT não é credencial exportável para este aplicativo.
- Bloqueio técnico não resolvido: sem acesso delegado à conta Cloudflare, não foi possível confirmar que o último build foi publicado ou ativar D1/API Secret pelo ChatGPT. O login Zero Trust permanece configurado; Portal CSC não foi alterado.
- Dados clínicos reais continuam proibidos no protótipo que usa localStorage e não dispõe de backend seguro.

## v0.4.1 — verificação científica sem paciente real
- `GET /api/source-status` executa pesquisa real em Europe PMC, verifica bindings, quantidade de documentos e trechos aprovados do D1 e sinaliza Consensus como `key_configured`, sem alegar que a chave foi testada.
- A Central Científica dispara automaticamente a verificação de fontes ao abrir pela primeira vez na sessão e oferece botão para atualizar; **não consome inferência nem chamadas Consensus nessa verificação**.
- `POST /api/selftest` usa apenas informações clínicas fictícias para buscar PubMed e chamar o modelo JSON da Cloudflare. É uma ação explícita e consome apenas franquia Workers AI; nenhum paciente é enviado.
- Na Conversa Inteligente de um atendimento demonstrativo, proposta estruturada com doses apontadas nos trechos pode ser importada mediante clique para o Studio Magistral. A impressão da receita é bloqueada até confirmação de revisão farmacêutica, e alterações posteriores reabrem essa exigência. Não é assinatura digital.
- Novos fluxos de GitHub Actions: `ativar-ciencia-d1.yml` cria/vincula D1 científico **isolado de CSC** depois de autorizados Secrets Cloudflare; `importar-documento-cientifico.yml` importa exclusivamente manifestos validados e aprovados; nenhuma publicação é aprovada automaticamente.
- Corrigido gerador SQL: D1 não aceita `BEGIN TRANSACTION`/`COMMIT` explícitos. Testes de regressão incluídos.
- Sem acesso administrativo autorizado à Cloudflare nesta conversa, **não foi possível executar o provisionamento remoto nem comprovar teste real de IA**. O modelo do Worker está pronto para o teste de ponta a ponta, mas sua execução real ainda precisa ser comprovada.
- A base científica ainda não contém monografias indexadas nem revisão das fontes oficiais. Consensus exige chave API própria, guardada em Secret, e não é ativado pelo plugin Consensus do ChatGPT.
- Cadastro clínico permanece demonstrativo em `localStorage`: não utilizar pacientes reais até autenticação do backend, persistência segura, LGPD e validação farmacêutica.

## v0.4.2 — biblioteca SQLite sem provisionamento manual de D1
- O Worker LifeMag IA agora exporta `LifeMagScientificStore` (Durable Object com SQLite + índice FTS5), com binding `SCIENCE_LIBRARY` declarado em `wrangler.json`. A Cloudflare provisiona a classe no deploy normal do repositório, sem chave de API D1 e sem modificar o Portal CSC.
- Ao abrir a Central Científica, o aplicativo consulta **PubMed/Europe PMC pela internet de verdade** e verifica o estado da biblioteca persistente. O diagnóstico expõe a versão real do servidor.
- A IA pesquisa o PubMed online e os **trechos efetivamente aprovados e encontrados** no SQLite; a ausência de monografias não é ocultada. O D1 anterior permanece como mecanismo opcional e separado, sem necessidade de ativá-lo para a nova biblioteca.
- O profissional pode importar manifestos JSON revisados pelo app, com **Cloudflare Access, checagem de origem, identificação de edição, licença, data e hashes SHA-256 reais de todos os trechos**. O conteúdo somente se torna pesquisável após aprovação e inserção transacional.
- O GitHub Actions passou a executar uma **chamada externa real ao PubMed via Europe PMC** em cada push e testar FTS5 em SQLite real, além dos testes locais de interface, lógica e fluxos clínicos.
- **Limitações:** as monografias completas da Farmacopeia, Formulários, PCDT e diretrizes ainda não foram importadas. O Consensus depende de chave de API própria em Cloudflare Secrets. A versão de produção precisa ser confirmada por diagnóstico autenticado.
- **Dados reais de pacientes:** o app ainda não dispõe de banco clínico seguro, auditoria e integração LGPD completos; não inserir dados pessoais reais.
- Leia `docs/SQLITE_CIENTIFICO_AUTOMATICO.md` para arquitetura, fonte e processo de atualização.

## v0.4.3 — conversa, rascunhos anônimos, cadastros e exames opcionais
- **Layout corrigido:** textarea da Conversa Inteligente em grade horizontal responsiva e botão de envio separado. O checkbox Consensus ocupa linha própria, não comprime o campo no Safari do iPhone.
- **Cadastro demonstrativo:** edição explícita, exclusão confirmada com remoção dos atendimentos locais relacionados; rascunhos independentes preservados.
- **Formulações sem cadastro:** uma proposta estruturada da IA pode ser salva como rascunho com código não identificável (Caso 01), sem dados pessoais ou transcrição da conversa. Pode ser reaberta para continuar uma análise farmacêutica e vinculada mais tarde a um paciente **fictício** já cadastrado. Ao vincular, entra no Studio Magistral com revisão obrigatória e preservação das referências.
- **Exames opcionais:** a interface oferece escolha de arquivo e câmera do iPhone, porém **somente pré-seleção temporária de metadados**. Nenhum exame clínico é armazenado, enviado ou permanentemente vinculado enquanto não existir backend protegido. A ausência de exame não bloqueia consulta.
- A tela Home e o Portal CSC não sofreram alterações. A versão final precisa ser confirmada no Worker protegido após o build automático.
- Revisão de fluxo e armazenamento: `docs/FLUXO_CADASTROS_RASCUNHOS_EXAMES.md`.

## v0.4.4 — integração verificável das fontes oficiais
- Criado `worker/official-overviews.js` com 13 sínteses originais de conteúdo verificado em páginas oficiais da Anvisa, Conitec, OMS e Ministério da Saúde. Bibliografia com edições e URLs explícitas.
- O Durable Object SQLite semeia esse conteúdo automaticamente e o torna pesquisável por FTS5, sem precisar de importação manual para as **sínteses institucionais**.
- **Dois níveis distintos:** sinopses institucionais (`official_overview_available`) servem ao contexto; monografias/PCDT completos (`content_retrievable`) só após revisão e importação. Sinopse nunca serve para validação automática de dose.
- `GET /api/science/search?q=tema` e campo **Pesquisar conteúdo científico** na Central Científica permitem verificar diretamente o que foi recuperado, separando resultados por nível de evidência, sem gastar inferência.
- PubMed online continua operacional em código. Consensus ainda depende da chave API pessoal; não declarar conexão ativa sem autenticação.
- A Biblioteca Digital Anvisa bloqueou consulta automatizada de alguns PDFs (HTTP 403); a integração integral dos documentos depende de acesso permitido e ingestão validada.
- Consulte `docs/SQLITE_CIENTIFICO_AUTOMATICO.md`. Publicação no Worker protegido deve ser conferida após o deploy GitHub.
