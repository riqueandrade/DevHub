USE devhub;

-- Inserir usuários
INSERT INTO users (name, email, password, role, avatar_url, bio, status) VALUES
('Admin', 'admin@devhub.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'admin', '/images/admin-avatar.png', 'Administrador do sistema', 'ativo'),
('João Silva', 'joao@email.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'aluno', '/images/default-avatar.png', 'Estudante de programação', 'ativo'),
('Maria Santos', 'maria@email.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'instrutor', '/images/maria-avatar.png', 'Instrutora de desenvolvimento web', 'ativo');

-- Inserir categorias
INSERT INTO categories (name, description, icon) VALUES
('Programação', 'Cursos de programação e desenvolvimento', 'bi-code-slash'),
('Design', 'Cursos de design e UX/UI', 'bi-palette'),
('Marketing', 'Cursos de marketing digital', 'bi-graph-up');

-- Inserir cursos
INSERT INTO courses (title, description, category_id, instructor_id, thumbnail, price, duration, level, status) VALUES
('JavaScript Básico', 'Aprenda os fundamentos do JavaScript', 1, 3, '/images/courses/js-basic.jpg', 0.00, 300, 'iniciante', 'publicado'),
('HTML & CSS', 'Desenvolvimento web com HTML5 e CSS3', 1, 3, '/images/courses/html-css.jpg', 0.00, 240, 'iniciante', 'publicado'),
('UI Design', 'Princípios de design de interface', 2, 3, '/images/courses/ui-design.jpg', 0.00, 180, 'intermediario', 'publicado');

-- Inserir módulos
INSERT INTO modules (course_id, title, description, order_number) VALUES
(1, 'Introdução ao JavaScript', 'Conceitos básicos da linguagem', 1),
(1, 'Variáveis e Tipos', 'Trabalhando com dados', 2),
(2, 'HTML Fundamentos', 'Estrutura básica e tags', 1),
(2, 'CSS Básico', 'Estilização e layouts', 2),
(3, 'Fundamentos do Design', 'Teoria e princípios', 1);

-- Inserir aulas
INSERT INTO lessons (module_id, title, description, content_type, content_url, duration, order_number) VALUES
(1, 'O que é JavaScript?', 'Introdução à linguagem', 'video', '/videos/js-intro.mp4', 15, 1),
(1, 'Ambiente de desenvolvimento', 'Configurando o ambiente', 'video', '/videos/js-setup.mp4', 20, 2),
(2, 'Declarando variáveis', 'var, let e const', 'video', '/videos/js-vars.mp4', 25, 1),
(3, 'Estrutura HTML', 'Anatomia de um documento HTML', 'video', '/videos/html-structure.mp4', 20, 1),
(4, 'Seletores CSS', 'Trabalhando com seletores', 'video', '/videos/css-selectors.mp4', 30, 1);

-- Inserir matrículas
INSERT INTO enrollments (user_id, course_id, status, progress) VALUES
(2, 1, 'em_andamento', 30),
(2, 2, 'em_andamento', 50);

-- Inserir progresso das aulas
INSERT INTO lesson_progress (enrollment_id, lesson_id, status, start_date, completion_date) VALUES
(1, 1, 'concluido', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 2, 'em_andamento', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL),
(2, 4, 'concluido', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY));

-- Inserir avaliações
INSERT INTO course_ratings (user_id, course_id, rating, comment) VALUES
(2, 1, 5, 'Excelente curso! Muito bem explicado.'),
(2, 2, 4, 'Bom curso, material de qualidade.');

-- Inserir atividades
INSERT INTO activities (user_id, type, description) VALUES
(2, 'lesson_complete', 'Completou a aula "O que é JavaScript?"'),
(2, 'course_start', 'Iniciou o curso de HTML & CSS'),
(2, 'lesson_complete', 'Completou a aula "Estrutura HTML"');

-- Inserir certificados
INSERT INTO certificates (user_id, course_id, certificate_url) VALUES
(2, 2, '/certificates/user2-course2.pdf'); 