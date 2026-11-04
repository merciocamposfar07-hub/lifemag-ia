# LifeMag IA — cadastro, formulação anônima e exames (v0.4.3)

## Fluxo clínico aprovado
1. Abrir **Conversa Inteligente** sem paciente cadastrado.
2. Informar objetivo clínico, sintomas, idade, sexo, peso/altura quando relevantes, medicamentos, alergias e condições clínicas. Não inserir dados identificáveis enquanto o backend protegido não estiver pronto.
3. Receber proposta estruturada com fontes e doses estudadas ou a relação objetiva do que ainda falta, sem forçar uma formulação insegura.
4. Discutir e ajustar ingredientes, doses, posologia, horários, alimentação e duração.
5. Selecionar **Salvar proposta como rascunho anônimo**, identificado por `Caso 01`, `Caso 02`, etc. O protótipo armazena **somente a composição estruturada e referências bibliográficas**, sem nomes de pacientes, arquivos, exames ou transcrição integral da conversa.
6. Depois, cadastrar o paciente (somente fictício enquanto o armazenamento clínico permanecer em localStorage), escolher o rascunho em **Minhas fórmulas** e tocar em **Vincular e revisar**. O Studio Magistral importa a proposta como **pendente de revisão**, sem emitir receita automaticamente.
7. O histórico de formulações e as revisões posteriores permanecem vinculados ao atendimento. A assinatura real será realizada separadamente pelo profissional.

## Cadastro
- O cadastro selecionado já era editável; o acesso à edição agora está explicitamente identificado na lista.
- O botão **Excluir cadastro** confirma a exclusão e informa a quantidade de atendimentos vinculados; elimina o paciente fictício e seus atendimentos locais. Rascunhos anônimos independentes são preservados e podem ser vinculados novamente. Esta exclusão é local ao protótipo, não é ainda mecanismo de exclusão do futuro backend clínico.
- O fluxo definitivo deverá permitir edição, exclusão lógica ou definitiva segundo a política de retenção, controle de versões e auditoria de acesso.

## Exames
- No cadastro há seletores opcionais **Biblioteca / arquivos** (PDF, JPEG, PNG, HEIC) e **Tirar foto** (`capture="environment"` no iPhone).
- **Neste protótipo, a pré-seleção é temporária. Não salva, não envia nem associa permanentemente o conteúdo dos exames.** A interface deixa esse limite visível. Ausência de arquivo não bloqueia cadastro nem consulta.
- O vínculo definitivo exige módulo de armazenamento clínico protegido, separado do banco científico. A arquitetura prevista é armazenamento privado de arquivos, vinculado a ID de paciente e atendimento, autenticação Cloudflare Access, controle de acesso por profissional, registro de ações e política de exclusão/retenção. Validar tipo real do arquivo, tamanho, integridade e prevenir arquivos ativos perigosos; não deixar exames em repositório público nem em `localStorage`.
- Análise pela IA só poderá usar exames com ação explícita do profissional, tratamento adequado de dados pessoais e verificação da origem/qualidade. Não enviar imagens com nome, CPF ou outros identificadores para fontes públicas de pesquisa científica.

## Segurança e LGPD
- Identidade autorizada no Zero Trust é necessária, mas não basta para comprovar segurança completa do prontuário.
- Antes de incluir **pacientes reais**: implantar backend para registros e anexos privados, gestão de acesso, criptografia, logs de auditoria, backup/restauração, minimização, controle de retenção/exclusão, transparência/hipótese legal e análise de riscos LGPD.
- O módulo de documentos científicos SQLite não é banco de pacientes.
- O modo anônimo permite apenas perguntas clínicas desidentificadas; mesmo dados indiretos podem reidentificar pessoas se excessivamente específicos.

## Correção visual
- A caixa de digitação da IA usa `CSS grid` responsivo, com textarea horizontal de largura flexível e botão de largura fixa. A opção Consensus fica em uma linha própria, sem comprimir o textarea. A Home não foi alterada.
