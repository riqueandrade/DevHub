-- Limpa todas as tabelas existentes em ordem reversa para evitar problemas com chaves estrangeiras
TRUNCATE TABLE certificates CASCADE;
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE course_ratings CASCADE;
TRUNCATE TABLE lesson_progress CASCADE;
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE lessons CASCADE;
TRUNCATE TABLE modules CASCADE;
TRUNCATE TABLE courses CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE users CASCADE;

-- Criação dos tipos ENUM
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS course_level CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS lesson_status CASCADE;
CREATE TYPE user_role AS ENUM ('aluno', 'instrutor', 'admin');
CREATE TYPE user_status AS ENUM ('ativo', 'inativo');
CREATE TYPE course_level AS ENUM ('iniciante', 'intermediario', 'avancado');
CREATE TYPE course_status AS ENUM ('rascunho', 'publicado', 'arquivado');
CREATE TYPE content_type AS ENUM (
    'video',
    'texto',
    'quiz',
    'slides',
    'documento',
    'pdf'
);
CREATE TYPE enrollment_status AS ENUM (
    'pendente',
    'em_andamento',
    'concluido',
    'cancelado'
);
CREATE TYPE lesson_status AS ENUM ('nao_iniciado', 'em_andamento', 'concluido');
-- Drop das tabelas existentes em ordem reversa para evitar problemas com chaves estrangeiras
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS course_ratings CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role user_role DEFAULT 'aluno',
    google_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(255) DEFAULT '/images/default-avatar.png',
    bio TEXT,
    status user_status DEFAULT 'ativo',
    reset_token VARCHAR(255),
    -- Configurações de notificações
    email_notifications BOOLEAN DEFAULT TRUE,
    course_updates BOOLEAN DEFAULT TRUE,
    promotional_emails BOOLEAN DEFAULT FALSE,
    -- Configurações de privacidade
    profile_visibility BOOLEAN DEFAULT TRUE,
    show_progress BOOLEAN DEFAULT TRUE,
    show_certificates BOOLEAN DEFAULT TRUE,
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de categorias de cursos
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de cursos
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    instructor_id INTEGER REFERENCES users(id),
    thumbnail VARCHAR(255),
    price DECIMAL(10, 2) DEFAULT 0.00,
    duration INTEGER,
    level course_level,
    status course_status DEFAULT 'rascunho',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, instructor_id)
);
-- Tabela de módulos dos cursos
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, order_number)
);
-- Tabela de aulas
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type content_type,
    content_url TEXT,
    duration INTEGER,
    order_number INTEGER NOT NULL,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, order_number)
);
-- Tabela de matrículas
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    status enrollment_status DEFAULT 'pendente',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);
-- Tabela de progresso das aulas
CREATE TABLE IF NOT EXISTS lesson_progress (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    status lesson_status DEFAULT 'nao_iniciado',
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, lesson_id)
);
-- Tabela de avaliações dos cursos
CREATE TABLE IF NOT EXISTS course_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);
-- Tabela de atividades dos usuários
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de certificados
CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    preview_url VARCHAR(255) NOT NULL,
    pdf_url VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id)
);
-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE
UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE
UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE
UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE
UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE
UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE
UPDATE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_ratings_updated_at BEFORE
UPDATE ON course_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE
UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Dados iniciais
-- Inserir usuário admin padrão
INSERT INTO users (name, email, role, status, password)
VALUES (
        'Administrador',
        'admin@devhub.com',
        'admin',
        'ativo',
        '$2b$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WrxJx/FeC9.gOMxlrkla' -- senha: admin123
    ) ON CONFLICT (email) DO
UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status;