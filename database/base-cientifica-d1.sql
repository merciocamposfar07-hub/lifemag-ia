-- LifeMag IA — índice científico independente (Cloudflare D1 / SQLite FTS5).
-- NÃO inclui pacientes, prescrições ou dados pessoais.
-- SCHEMA apenas: NÃO conectado nem populado no Worker de produção.
-- Importar somente publicações oficiais cuja reprodução/uso sejam permitidos,
-- identificar edição, autoria, endereço original, licença e revisão profissional.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS scientific_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK(source_kind IN ('compendio_oficial','diretriz','literatura')),
  official_url TEXT NOT NULL,
  retrieval_mode TEXT NOT NULL CHECK(retrieval_mode IN ('curated_index','live_api')),
  status TEXT NOT NULL DEFAULT 'awaiting_review' CHECK(status IN ('awaiting_review','active','suspended')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scientific_documents (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES scientific_sources(id),
  title TEXT NOT NULL,
  edition TEXT NOT NULL,
  official_url TEXT NOT NULL,
  issued_at TEXT,
  verified_at TEXT,
  reviewed_by TEXT,
  copyright_or_license TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK(review_status IN ('draft','approved','withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scientific_docs_source
  ON scientific_documents(source_id,review_status);

CREATE TABLE IF NOT EXISTS scientific_passages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES scientific_documents(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  heading TEXT NOT NULL,
  body TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  UNIQUE(document_id,ordinal)
);

CREATE INDEX IF NOT EXISTS idx_science_passages_document
  ON scientific_passages(document_id,ordinal);

-- Índice textual: somente conteúdo que passou por ingestão e revisão.
CREATE VIRTUAL TABLE IF NOT EXISTS scientific_passages_fts
  USING fts5(passage_id UNINDEXED,body,tokenize='unicode61 remove_diacritics 2');

CREATE TRIGGER IF NOT EXISTS science_passages_ai AFTER INSERT ON scientific_passages BEGIN
  INSERT INTO scientific_passages_fts(passage_id,body) VALUES(new.id,new.body);
END;
CREATE TRIGGER IF NOT EXISTS science_passages_ad AFTER DELETE ON scientific_passages BEGIN
  DELETE FROM scientific_passages_fts WHERE passage_id=old.id;
END;
CREATE TRIGGER IF NOT EXISTS science_passages_au AFTER UPDATE ON scientific_passages BEGIN
  DELETE FROM scientific_passages_fts WHERE passage_id=old.id;
  INSERT INTO scientific_passages_fts(passage_id,body) VALUES(new.id,new.body);
END;

-- Estes são REGISTROS DE FONTE, não documentos indexados nem textos já lidos.
INSERT OR IGNORE INTO scientific_sources(id,name,source_kind,official_url,retrieval_mode,status) VALUES
 ('anvisa-fb','Farmacopeia Brasileira','compendio_oficial','https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/farmacopeia-brasileira','curated_index','awaiting_review'),
 ('anvisa-fn','Formulário Nacional','compendio_oficial','https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-nacional','curated_index','awaiting_review'),
 ('anvisa-fitoterapicos','Formulário de Fitoterápicos','compendio_oficial','https://www.gov.br/anvisa/pt-br/assuntos/farmacopeia/formulario-fitoterapico','curated_index','awaiting_review'),
 ('conitec','Conitec e PCDT','diretriz','https://www.gov.br/conitec/pt-br','curated_index','awaiting_review'),
 ('guia-alimentar','Guia Alimentar para a População Brasileira','diretriz','https://www.gov.br/saude/pt-br/assuntos/saude-brasil/eu-quero-me-alimentar-melhor','curated_index','awaiting_review'),
 ('who','Organização Mundial da Saúde','diretriz','https://www.who.int/publications','curated_index','awaiting_review'),
 ('pubmed','Artigos PubMed via Europe PMC','literatura','https://europepmc.org/','live_api','active');
