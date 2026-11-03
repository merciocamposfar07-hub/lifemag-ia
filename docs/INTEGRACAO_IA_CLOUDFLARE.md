# LifeMag IA — Cloudflare Access + IA (v0.3.1)

## Configuração atual (03/11/2026)
- O projeto `lifemag-ia-clinico` já foi implantado na conta Cloudflare do proprietário.
- Foi habilitada no dashboard a proteção **All traffic**, com política específica **LifeMag IA – Acesso Farmacêutico**, permitindo um único endereço de e-mail (validado em captura do painel).
- O login por One-time PIN funcionou; o erro posterior de acesso era causado pelo código antigo que exigia `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` e `ALLOWED_EMAILS`.
- **Correção versionada no GitHub:** o Worker passa a consumir `ctx.access` e `getIdentity()`, dados de autenticação produzidos pela própria plataforma após a aplicação da política. Não precisa cadastrar manualmente essas três variáveis.
- A Cloudflare documenta limitação importante: **Static Assets** utiliza roteador que não transmite `ctx.access`. Para preservar a segurança, o script `scripts/build-worker.mjs` empacota os cinco arquivos permitidos da interface no próprio Worker (gerando `worker/assets.generated.mjs`), e `wrangler.json` deixou de declarar `assets`. Assim, toda requisição à página e à API é validada no Worker.
- Sem `ctx.access`, com audience ausente ou identidade inválida, o Worker responde 401. Cabeçalhos JWT inseridos pelo cliente não autorizam acesso sem a identidade do runtime. Uma lista `ALLOWED_EMAILS` continua opcional como camada adicional; a autorização principal é a política do Cloudflare Access.

## Implantação automática
O proprietário conectou o repositório `merciocamposfar07-hub/lifemag-ia` diretamente ao Workers & Pages, com:
- Build command: `node scripts/build-worker.mjs`
- Deploy command: `npx wrangler deploy`
- Worker name: `lifemag-ia-clinico`

A atualização no GitHub **deve** disparar um novo build conforme a integração. Precisamos confirmar no painel **Deployments** que a última revisão foi publicada com sucesso. Não há conexão Cloudflare direta para conferir a implantação por esta conversa.

## Verificação após atualização
1. Na Cloudflare, confirmar versão nova em Deployments. Não alterar os serviços do Portal CSC.
2. Entrar no endereço protegido `https://lifemag-ia-clinico.merciocamposfar07.workers.dev` com e-mail autorizado e código One-time PIN.
3. A interface do LifeMag IA deve abrir. No domínio Cloudflare protegido, a Conversa Inteligente verifica `GET /api/capabilities`.
4. Em caso de erro, conferir Deployments/Build logs e AI binding. Não desabilitar Access para contornar problemas.
5. Executar `node scripts/build-worker.mjs` antes de `node testes/testar_ia.js`; demais testes: testar_logica.js, testar_interface.js, testar_clinica.js.

## Limitações para uso clínico
- O login pode ficar funcional antes de validar o serviço IA e a pesquisa científica; não afirmar que tudo já funciona sem verificação de execução.
- O backend não recebe cadastro/ficha clínica; só perguntas anônimas. O cadastro demonstrativo ainda está em localStorage, sem banco clínico protegido; **não usar dados reais de pacientes**.
- A consulta de resumos PubMed pelo Europe PMC não substitui texto integral, avaliação de qualidade científica ou revisão profissional.
- Farmacopeia Brasileira e formulários Anvisa têm apenas links oficiais; suas monografias ainda não estão indexadas nem consultadas automaticamente.
- Sem integração Consensus nesta etapa.
- Sem checagem clínica automatizada de doses, incompatibilidades ou interações validada para prescrição real.
- O LifeMag IA permanece independente do Portal CSC e preserva a Home v0.1.8.

## Documentação Cloudflare (fonte da mudança)
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/#read-authenticated-user-identity-with-ctxaccess
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/#ctxaccess-limitations
