# LifeMag IA — ativação das fontes científicas e proposta magistral (04/11/2026)

## Funcionalidades adicionadas ao código v0.4.0
- A primeira resposta do motor passa a pedir estrutura JSON contendo objetivo, forma farmacêutica, composição, substância e forma química, doses com unidades, classificação MOTOR/COADJUVANTE/OPCIONAL, posologia, horários, refeições, duração inicial, reavaliação, monitoramento, contraindicações, interações e fontes.
- O servidor verifica se a dose aparece nos trechos de evidência associados. Valores não confirmados não são marcados como dose terapêutica válida.
- Se o texto clínico só inclui sintomas, faltando faixa etária, medicamentos, alergias ou antecedentes, a resposta é marcada como INFORMAÇÃO INSUFICIENTE, sem liberar posologia individual.
- Não transformar o ciclo de 30 dias de termogênico + 15 dias de pausa em protocolo universal; continuidade depende de substâncias, condição do paciente, eventos adversos, evidência e revisão.
- O modelo Llama 3.3 70B recebe o formato estruturado por JSON Mode conforme documentação Cloudflare; se o modelo não conseguir seguir o schema, é necessário tratar o erro.
- PubMed via Europe PMC continua consulta bibliográfica online.
- Adaptador de Consensus REST API adicionado em worker/consensus.js. Só consulta se a pessoa marcar a opção; uma chave CONSENSUS_API_KEY protegida em Cloudflare Secrets ainda precisa ser adicionada para habilitá-lo. O uso do @Consensus dentro do ChatGPT não fornece essa chave ao Worker.
- Catálogo ampliado de Farmacopeia Brasileira, Formulário Nacional, Fitoterápicos, Conitec/PCDT, OMS, Guia Alimentar, Guia de Atividade Física, ACSM e Consensus.

## Fontes: situação real
| Fonte | Mecanismo | Situação |
|---|---|---|
| PubMed / Europe PMC | REST no servidor | Código implementado; execução externa após última implantação ainda não validada |
| Farmacopeia Brasileira 8ª edição | Índice D1 de monografias verificadas | Sem base D1 provisionada e carregada |
| Formulário Nacional 3ª edição | Índice D1 | Não carregado |
| Formulário de Fitoterápicos 3ª edição | Índice D1 | Não carregado |
| Conitec/PCDT | Índice D1 de protocolos oficiais | Não carregado |
| OMS / WHO | Índice D1 de diretrizes oficiais | Não carregado |
| Guias brasileiros de atividade física e alimentação | Índice D1 | Não carregados |
| ACSM | Conteúdo sujeito à licença | Conteúdo não incluído; verificar permissão antes de indexar |
| Consensus | API oficial v1 | Adaptador escrito; aguardando chave própria do serviço |

**A lista da Central Científica não significa que o conteúdo tenha sido indexado.**

## Como ativar de fato o índice privado D1
1. Criar o banco D1 na conta Cloudflare LifeMag IA (não utilizar banco do CSC).
2. Executar database/base-cientifica-d1.sql e database/migracao-fontes-adicionais.sql.
3. Vincular SCIENCE_DB ao Worker pelo wrangler.json com ID do D1 criado.
4. Obter cópia e autorização de uso de cada publicação oficial; conferir texto, tabelas, unidades, edição, advertências e capítulo.
5. Gerar manifesto JSON de trechos com revisor identificado e aprovação; script scripts/preparar-indice-cientifico.mjs produz SQL para carga. Importar no D1 e testar a recuperação real de trechos.
6. Verificar em /api/capabilities o binding e em /api/assist a citação de fontes C1, C2 etc.

Sem uma conexão autorizada à conta Cloudflare nesta conversa, o GitHub não pode preencher e ativar diretamente seu D1. Não declarar completada a indexação até consultar um trecho real e conferir sua edição.

## Como ativar Consensus
1. Acessar https://consensus.app/api-mcp e criar chave da API do proprietário.
2. Guardá-la exclusivamente em Cloudflare Workers > Settings > Variables and Secrets > CONSENSUS_API_KEY, nunca no repositório.
3. Confirmar quota mensal da conta e validar consulta solicitada explicitamente. O modo padrão não consome a quota.

## Uso clínico
- Fichas demonstrativas continuam em localStorage e NÃO devem conter pacientes reais até implantação de backend seguro e controles LGPD.
- Resumos e textos oficiais recuperados são elementos para análise, não confirmação automática de eficácia/dose de uma combinação personalizada.
- Formulação gerada deve permanecer rascunho para revisão, nunca receita emitida automaticamente sem validação.
- A quantidade para manipular e transposição automatizada ao editor ainda exigem implementação e validação, assim como revisão farmacotécnica de incompatibilidades.

## Documentação oficial verificada
- Farmacopeia Brasileira: https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/farmacopeia-brasileira
- Formulário Nacional: https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional
- Formulário de Fitoterápicos: https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-fitoterapico
- Conitec PCDT: https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas/pcdt
- Workers AI JSON Mode: https://developers.cloudflare.com/workers-ai/features/json-mode/
- Consensus API: https://docs.consensus.app/api-get-started
