-- ============================================================
-- init.sql
-- PostgreSQL 초기화 스크립트
-- 컨테이너 최초 실행 시 자동으로 실행됩니다.
-- ============================================================

-- -------------------------
-- 1. users
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100),
    birth_date    DATE,
    gender        CHAR(1),
    phone         VARCHAR(20),
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -------------------------
-- 2. health_profiles
-- -------------------------
CREATE TABLE IF NOT EXISTS health_profiles (
    id                 SERIAL PRIMARY KEY,
    user_id            INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    height             VARCHAR(10),
    weight             VARCHAR(10),
    blood_type         VARCHAR(5),
    smoking_status     VARCHAR(20),
    alcohol_frequency  VARCHAR(20),
    exercise_frequency VARCHAR(20),
    created_at         TIMESTAMP DEFAULT NOW(),
    updated_at         TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 3. chronic_conditions
-- -------------------------
CREATE TABLE IF NOT EXISTS chronic_conditions (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    condition_type   VARCHAR(50) NOT NULL,
    diagnosed_date   DATE,
    severity         VARCHAR(20),
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chronic_conditions_user_id ON chronic_conditions(user_id);

-- -------------------------
-- 4. medications
-- -------------------------
CREATE TABLE IF NOT EXISTS medications (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_name     VARCHAR(200) NOT NULL,
    standardized_name   VARCHAR(200),
    ingredient          VARCHAR(200),
    dosage              VARCHAR(50) NOT NULL,
    frequency           INTEGER NOT NULL,
    timing              JSONB NOT NULL,
    medication_type     VARCHAR(200) NOT NULL,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medications_user_id        ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_standardized   ON medications(standardized_name);

-- -------------------------
-- 5. allergies
-- -------------------------
CREATE TABLE IF NOT EXISTS allergies (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allergen_name        VARCHAR(200) NOT NULL,
    allergen_type        VARCHAR(50),
    severity             VARCHAR(20),
    reaction_description TEXT,
    created_at           TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 6. documents
-- -------------------------
CREATE TABLE IF NOT EXISTS documents (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_size     INTEGER,
    mime_type     VARCHAR(100),
    uploaded_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- -------------------------
-- 7. ocr_results
-- -------------------------
CREATE TABLE IF NOT EXISTS ocr_results (
    id          SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    raw_text    TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 8. guide_results
-- -------------------------
CREATE TABLE IF NOT EXISTS guide_results (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ocr_result_id        INTEGER NOT NULL REFERENCES ocr_results(id),
    status               VARCHAR(20) NOT NULL DEFAULT 'processing',
    error_message        TEXT,
    overall_safety_score INTEGER,
    summary              TEXT,
    medication_guide     TEXT,
    lifestyle_guide      TEXT,
    warning_signs        TEXT,
    patient_name         VARCHAR(100),
    birth_date           VARCHAR(20),
    age                  INTEGER,
    gender               VARCHAR(10),
    diagnosis            VARCHAR(200),
    hospital_name        VARCHAR(200),
    doctor_name          VARCHAR(100),
    visit_date           VARCHAR(20),
    generated_at         TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 9. drug_interactions
-- -------------------------
CREATE TABLE IF NOT EXISTS drug_interactions (
    id               SERIAL PRIMARY KEY,
    guide_result_id  INTEGER NOT NULL REFERENCES guide_results(id) ON DELETE CASCADE,
    medication_a     VARCHAR(200),
    medication_b     VARCHAR(200),
    interaction_type VARCHAR(100),
    severity         VARCHAR(20),
    mechanism        TEXT,
    recommendation   TEXT,
    created_at       TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 10. medication_schedules
-- -------------------------
CREATE TABLE IF NOT EXISTS medication_schedules (
    id              SERIAL PRIMARY KEY,
    guide_result_id INTEGER NOT NULL REFERENCES guide_results(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_date   JSONB NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 11. exercise_library
-- -------------------------
CREATE TABLE IF NOT EXISTS exercise_library (
    exercise_id      VARCHAR(50) PRIMARY KEY,
    exercise_name    VARCHAR(100) NOT NULL,
    category         VARCHAR(50),
    difficulty_level VARCHAR(20),
    instructions     TEXT,
    contraindications TEXT[],
    video_url        VARCHAR(1000),
    thumbnail_url    VARCHAR(1000),
    tags             TEXT[],
    created_at       TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 12. rehab_plans
-- -------------------------
CREATE TABLE IF NOT EXISTS rehab_plans (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guide_result_id INTEGER NOT NULL REFERENCES guide_results(id) ON DELETE CASCADE,
    target_area     VARCHAR(50),
    duration_weeks  INTEGER,
    precautions     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rehab_plans_user_active ON rehab_plans(user_id, is_active);

-- -------------------------
-- 13. rehab_exercises
-- -------------------------
CREATE TABLE IF NOT EXISTS rehab_exercises (
    id               SERIAL PRIMARY KEY,
    rehab_plan_id    INTEGER NOT NULL REFERENCES rehab_plans(id) ON DELETE CASCADE,
    exercise_id      VARCHAR(50) NOT NULL REFERENCES exercise_library(exercise_id),
    week_number      INTEGER,
    sequence_order   INTEGER,
    sets             INTEGER,
    reps             INTEGER,
    duration_seconds INTEGER,
    frequency_per_day INTEGER,
    special_notes    TEXT,
    created_at       TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 14. exercise_completions
-- -------------------------
CREATE TABLE IF NOT EXISTS exercise_completions (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rehab_exercise_id INTEGER NOT NULL REFERENCES rehab_exercises(id) ON DELETE CASCADE,
    rehab_plan_id    INTEGER NOT NULL REFERENCES rehab_plans(id) ON DELETE CASCADE,
    completed_at     TIMESTAMP DEFAULT NOW(),
    completed_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    actual_sets      INTEGER,
    actual_reps      INTEGER,
    pain_level       INTEGER,
    notes            TEXT
);

-- -------------------------
-- 15. notifications
-- -------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title             VARCHAR(200),
    message           TEXT,
    related_id        INTEGER,
    is_read           BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW(),
    read_at           TIMESTAMP
);

-- -------------------------
-- 16. chat_sessions
-- -------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    related_guide_id INTEGER REFERENCES guide_results(id) ON DELETE CASCADE,
    context_type     VARCHAR(20),
    context_id       INTEGER,
    session_status   VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    started_at       TIMESTAMP DEFAULT NOW(),
    ended_at         TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_status ON chat_sessions(user_id, session_status);

-- -------------------------
-- 17. chat_messages
-- -------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id         SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- -------------------------
-- 18. feedbacks
-- -------------------------
CREATE TABLE IF NOT EXISTS feedbacks (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id   INTEGER NOT NULL,
    rating      INTEGER,
    latency_ms  INTEGER,
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);
