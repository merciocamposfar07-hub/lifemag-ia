# LifeMag IA — Fluxograma funcional (protótipo + módulos planejados)

```mermaid
flowchart TD
  A[Início A - Clínico Premium] --> B[Selecionar ou cadastrar paciente]
  B --> C[Registrar atendimento e data/telefone]
  C --> C1[Ficha manual de avaliação clínica do atendimento]
  C1 --> D[Conversa Inteligente B]
  D --> E{IA clínica disponível?}
  E -->|Ainda não| F[Registrar solicitação em texto]
  E -->|Futuro| G[Analisar evidências, contraindicações e interações]
  G --> H[Propor fórmula completa]
  F --> I[Editor Studio Magistral C]
  H --> I
  I --> J[Classificar MOTOR/COADJUVANTE e justificar internamente]
  J --> K[Editar substâncias e doses]
  K --> L[Simulador / comparar revisões]
  L --> M[Revisão humana]
  M --> N[Receituário PDF sem análise interna]
  N --> O[Histórico por paciente e atendimento com avaliação preservada]
  O --> P[Início real + duração]
  P --> Q[Alerta 3 dias antes do término]
  Q --> R[Contato e reavaliação]
  I --> S[Protocolo complementar opcional]
  S --> N
  I --> T[Documentos clínicos: ficha, declarações]
  U[Fontes: PubMed, Anvisa, Conitec, OMS, ACSM, guias] --> G
```

**Legenda de status (v0.2.0):** Home aprovada, cadastro manual sem pré-carga, avaliação própria por atendimento, conversa de texto, editor, simulação básica, documentos demonstrativos e cálculo interno de alerta estão programados. IA científica, notificações externas, banco seguro, atualização automática e assinatura são módulos **planejados**.

**Isolamento:** o Portal CSC não participa de nenhum bloco deste fluxo e não fornece dados para o LifeMag IA. O banco PostgreSQL em `database/schema-inicial.sql` ainda é somente projeto, sem conexão real.

## Fluxo priorizado na versão 0.6.1

```mermaid
flowchart TD
  A[Entrar com Cloudflare Access] --> B[Conversa Inteligente]
  B --> C{Paciente cadastrado?}
  C -->|Não| D[Pesquisar caso anônimo]
  C -->|Sim| E[Atendimento no SQLite privado]
  D --> F[Pesquisar PubMed]
  E --> F
  F --> G{Referências suficientes?}
  G -->|Não, com chave e orçamento| H[Complementar com Consensus]
  G -->|Sim| I[Propor rascunho]
  H --> I
  I --> J{Dados clínicos e dose fundamentada?}
  J -->|Não| K[Solicitar dados ou não liberar]
  J -->|Sim| L[Studio Magistral: revisão e edição]
  L --> M[Conferência farmacêutica]
  M --> N[Documentação sem assinatura automática]
  E --> O[Persistência protegida e histórico]
```

**Importante:** a infraestrutura está publicada, mas nenhuma tela de sucesso ou resultado local de teste equivale a homologação com pacientes reais. Esta deve ser verificada no Worker com sessão profissional.
