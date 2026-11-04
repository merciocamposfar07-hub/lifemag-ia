# LifeMag IA — biblioteca científica SQLite no Worker (v0.4.2)

## Objetivo e escopo
A nova opção de armazenamento científico não depende de criar D1 manualmente no painel Cloudflare.

A classe `LifeMagScientificStore`, declarada em `worker/science-do.js`, usa **Durable Objects com SQLite e FTS5**, disponíveis no plano Workers Free da Cloudflare. O arquivo `wrangler.json` declara um namespace SQLite como `SCIENCE_LIBRARY` e um objeto único `lifemag-main`. No primeiro deploy bem-sucedido, a Cloudflare provisiona o namespace da aplicação, sem precisar da chave de API D1 nem alterar o Portal CSC.

**Apenas fontes científicas:** o banco não armazena nomes de pacientes, prontuários ou receitas.

## Fluxo efetivo
1. O proprietário mantém o repositório GitHub ligado ao Worker `lifemag-ia-clinico`, com build `node scripts/build-worker.mjs` e deploy `npx wrangler deploy`.
2. Um push na `main` solicita a publicação automática. A classe DO é empacotada e registrada pelo Wrangler.
3. No LifeMag IA > Central Científica, `Verificar fontes` chama `/api/source-status` e executa **uma busca real no PubMed via Europe PMC**, além de consultar o SQLite para número de documentos aprovados e trechos recuperáveis.
4. A IA faz consulta online ao PubMed e a trechos de documentos oficiais `approved` disponíveis no SQLite; somente trechos recuperados podem ser citados. Caso a biblioteca SQLite esteja vazia, o sistema continua consultando PubMed online.
5. Em `Testar IA com caso fictício`, a aplicação envia um caso sem dados pessoais ao modelo Workers AI. O teste completo consome franquia do modelo e não é executado automaticamente.
6. O farmacêutico pode importar um manifesto JSON de documento oficial revisado na Central Científica (em seção recolhível). O servidor valida **Cloudflare Access, origem do pedido, confirmação de revisão, URL oficial, edição, licença, data, SHA-256 do documento e de cada trecho**. Os trechos são inseridos de forma atômica no SQLite e passam a aparecer na pesquisa FTS5.

## Limites que não podem ser omitidos
- Namespace provisionado **não significa** que todas as monografias da Farmacopeia Brasileira, Formulário Nacional e Formulário de Fitoterápicos estejam indexadas.
- Inicialmente há catálogo das fontes, mas **zero documentos oficiais aprovados para recuperar**, até a revisão e importação. Não afirmar que o assistente já consultou uma monografia sem evidência de trecho efetivo.
- O assistente não pode afirmar uma dose ideal só porque ela aparece num resumo: eficácia, tolerabilidade e contraindicações precisam de avaliação farmacêutica.
- Consensus continua exigindo **chave exclusiva da API** em Cloudflare Workers Secret `CONSENSUS_API_KEY`. O app Consensus conectado ao ChatGPT não compartilha essa credencial.
- O banco científico não resolve o armazenamento clínico: fichas demonstrativas ainda usam `localStorage`; pacientes reais devem aguardar infraestrutura clínica segura e LGPD.
- A publicação e a consulta do Worker protegido precisam ser comprovadas no ambiente do proprietário; ferramentas GitHub não permitem consultar diretamente sessões protegidas do Cloudflare Access.

## Publicações oficiais identificadas
- Farmacopeia Brasileira 8ª edição: https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/farmacopeia-brasileira
- Formulário Nacional 3ª edição: https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional
- Formulário de Fitoterápicos 3ª edição: https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-fitoterapico
- PCDT Conitec: https://www.gov.br/conitec/pt-br
- OMS: https://www.who.int/publications
- Guia de Atividade Física: https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/guias-e-manuais/2021/guia-de-atividade-fisica-para-a-populacao-brasileira.pdf/view

## Referências técnicas
- Durable Objects SQLite: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- Configuração automática de classes DO: https://developers.cloudflare.com/durable-objects/get-started/
- FTS5: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/#sql-api
- PubMed Europe PMC REST API: https://dev.europepmc.org/RestfulWebService
- API Consensus: https://docs.consensus.app/api-get-started

## v0.4.4 — Primeira carga automática de conteúdo institucional (04/11/2026)

Ao inicializar a biblioteca SQLite, o LifeMag IA insere **13 sínteses institucionais originais** de sete fontes oficiais verificadas:
- Farmacopeia Brasileira, 8ª edição — 2 sínteses sobre escopo e volumes.
- Formulário Nacional, 3ª edição — 2 sínteses sobre monografias, manipulação e estabilidade.
- Formulário de Fitoterápicos, 3ª edição — 2 sínteses sobre espécies, formulações e vigência.
- Conitec/PCDT — 2 sínteses sobre critérios, acompanhamento e atualização de protocolos.
- OMS — 2 sínteses sobre atividade física e grupos populacionais.
- Guia de Atividade Física para a População Brasileira — 1 síntese.
- Guia Alimentar para a População Brasileira — 2 sínteses.

As sínteses ficam em tabelas separadas de monografias aprovadas, com busca **SQLite FTS5**. Os endpoints protegidos passam a distinguir:
- `official_overview_available`: síntese institucional que oferece contexto, **sem conteúdo completo nem dose terapêutica**.
- `content_retrievable`: documentos/monografias revisados após importação profissional.
- `external_api_registered`: fonte online de pesquisa, como PubMed.

A Central Científica mostra a quantidade real de sínteses e documentos e oferece **Pesquisar conteúdo científico**, que chama `GET /api/science/search?q=tema`. Isso permite confirmar recuperação por assunto antes de pedir formulação. A primeira resposta da IA pode citar uma sinopse como contexto institucional, mas o validador de doses rejeita essas referências para justificar posologias.

**Não confundir a carga de 13 sínteses com importação integral dos volumes da Anvisa.** Em 04/11/2026, tentativas de consulta automatizada a links da Biblioteca Digital Anvisa retornaram HTTP 403. Não há autorização para contornar controles de acesso. As monografias precisam ser obtidas por meio permitido e submetidas à revisão profissional, com conteúdo e versão verificados, antes de integrar a validação clínica.

O Consensus continua aguardando credencial de API do proprietário. A biblioteca não inventa estudos nem simula acesso ao Consensus quando a chave está ausente.

O código foi versionado no GitHub; após o deployment automático o diagnóstico deverá indicar `overviewSections=13`, `approvedDocuments=0` até haver importações revisadas. A confirmação de publicação remota ainda é necessária.
