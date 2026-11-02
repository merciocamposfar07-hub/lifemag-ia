# LifeMag IA — Primeira versão funcional (protótipo v0.1.0)

**Data:** 01/11/2026  
**Público:** farmacêuticos autônomos  
**Status:** protótipo executável sem backend clínico nem IA conectada.

## O que já funciona nesta entrega
- Identidade **LifeMag IA — Prescrição Magistral Inteligente** e ícone escuro oficial aprovado.
- Interface A+B+C adaptativa para celular/computador; quatro ferramentas inferiores **sem repetir** os quatro cartões da Home.
- Cadastro fictício de pacientes com nome, nascimento, telefone, endereço e medidas; histórico ligado aos atendimentos.
- Criar atendimento e registrar observações na interface de conversa (sem geração automática por IA nesta fase).
- Editor da formulação: adicionar/remover substâncias, doses, unidades, horário, via, apresentação, posologia, duração, refeições e quantidade.
- Classificação manual de **MOTOR / COADJUVANTE**, alvo clínico e evidências, com separação de dados internos do receituário.
- Guardar revisões do editor e visualizar diferenças entre duas versões de ingredientes/doses.
- Calcular prazo previsto de tratamento a partir do início efetivo e alerta interno **três dias antes do fim**.
- Biblioteca de fontes (PubMed, Anvisa, Conitec, OMS, ACSM, dois guias do Ministério da Saúde), sem alegar sincronização já feita.
- Modelos demonstrativos para impressão/Salvar como PDF: **ficha clínica, receituário, declaração de comparecimento, declaração de serviço farmacêutico, protocolo complementar**.
- Marca, farmácia, endereço e dados profissionais editáveis no módulo de identificação.

## Como abrir

1. Descompacte o ZIP mantendo a estrutura de pastas.
2. No computador, na pasta `LifeMag_IA_v0.1.0`, execute **`python -m http.server 8000`** (ou `py -m http.server 8000` no Windows com Python instalado).
3. Abra `http://localhost:8000` no navegador. Se o navegador permitir, abrir diretamente `index.html` também pode funcionar, mas o servidor local é o modo recomendado.
4. Para salvar o receituário como PDF: abra um atendimento com fórmula completa, escolha **Receituário > Abrir modelo**, depois **Imprimir / Salvar como PDF** no navegador.

Este pacote **não está publicado na internet**. Para acesso a partir do celular fora do computador, será necessária uma hospedagem segura, a ser definida em fase posterior.

## Atenção — uso apenas demonstrativo

**NÃO UTILIZAR DADOS DE PACIENTES REAIS.** O protótipo salva registros diretamente no `localStorage` do navegador, sem autenticação, banco protegido, criptografia adequada nem backup. Os documentos contêm a marca **RASCUNHO NÃO ASSINADO**. Não são receitas válidas ou comprovantes clínicos. O usuário pode limpar os dados de demonstração em **Configurações**.

A ferramenta ainda **NÃO** possui IA geradora, checagem real de interações, base terapêutica validada, pesquisa científica contínua, assinatura digital, notificações push ou acesso seguro multiusuário. Não inventa recomendações ou evidências.

## Organização do código

- `index.html`: página de entrada e elementos de impressão.
- `src/style.css`: tema oficial, componentes, responsividade e estilo A4 para impressão.
- `src/store.js`: estado inicial, armazenamento local de demonstração e cálculo de datas.
- `src/app.js`: rotas, formulários, editor, simulação de versões, modelos documentais.
- `assets/`: ícones oficiais aprovados (arte raster original, sem substituição).
- `docs/`: requisitos consolidados, arquitetura, diagramas, decisões, evolução, testes e pendências.
- `testes/testar_logica.js`: testes automatizados que executam em Node.js, sem navegador.
- `historico/`: cópia de documentação anterior, para auditoria da evolução do projeto.

## Testes

Se tiver Node.js instalado, execute `node testes/testar_logica.js`. Os testes abrangem 10 verificações automáticas de lógica e estrutura. **A automação visual de navegador não foi concluída neste ambiente**, como registrado no diário de desenvolvimento; a UI exige teste manual posterior em iOS, Android e desktop.

## Evolução prevista

Próxima fase: autenticação, API segura, banco clínico protegido, modelos documentais completos e validados, integração de pesquisa científica e motor de IA com revisão humana. Emissões definitivas dependem das verificações profissionais e sanitárias pertinentes.
