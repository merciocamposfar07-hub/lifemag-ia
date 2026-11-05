# LifeMag IA v0.4.5 — importação dos compêndios da Anvisa (04/11/2026)

## Objetivo e limites
Criar uma **biblioteca privada pesquisável** a partir de PDFs das edições **vigentes em 2026** da Farmacopeia Brasileira, do Formulário Nacional e do Formulário de Fitoterápicos. O GitHub mantém **apenas código, metadados e URLs**: NÃO publica os PDFs nem o texto integral extraído.

O sistema reconhece dois níveis:
- **PDF convertido / pending_review**: documento recebido, convertido para texto via `env.AI.toMarkdown` e armazenado no SQLite. Pode ser recuperado como CONTEXTO, com o identificador de referência `P#`, mas não valida dose, preparo, interação, prescrição ou compatibilidade até conferência completa das tabelas, unidades e capítulos.
- **Documento revisado / approved**: somente após ingestão documental com validação explícita no fluxo profissional; as referências aprovadas aparecem como `C#`. A etapa de revisão integral dos volumes ainda está pendente.

## Fontes cadastradas
| Documento | Identificação | Origem oficial |
|---|---|---|
| FB8 Volume I — métodos gerais | RDC 1.026/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21035 |
| FB8 Volume II — dispositivos médicos | RDC 1.026/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21037 |
| FB8 Volume II — gases medicinais | RDC 1.026/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21038 |
| FB8 Volume II — hemocomponentes | RDC 1.026/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21036 |
| FB8 Volume II — insumos farmacêuticos e especialidades | RDC 1.026/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21042 |
| FB8 Volume II — plantas medicinais | RDC 1.026/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21039 |
| FB8 Volume II — produtos biológicos | RDC 1.026/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21040 |
| FB8 Volume II — radiofármacos | RDC 1.026/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21041 |
| Formulário Nacional 3ª ed. | RDC 1.025/2026 | https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional |
| Formulário de Fitoterápicos 3ª ed. | RDC 1.024/2026 | https://bibliotecadigital.anvisa.gov.br/jspui/handle/anvisa/21045 |

Documentos de referência publicamente catalogados por Fitoterapia Brasil:
- FB8 Volume I: https://fitoterapiabrasil.com.br/biblioteca-virtual/farmacopeia-brasileira-8a-edicao2026-volume-i
- FB8 Volume II (plantas): https://fitoterapiabrasil.com.br/node/45048
- Formulário Nacional 3ª ed.: https://fitoterapiabrasil.com.br/biblioteca-virtual/formulario-nacional-da-farmacopeia-brasileira-3a-edicao2026
- Formulário de Fitoterápicos 3ª ed.: https://www.fitoterapiabrasil.com.br/biblioteca-virtual/formulario-de-fitoterapicos-da-farmacopeia-brasileira-3a-edicao-2026

## Processo implementado
1. A Central Científica mostra os dez arquivos do catálogo.
2. Um único botão permite **tentar buscar e converter os quatro arquivos públicos identificados**. Cada tentativa retorna sucesso ou erro individual, sem falsear completude.
3. Alternativamente, o profissional pode selecionar o PDF oficial no iPhone. A operação é protegida por Cloudflare Access e mesma origem.
4. O Worker verifica assinatura `%PDF-`, tamanho de até 46 MiB e correspondência com catálogo fixo. Ele converte o arquivo com `env.AI.toMarkdown` e calcula SHA-256.
5. O texto é dividido em blocos de até aproximadamente 3.500 caracteres, sem copiar o conteúdo para o GitHub.
6. O Durable Object registra os blocos em tabelas privadas `staged_compendia` e `staged_compendium_passages`, com FTS5 e status `pending_review`. O conteúdo só aparece como contexto marcado **não revisado**.
7. Após revisão profissional, os trechos poderão ser promovidos à base aprovada. **Ainda não existe fluxo de aprovação em lote de volumes completos**; sua implementação exigirá conferência amostral/estrutural e rastreabilidade de tabelas e versões.

## Impedimentos remanescentes
- Em 04/11/2026, a Biblioteca Digital da Anvisa retornou HTTP 403 em diversas URLs de acesso automático. Não contornar restrições; o usuário pode obter o arquivo por meio oficial e importar.
- Alguns volumes (ex.: FB8 Volume II Plantas, 55 MB na cópia localizada) excedem o limite de segurança de 46 MiB por PDF no plano gratuito. Devem ser segmentados por partes ou processados em infraestrutura compatível. **Não prometer importação automática de todos os volumes sob esse limite.**
- Conversão Markdown de tabelas e unidades pode ser imprecisa. Sem inspeção profissional, não autorizar dose ou receita com base nesses trechos.
- Falta confirmação da publicação da versão 0.4.5 no Worker protegido e da capacidade real do `env.AI.toMarkdown` sobre os PDFs de 2026.
- Verificar condições de reprodução e uso das obras antes de armazenamento para finalidade comercial, especialmente porque a publicação pública pode ter restrições; nunca redistribuir o conteúdo integral no repositório.
- Esta biblioteca científica é separada do armazenamento de pacientes e exames.

## Testes
- `testes/testar_importacao_anvisa.js`: catálogo 8+1+1, PDF válido/sintético, limite de bytes, falha 403, divisão de texto e ausência de aprovação automática.
- `testes/testar_sqlite_real.mjs`: gravação e busca FTS5 no SQLite real, distinguindo conteúdo pendente e aprovado.
- Github Actions: as três rotinas de validação incluem os novos testes, mas os testes simulados de conversão não substituem o PDF real.

## APIs
- `GET /api/science/anvisa-catalog`
- `GET /api/science/anvisa-ingestions`
- `POST /api/science/ingest-anvisa`
- `POST /api/science/upload-anvisa-pdf`
- `GET /api/science/search?q=tema`

## Fonte técnica
- Cloudflare AI Markdown Conversion: https://developers.cloudflare.com/workers-ai/features/markdown-conversion/usage/binding/
- Formatos suportados: https://developers.cloudflare.com/workers-ai/features/markdown-conversion/supported-formats/
- Limites Workers: https://developers.cloudflare.com/workers/platform/limits/
