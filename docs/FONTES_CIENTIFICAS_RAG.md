# LifeMag IA — arquitetura de fontes científicas e RAG (03/11/2026)

## O que a IA consegue consultar atualmente
- **PubMed/MEDLINE via Europe PMC REST:** integração de busca em tempo real em `worker/index.js`. Retorna artigos com PMID, título, data, revista e resumo; o modelo só gera análise quando há trechos verificáveis. A consulta usa `resultType=core`, busca por relevância (sem `sort=RELEVANCE`, parâmetro incompatível) e filtra `SRC:MED`. Uma segunda consulta com termos clínicos menos restritivos é tentada se a primeira não retornar resumos adequados.
- **Cloudflare Workers AI:** modelo Llama 3.3 70B preparado no Worker autenticado. A abertura do aplicativo e a resposta do endpoint de capacidades não provam, por si sós, a geração de uma análise científica. A execução de ponta a ponta deverá ser confirmada após a publicação.
- **Consulta anônima:** mensagens temporárias, sem cadastro ou prontuário. Não usar dados de pacientes reais.

## O que AINDA NÃO está integrado em conteúdo científico
- Farmacopeia Brasileira: links oficiais existentes, mas sem indexação/recuperação de monografias.
- Formulário Nacional: links oficiais, ainda sem textos das fórmulas no índice.
- Formulário de Fitoterápicos e Formulário Homeopático: não indexados.
- Conitec, PCDT, OMS, Guia Alimentar Brasileiro, ACSM e referências nutricionais: ainda não indexados como textos revisados ou conectados a um mecanismo de pesquisa próprio.
- Consensus: API ainda não integrada.
**Não apresentar essas fontes como automaticamente consultadas só porque estão listadas na Central Científica.**

## Como será feita a integração efetiva dos documentos oficiais
1. Obter os documentos na versão oficial e verificar condições de uso e disponibilidade.
2. Registrar fonte, edição, URL, data de publicação e hash da cópia.
3. Extrair o texto com conferência de tabelas, unidades, advertências, notas e componentes farmacotécnicos; não usar OCR ou parser automático sem revisão dos trechos.
4. Dividir em trechos identificados com capítulo, monografia e versão; revisão farmacêutica e status `approved` antes de tornar pesquisável.
5. Indexar no Cloudflare D1 (SQLite FTS5), schema preparado em `database/base-cientifica-d1.sql`.
6. Consulta interna opcional via `worker/science-index.js`: somente trechos de documentos aprovados e fontes ativas, com link à publicação original e identificação da edição.
7. Mesclar esses trechos revisados aos resultados online PubMed antes de acionar o modelo. Nunca inventar evidências, posologias, interações ou monografias ausentes.
8. Atualizar periodicamente as edições com auditoria, controle de versão e retirada de documentos obsoletos.

**Situação técnica:** a estrutura D1 e a função de busca opcional estão versionadas, mas a base D1 ainda não foi criada/bindada/preenchida. O Worker segue funcional para a pesquisa online PubMed mesmo sem D1. Quando a base interna for ativada, o código poderá consultar os dois caminhos em uma única resposta.

## Limitações clínicas
- Artigos recuperados apenas por metadados e resumos não demonstram automaticamente dose efetiva para um paciente específico.
- Monografia farmacopéica é padrão de qualidade/preparo e não, por si, ensaio clínico de eficácia.
- Antes de liberar formulação individualizada, adicionar verificação de doses, interação com medicamentos, contraindicações, referências verificáveis, protocolos e revisão profissional. Até então, o texto da IA não constitui receita.
- Nunca inserir dados de pacientes reais na versão que guarda fichas em localStorage sem banco clínico seguro, permissões auditadas e controles LGPD.

## Fontes técnicas
- Europe PMC REST: https://dev.europepmc.org/RestfulWebService
- Filtro de origem PubMed: `SRC:MED`
- Cloudflare D1 FTS5: https://developers.cloudflare.com/d1/sql-api/sql-statements/
- Cloudflare Workers AI: https://developers.cloudflare.com/workers-ai/configuration/bindings/
