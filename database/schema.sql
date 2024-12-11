-- Excluir o banco de dados se ele já existir
DROP DATABASE IF EXISTS devhub;
-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS devhub;
USE devhub;
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    role ENUM('aluno', 'instrutor', 'admin') DEFAULT 'aluno',
    google_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(255) DEFAULT '/images/default-avatar.png',
    bio TEXT,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    -- Configurações de notificações
    email_notifications BOOLEAN DEFAULT TRUE,
    course_updates BOOLEAN DEFAULT TRUE,
    promotional_emails BOOLEAN DEFAULT FALSE,
    -- Configurações de privacidade
    profile_visibility BOOLEAN DEFAULT TRUE,
    show_progress BOOLEAN DEFAULT TRUE,
    show_certificates BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabela de categorias de cursos
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Tabela de cursos
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    instructor_id INT,
    thumbnail VARCHAR(255),
    price DECIMAL(10, 2) DEFAULT 0.00,
    duration INT COMMENT 'Duração em minutos',
    level ENUM('iniciante', 'intermediario', 'avancado'),
    status ENUM('rascunho', 'publicado', 'arquivado') DEFAULT 'rascunho',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);
-- Tabela de módulos dos cursos
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
-- Tabela de aulas
CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type ENUM('video', 'texto', 'quiz', 'slides', 'documento', 'pdf'),
    content_url TEXT,
    duration INT COMMENT 'Duração em minutos',
    order_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id)
);
-- Tabela de matrículas
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    status ENUM(
        'pendente',
        'em_andamento',
        'concluido',
        'cancelado'
    ) DEFAULT 'pendente',
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
-- Tabela de progresso das aulas
CREATE TABLE IF NOT EXISTS lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    lesson_id INT NOT NULL,
    status ENUM('nao_iniciado', 'em_andamento', 'concluido') DEFAULT 'nao_iniciado',
    start_date TIMESTAMP NULL,
    completion_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
-- Tabela de avaliações dos cursos
CREATE TABLE IF NOT EXISTS course_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    rating INT NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
-- Tabela de atividades dos usuários
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- Tabela de certificados
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    preview_url VARCHAR(255) NOT NULL,
    pdf_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);