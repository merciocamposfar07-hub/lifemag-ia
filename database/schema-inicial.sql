-- LifeMag IA — esquema de referência PostgreSQL v0.2.0 (NÃO IMPLANTADO).
-- Estrutura independente: não utilizar tabelas, credenciais ou dados do Portal CSC.
-- Exige autenticação em backend, TLS, gerenciamento de segredos, backups,
-- controle de retenção, auditoria e testes de autorização ANTES de uso clínico.
-- A aplicação atual do GitHub Pages não se conecta a este banco.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS lifemag;

CREATE TABLE lifemag.pharmacists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_subject text NOT NULL UNIQUE, -- ID emitido pelo provedor de autenticação
  professional_name text NOT NULL,
  crf text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lifemag.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacist_id uuid NOT NULL REFERENCES lifemag.pharmacists(id),
  full_name text NOT NULL CHECK (length(btrim(full_name))>0),
  phone text NOT NULL,
  date_of_birth date,
  address text,
  weight_kg numeric(6,2),
  height_cm numeric(6,2),
  general_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id,pharmacist_id)
);
CREATE INDEX idx_lifemag_patients_owner_name ON lifemag.patients(pharmacist_id,full_name);

CREATE TABLE lifemag.encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacist_id uuid NOT NULL REFERENCES lifemag.pharmacists(id),
  patient_id uuid NOT NULL,
  visit_date date NOT NULL,
  assessment jsonb NOT NULL DEFAULT '{}'::jsonb,
  assessment_updated_at timestamptz,
  status text NOT NULL DEFAULT 'em acompanhamento',
  duration_days integer CHECK (duration_days BETWEEN 1 AND 3650),
  start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (patient_id,pharmacist_id) REFERENCES lifemag.patients(id,pharmacist_id),
  UNIQUE (id,pharmacist_id)
);
CREATE INDEX idx_lifemag_encounters_patient ON lifemag.encounters(pharmacist_id,patient_id,visit_date DESC);

CREATE TABLE lifemag.formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacist_id uuid NOT NULL REFERENCES lifemag.pharmacists(id),
  encounter_id uuid NOT NULL,
  formula_name text NOT NULL,
  presentation text,
  route text,
  quantity text,
  posology text,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by uuid REFERENCES lifemag.pharmacists(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (encounter_id,pharmacist_id) REFERENCES lifemag.encounters(id,pharmacist_id)
);
CREATE INDEX idx_lifemag_formulas_encounter ON lifemag.formulas(pharmacist_id,encounter_id);

CREATE TABLE lifemag.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pharmacist_id uuid NOT NULL REFERENCES lifemag.pharmacists(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  -- Nunca armazenar prontuário, PIN, tokens ou conteúdo de IA em logs de auditoria.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_lifemag_audit_owner_date ON lifemag.audit_events(pharmacist_id,occurred_at DESC);

-- Defesa em profundidade: a API segura deve validar identidade e propriedade
-- antes de executar transações. O cliente móvel NUNCA define este parâmetro.
-- Usar SET LOCAL lifemag.pharmacist_id em transação autenticada, com papel SQL
-- sem BYPASSRLS e sem propriedade das tabelas. Não expor conexão SQL ao browser.
ALTER TABLE lifemag.pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifemag.pharmacists FORCE ROW LEVEL SECURITY;
ALTER TABLE lifemag.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifemag.patients FORCE ROW LEVEL SECURITY;
ALTER TABLE lifemag.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifemag.encounters FORCE ROW LEVEL SECURITY;
ALTER TABLE lifemag.formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifemag.formulas FORCE ROW LEVEL SECURITY;
ALTER TABLE lifemag.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifemag.audit_events FORCE ROW LEVEL SECURITY;

CREATE POLICY pharmacist_owns_profile ON lifemag.pharmacists
  USING (id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid)
  WITH CHECK (id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid);
CREATE POLICY pharmacist_owns_patients ON lifemag.patients
  USING (pharmacist_id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid)
  WITH CHECK (pharmacist_id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid);
CREATE POLICY pharmacist_owns_encounters ON lifemag.encounters
  USING (pharmacist_id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid)
  WITH CHECK (pharmacist_id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid);
CREATE POLICY pharmacist_owns_formulas ON lifemag.formulas
  USING (pharmacist_id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid)
  WITH CHECK (pharmacist_id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid);
CREATE POLICY pharmacist_reads_audit ON lifemag.audit_events FOR SELECT
  USING (pharmacist_id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid);
CREATE POLICY pharmacist_appends_audit ON lifemag.audit_events FOR INSERT
  WITH CHECK (pharmacist_id = nullif(current_setting('lifemag.pharmacist_id',true),'')::uuid);

-- AVISO: estas políticas são ponto de partida, não auditoria de segurança.
-- Conceder apenas GRANTs mínimos ao papel da API, nunca ao usuário anônimo.
-- Requer testes de acesso cruzado, rotina de backup/restauração e resposta a incidentes.
