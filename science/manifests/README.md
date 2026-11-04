# Manifestos científicos LifeMag IA

Esta pasta recebe arquivos JSON de trechos de publicações oficiais **depois de revisão documental e farmacêutica**.

O indexador `scripts/preparar-indice-cientifico.mjs` exige: `id`, `sourceId` (do catálogo D1), `title`, `edition`, `officialUrl`, `license`, `reviewedBy`, `verifiedAt`, `reviewStatus: "approved"`, e `sections` (cada uma com `heading` e `body`).

A etapa de importação só ocorrerá mediante fluxo explícito `Importar documento científico revisado`, depois de D1 criado e vinculado.

**Não adicionar textos de prontuários ou dados pessoais a esta pasta pública.**

**Estado inicial:** nenhum documento clínico/farmacopéico foi conferido nem aprovado como trecho pesquisável. O catálogo sozinho não constitui base de evidências.
