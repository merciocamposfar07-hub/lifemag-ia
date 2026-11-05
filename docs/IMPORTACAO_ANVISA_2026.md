# LifeMag IA v0.4.9 — integração dos compêndios da Anvisa (04/11/2026)

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

## v0.4.6 — divisão por páginas, integridade e cobertura (04/11/2026)

O código passou a aceitar **lotes de partes de PDF** com manifesto e SHA-256. Esta atualização remove o bloqueio técnico de **um arquivo individual maior que 46 MiB** sem ampliar os limites gratuitos do Worker.

### Preparação local de um volume grande
A ferramenta não distribui PDFs nem seus textos no repositório público. No computador que contém o PDF obtido legitimamente:

```bash
python -m pip install pypdf==5.9.0
python scripts/dividir_compendio_anvisa.py "volume_oficial.pdf" --catalog-id fb8-volume-ii-plantas
```

O programa produz `saida-anvisa/fb8-volume-ii-plantas/manifesto-anvisa.json` e PDFs por intervalo de páginas, com tamanho máximo de **40 MiB** por parte, deixando margem abaixo do limite de upload. Para outros compêndios, selecionar um dos IDs listados em `worker/anvisa-catalog.js`.

### Envio pelo aplicativo
Na **Central Científica → Importação Anvisa**, usar **Importar volume dividido (manifesto + PDFs)**. Selecionar em uma única operação o `manifesto-anvisa.json` **e todos os PDFs gerados**. O navegador verifica contiguidade, quantidade de partes, tamanho e SHA-256 antes do envio. O Worker repete a verificação SHA-256 e associa número da parte, intervalo, total de páginas e hash do PDF original no SQLite privado.

O diagnóstico `GET /api/science/anvisa-coverage` apresenta os grupos por fonte e hash do documento original, com **páginas recebidas / páginas totais** e **partes recebidas / partes esperadas**. `completeExtraction=true` significa somente que a sequência declarada está completa e **cada parte foi extraída para quarentena**; **não comprova qualidade textual, aprovação clínica nem conferência das tabelas**.

### Estado real após desenvolvimento
- **Implementado no código**: divisor offline de PDFs, manifesto, upload por lote, conferência de integridade e cobertura no SQLite, sinalização de lacunas, manutenção do estado `pending_review`.
- **Não confirmado no ambiente Cloudflare do proprietário**: importação de PDFs reais de 2026, número final de monografias, publicação do Worker após os commits e liberação de consulta clínica.
- As três cópias públicas menores podem ser tentadas individualmente; o volume conhecido de plantas de aproximadamente 55 MB **não** é tentado automaticamente em uma chamada destinada a arquivos de até 46 MiB.
- A coleção de oito volumes da FB8 mais dois formulários **não** equivale a dez PDFs já importados: os oito volumes abrangem uma única edição de um dos três compêndios prioritários.
- A ferramenta local não está embutida no iPhone; onde não houver computador para preparar o arquivo, a importação do volume grande continua pendente de alternativa de processamento adequada.
- As condições de uso das obras e a conferência profissional permanecem obrigatórias; nenhum conteúdo integral é publicado no GitHub.

### Observação de testes
O fluxo de CI foi inicialmente bloqueado por um literal SQL incorreto (`"extracting"`) em código anterior. Foi corrigido para `'extracting'`, e o teste SQLite recebeu o status correto `ok_reviewed_document`. A aprovação dos workflows precisa ser observada nos registros da versão mais recente.

## v0.4.8 — consulta online e coleta automatizada (04/11/2026)
- A busca científica do LifeMag IA usa três mecanismos em paralelo: Europe PMC/PubMed, biblioteca SQLite e páginas oficiais HTML da Anvisa (`worker/anvisa-live.js`).
- O material consultado pela rede é **contexto institucional**, não monografia integral; fica explicitamente marcado `official_web_context`, sem autorização de dose terapêutica pelo validador.
- A obtenção dos PDFs públicos menores deixa de depender de seleção manual quando o **Cloudflare Cron** está implantado: `worker/anvisa-auto-sync.js` tenta apenas **um** dos três documentos elegíveis por execução diária. O arquivo acima de 46 MiB e volumes sem URL de cópia pública continuam fora da coleta automática direta.
- `auto_compendium_sync` registra `extracted_pending_review` ou `import_failed` com data, mensagem e quantidade de trechos. A Central Científica apresenta os registros reais quando disponíveis, sem confundir falhas com importações concluídas.
- Esse agendamento poderá consumir franquia da Cloudflare AI. O script não afirma que o PDF foi obtido nem altera seu estado para `approved` sem revisão.
- Testes: `testes/testar_anvisa_online.js` e `testes/testar_auto_sync.js`. Não são testes da execução remota nem das páginas integrais convertidas.


## v0.4.9 — coleta progressiva sem seleção manual

- O projeto está ligado ao Worker Cloudflare chamado **lifemag-ia-clinico**, com checks de implantação na integração oficial do GitHub.
- O cron está configurado para executar no minuto 17 de cada hora, em **UTC**: expressão `17 * * * *`. A execução efetiva deve ser confirmada pelo registro na base SQLite; build bem-sucedido não implica extração.
- Prioridade: Formulário Nacional 3ª edição, Formulário de Fitoterápicos 3ª edição e Farmacopeia Brasileira 8ª edição Volume I. Depois tenta outros seis volumes elegíveis, respeitando limite de arquivo.
- Se uma URL de cópia pública falhar ou não existir, o servidor tenta a página canônica da Biblioteca Digital e procura exclusivamente um link PDF HTTPS cujo identificador corresponda ao mesmo handle oficial. **HTTP 403 não é contornado.**
- Registro em SQLite: `in_progress` (início), `import_failed` (falha explícita), `extracted_pending_review` (conteúdo convertido e ainda não revisado). Repetições de erro respeitam janela de 12 horas.
- O arquivo conhecido de **plantas medicinais, cerca de 55 MB**, permanece acima do limite seguro configurado de 46 MiB. O divisor de arquivos está implementado, mas ainda não há execução remota automatizada de segmentação.
- O Cloudflare Workers Free tem **128 MB de memória por isolate** e restrições de CPU por invocação. Nem o resultado verde da CI nem um PDF registrado no catálogo garantem a conversão real.
- Dados científicos somente podem ser considerados monografia aprovada após conferência de integridade, edição, unidades, tabelas, termos de uso e revisão profissional. Páginas institucionais online fornecem somente contexto, não monografia integral.
- Verificações: `testar_auto_sync.js`, `testar_importacao_anvisa.js`, `testar_descoberta_anvisa.js`, `testar_sqlite_real.mjs` e suite de interface.

**PENDÊNCIAS:** observar a primeira execução real do cron no endpoint autenticado `/api/source-status`, confirmar a quantidade efetivamente convertida e resolver a obtenção e segmentação dos volumes maiores sem transferência manual pelo usuário.
