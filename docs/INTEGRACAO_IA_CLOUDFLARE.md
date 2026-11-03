
# LifeMag IA — ativação da IA no Cloudflare Workers (v0.3.0)

**Estado:** código do serviço e integração ao chat presentes no GitHub, ainda NÃO implantados no Cloudflare. O GitHub Pages permanece protótipo sem IA externa ativa.

## Arquitetura independente do CSC
- Interface: arquivos públicos do LifeMag IA, com Home v0.1.8 aprovada.
- Backend: worker/index.js, usando o MESMO domínio do site e da API.
- Segurança: Cloudflare Zero Trust Access no domínio completo e verificação independente de JWT RS256, emissão, audiência, validade e e-mail autorizado dentro do Worker.
- IA: Cloudflare Workers AI, modelo Meta Llama 3.3 70B fp8 fast, plano gratuito sujeito a cotas e disponibilidade.
- Ciência: consulta online ao Europe PMC (resumos publicados indexados no PubMed), com PMID, data, título e URL verificável.
- Anvisa: Farmacopeia Brasileira 8ª, Formulário Nacional 3ª e Formulário de Fitoterápicos 3ª somente como LINKS no catálogo. Monografias ainda não estão indexadas nem são consultadas automaticamente.
- Dados do paciente: API recebe apenas pergunta anônima digitada manualmente, nunca o cadastro/ficha clínica. NÃO usar dados clínicos reais nesta fase.

## Passo a passo de implantação (requer conta Cloudflare do proprietário)
1. Criar/acessar a conta Cloudflare gratuita, ativar Workers AI e configurar Zero Trust Access.
2. Em Access > Applications, proteger o endereço do Worker com uma política de acesso EXCLUSIVA para e-mails dos farmacêuticos autorizados. Proteger também os assets.
3. Anotar o domínio da equipe Cloudflare (exemplo: clinica.cloudflareaccess.com), o Application AUD tag e o e-mail autorizado.
4. No computador, com terminal autenticado na conta: executar os comandos abaixo, sem copiar senhas ou tokens para o código.
5. Conferir que acesso sem login ou com JWT adulterado é recusado com código HTTP 401; verificar acesso autorizado.
6. Na hospedagem privada, a Conversa Inteligente ativa IA apenas quando /api/capabilities retorna authenticated=true e ready=true.

Comandos:
- node scripts/build-worker.mjs
- npx wrangler login
- npx wrangler secret put ACCESS_TEAM_DOMAIN
- npx wrangler secret put ACCESS_AUD
- npx wrangler secret put ALLOWED_EMAILS
- npx wrangler deploy

A implantação não ocorre automaticamente a partir do GitHub Pages. O endereço Cloudflare será distinto até eventual migração aprovada.

## Validação antes de atendimento real
- Node 22: executar testes/testar_ia.js, testes/testar_clinica.js, testes/testar_logica.js e testes/testar_interface.js.
- Confirmar dados pessoais ausentes do payload, de logs e de respostas de erro; proteger sessões, dados em repouso e em trânsito.
- Implantar e auditar banco clínico protegido, autenticação completa, políticas de acesso por profissional, logs, backups e resposta a incidentes.
- Fazer revisão técnico-científica dos outputs (posologia, evidência, contraindicação, interação), auditoria clínica e documentação de LGPD.
- Não aprovar automaticamente formulários ou receitas derivados do texto da IA.
- Se PubMed/Europe PMC não retornar evidência acessível, o assistente não produz recomendação baseada em fonte não lida.

## Limitações atuais
- Serviço e autenticação ainda não implantados na conta Cloudflare.
- O modelo consulta resumos PubMed/Europe PMC somente após ativação; não lê o texto integral automaticamente.
- Os compêndios da Anvisa constam como referências oficiais, mas suas monografias ainda não estão disponíveis no motor de recuperação.
- Não há checagem automática validada de doses, incompatibilidades ou interações.
- Não existe banco clínico seguro em produção; consultas reais ainda não estão liberadas.

Documentação: https://developers.cloudflare.com/workers-ai/configuration/bindings/
Assets: https://developers.cloudflare.com/workers/static-assets/binding/
Europe PMC: https://dev.europepmc.org/RestfulWebService
Anvisa: https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional
