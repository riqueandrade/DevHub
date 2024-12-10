USE devhub;

-- Inserindo usuários (senha: 123456)
INSERT INTO users (name, email, password, type) VALUES
('Admin', 'admin@devhub.com', '$2a$08$PQqxj5eCQGrRxQdPGHJmGOYu0Aq9uR5UYSrJUANQGcP0IG7HD6QZy', 'admin'),
('João Silva', 'joao@email.com', '$2a$08$PQqxj5eCQGrRxQdPGHJmGOYu0Aq9uR5UYSrJUANQGcP0IG7HD6QZy', 'user'),
('Maria Santos', 'maria@email.com', '$2a$08$PQqxj5eCQGrRxQdPGHJmGOYu0Aq9uR5UYSrJUANQGcP0IG7HD6QZy', 'user');

-- Inserindo categorias
INSERT INTO categories (name, description, icon) VALUES
('Frontend', 'Desenvolvimento de interfaces web', 'bi-window'),
('Backend', 'Desenvolvimento de servidores e APIs', 'bi-server'),
('Mobile', 'Desenvolvimento de aplicativos móveis', 'bi-phone'),
('DevOps', 'Práticas de integração e deploy', 'bi-gear'),
('Database', 'Banco de dados e modelagem', 'bi-database'),
('UI/UX', 'Design de interfaces e experiência', 'bi-palette');

-- Inserindo cursos
INSERT INTO courses (title, description, category_id, instructor_id, price, duration, level, status) VALUES
('HTML5 e CSS3 Fundamentos', 'Aprenda os fundamentos do desenvolvimento web moderno', 1, 1, 0.00, 300, 'iniciante', 'publicado'),
('JavaScript Moderno', 'Do básico ao avançado com ES6+', 1, 1, 97.00, 480, 'intermediario', 'publicado'),
('Node.js Completo', 'Desenvolvimento backend com Node.js', 2, 1, 127.00, 600, 'intermediario', 'publicado'),
('React Native do Zero', 'Crie aplicativos móveis multiplataforma', 3, 1, 147.00, 720, 'avancado', 'publicado');

-- Inserindo módulos para o curso de HTML5 e CSS3
INSERT INTO modules (course_id, title, description, order_number) VALUES
(1, 'Introdução ao HTML', 'Conceitos básicos de HTML', 1),
(1, 'Estilização com CSS', 'Fundamentos de CSS', 2),
(1, 'Layout Responsivo', 'Media Queries e Flexbox', 3);

-- Inserindo aulas para o módulo de Introdução ao HTML
INSERT INTO lessons (module_id, title, description, content_type, content_url, duration, order_number) VALUES
(1, 'O que é HTML?', 'Introdução aos conceitos de HTML', 'video', 'videos/html-intro.mp4', 15, 1),
(1, 'Estrutura básica', 'Criando sua primeira página', 'video', 'videos/html-basic.mp4', 20, 2),
(1, 'Tags principais', 'Conhecendo as tags mais usadas', 'video', 'videos/html-tags.mp4', 25, 3);

-- Inserindo algumas matrículas
INSERT INTO enrollments (user_id, course_id, status, progress) VALUES
(2, 1, 'ativo', 0),
(2, 2, 'ativo', 0),
(3, 1, 'ativo', 0);

-- Inserindo progresso nas aulas
INSERT INTO lesson_progress (enrollment_id, lesson_id, status, progress) VALUES
(1, 1, 'concluido', 100),
(1, 2, 'em_andamento', 50),
(1, 3, 'nao_iniciado', 0);

-- Inserindo algumas avaliações
INSERT INTO course_ratings (user_id, course_id, rating, comment) VALUES
(2, 1, 5, 'Excelente curso para iniciantes!'),
(3, 1, 4, 'Muito bom, mas poderia ter mais exercícios práticos.');

-- Inserindo atividades de exemplo
INSERT INTO activities (user_id, type, description) VALUES
(2, 'course_start', 'Iniciou o curso HTML5 e CSS3 Fundamentos'),
(2, 'lesson_complete', 'Completou a aula "O que é HTML?"'),
(2, 'course_start', 'Iniciou o curso JavaScript Moderno'),
(3, 'course_start', 'Iniciou o curso HTML5 e CSS3 Fundamentos'),
(3, 'profile_update', 'Atualizou suas informações de perfil'),
(2, 'lesson_complete', 'Completou a aula "Estrutura básica"');

-- Inserindo certificados de exemplo
INSERT INTO certificates (user_id, course_id, certificate_url) VALUES
(2, 1, '/certificates/joao-silva-html5-css3.pdf'),
(3, 1, '/certificates/maria-santos-html5-css3.pdf'); 