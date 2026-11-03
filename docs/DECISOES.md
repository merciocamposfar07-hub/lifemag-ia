# LifeMag IA — Decisões aprovadas (01/11/2026)
## Identidade
- Nome atual: **LifeMag IA — Prescrição Magistral Inteligente**. Nomes históricos: PrescriMag IA e StudioMagistral IA.
- Manter o **ícone oficial escuro azul profundo/turquesa com almofariz/pistilo e pixels**, e versão clara equivalente, sem substituições não aprovadas.
- Visual A (Home Clínico Premium) + B (Conversa Inteligente) + C (Studio Magistral/editor).
- Barra inferior aprovada: **Início, Acompanhar, IA (central), Ciência, Documentos**. Simulador continua no editor e na navegação lateral do desktop.


## Deliberação de 02/11/2026 — independência e cadastro
- **LifeMag IA é exclusivo para farmacêuticos**. Não misturar conceitos de operação, dados, cadastros, integrações, marcas ou usuários do Portal CSC.
- **Base começa vazia**; os pacientes são cadastrados manualmente pelo profissional durante cada atendimento. Não importar CSV nem pré-carregar nomes, moradores ou dados clínicos.
- Um paciente pode ter várias consultas; cada atendimento recebe avaliação clínica própria, com histórico preservado e sem sobrescrever os anteriores.
- Somente reutilizar padrões técnicos genéricos quando apropriados, mantendo infraestrutura, banco e permissões independentes.
- O fluxo público atual é **protótipo fictício**; uso de pacientes reais depende de autenticação, banco e proteção de dados verificados previamente.
- Não alterar o layout da Home v0.1.8 aprovado sem solicitação expressa.

## Fluxo clínico
1. Cadastrar paciente: nome, nascimento, telefone, peso, altura, alergias, medicamentos e condições relevantes.
2. Descrever a necessidade na conversa; futura IA propõe composição, dose, apresentação, posologia, horários, refeições e duração com evidências e revisão farmacêutica.
3. Para **cada substância**, mostrar AO PROFISSIONAL mecanismo, objetivo/sintoma clínico e papel **MOTOR** ou **COADJUVANTE**, com classificação dinâmica e justificativa científica. Não enviar essa análise no PDF.
4. Comparar versões adicionando, retirando ou ajustando substâncias; avaliar interações, redundâncias, riscos e benefício incremental **sem inventar percentual de eficácia**.
5. Emitir **um único receituário** com orientações de uso já incluídas, editável antes de imprimir/salvar PDF.
6. Arquivar atendimento por **nome completo + data do atendimento + telefone**. Guardar composição, PDF, acompanhamento.
7. Duração contada a partir da **data real de início** (editável). Avisar **três dias antes do término**, preferencialmente com alerta visual e sonoro; notificação remota ainda a desenvolver. Não renovar automaticamente.
8. Protocolo complementar opcional vinculado à receita: hábitos, caminhada/corrida/musculação, alimentação com referências. Campo de intensidade usar **“Intensidade progressiva, iniciando leve e evoluindo gradualmente conforme condicionamento e tolerância”**; não usar teste da fala.
9. Documentos: ficha clínica, receituário, declaração de comparecimento, declaração de serviço farmacêutico e protocolo complementar. Todos com logo no canto superior esquerdo, identificação da farmácia e endereço definidos pelo usuário, e identificação profissional; revisar campos obrigatórios e regras de emissão no desenvolvimento documental.

## Ciência e monitoramento
- PubMed/NCBI, Anvisa (Farmacopeia/Formulário Nacional), Conitec/PCDT;
- OMS/WHO, ACSM, Guia de Atividade Física para a População Brasileira;
- Guia Alimentar para a População Brasileira e evidências atuais quando pertinentes.
- Futuro monitoramento periódico de versões/data/fonte e alerta de mudanças relevantes; **não atualizar prescrições silenciosamente**.

## Limites atuais do protótipo
- Nada de IA científica real, validação de fórmula, controle de acesso, assinatura, push, backend, banco clínico protegido. Só dados fictícios.
- Não extrapolar autorização clínica de emissão de receitas. Documentos gerados são **rascunhos sem assinatura**.

## Histórico de erros e correções
- v0.1.0: ZIP e HTML local no iPhone falharam no visualizador. Correção: hospedar arquivos web em repositório separado no GitHub, preparar Pages.
- Configuração ShipStatic gerou autenticação desnecessária. Decisão: não utilizar ShipStatic.
- Antes havia botões inferiores redundantes; design aprovado exige destinos distintos.
- Versões anteriores de ícones incorretas; somente a arte oficial aprovada.
