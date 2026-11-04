-- Registro das fontes prioritárias para a futura indexação LifeMag IA.
-- NENHUM documento é liberado para a IA apenas por constar neste catálogo.
-- Requer schema database/base-cientifica-d1.sql aplicado antes.
INSERT OR IGNORE INTO scientific_sources(id,name,source_kind,official_url,retrieval_mode,status) VALUES
 ('anvisa-memento','Memento Fitoterápico da Farmacopeia Brasileira','compendio_oficial','https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-fitoterapico','curated_index','awaiting_review'),
 ('anvisa-homeopatico','Farmacopeia Homeopática Brasileira','compendio_oficial','https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia','curated_index','awaiting_review'),
 ('conitec-pcdt','Protocolos Clínicos e Diretrizes Terapêuticas — Conitec','diretriz','https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas/pcdt','curated_index','awaiting_review'),
 ('atividade-br','Guia de Atividade Física para a População Brasileira','diretriz','https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/guias-e-manuais/2021/guia-de-atividade-fisica-para-a-populacao-brasileira.pdf/view','curated_index','awaiting_review'),
 ('alimentar-br','Guia Alimentar para a População Brasileira','diretriz','https://www.gov.br/saude/pt-br/assuntos/saude-brasil/publicacoes-para-promocao-a-saude/guia_alimentar_populacao_brasileira_2ed.pdf/view','curated_index','awaiting_review'),
 ('who-activity','WHO guidelines on physical activity and sedentary behaviour','diretriz','https://www.who.int/publications/i/item/9789240015128','curated_index','awaiting_review'),
 ('acsm','American College of Sports Medicine — guidelines','diretriz','https://acsm.org','curated_index','awaiting_review'),
 ('consensus','Consensus Search API','literatura','https://consensus.app/home/api/','live_api','awaiting_review');
-- Atualiza catálogo antigo que apontava apenas à página genérica da Conitec.
UPDATE scientific_sources SET official_url='https://www.gov.br/conitec/pt-br/assuntos/avaliacao-de-tecnologias-em-saude/protocolos-clinicos-e-diretrizes-terapeuticas/pcdt'
 WHERE id='conitec';
