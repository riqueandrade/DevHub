USE devhub;

-- Inserir categorias
INSERT INTO categories (name, description, icon, slug) VALUES
('Programação Web', 'Cursos de desenvolvimento web front-end e back-end', 'bi-code-slash', 'programacao-web'),
('Mobile', 'Desenvolvimento de aplicativos móveis', 'bi-phone', 'mobile'),
('DevOps', 'Cursos de infraestrutura e deploy', 'bi-gear-fill', 'devops'),
('Banco de Dados', 'Modelagem e administração de bancos de dados', 'bi-database', 'banco-de-dados'),
('UI/UX Design', 'Design de interfaces e experiência do usuário', 'bi-palette', 'ui-ux-design');

-- Inserir usuários (senha: 123456)
INSERT INTO users (name, email, password, role, avatar_url, bio, status, email_notifications, course_updates, promotional_emails, profile_visibility, show_progress, show_certificates, created_at, updated_at) VALUES
-- Admin
('Admin DevHub', 'admin@devhub.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'admin', '/images/avatars/admin-avatar.png', 'Administrador da plataforma DevHub', 'ativo', true, true, false, true, true, true, NOW(), NOW()),

-- Instrutores
('Maria Silva', 'maria@devhub.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'instrutor', '/images/avatars/maria-avatar.png', 'Desenvolvedora Full Stack com 10 anos de experiência. Especialista em React e Node.js', 'ativo', true, true, false, true, true, true, NOW(), NOW()),
('João Santos', 'joao@devhub.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'instrutor', '/images/avatars/joao-avatar.png', 'Engenheiro de Software Senior, especialista em arquitetura de sistemas e DevOps', 'ativo', true, true, false, true, true, true, NOW(), NOW()),
('Ana Costa', 'ana@devhub.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'instrutor', '/images/avatars/ana-avatar.png', 'UI/UX Designer com foco em experiência do usuário e acessibilidade', 'ativo', true, true, false, true, true, true, NOW(), NOW()),

-- Alunos
('Pedro Oliveira', 'pedro@email.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'aluno', '/images/avatars/default-avatar.png', 'Estudante de desenvolvimento web', 'ativo', true, true, true, true, true, true, NOW(), NOW()),
('Carla Souza', 'carla@email.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'aluno', '/images/avatars/default-avatar.png', 'Iniciante em programação', 'ativo', true, true, true, true, true, true, NOW(), NOW()),
('Lucas Mendes', 'lucas@email.com', '$2a$08$TZsTtExcGFpLyHJlUwPRPev2Wug2eioBgxHsBYBCEc3CArrGplGVq', 'aluno', '/images/avatars/default-avatar.png', 'Desenvolvedor front-end júnior', 'ativo', true, true, true, true, true, true, NOW(), NOW());

-- Inserir cursos
INSERT INTO courses (title, description, category_id, instructor_id, thumbnail, price, duration, level, status, created_at, updated_at) VALUES
-- Cursos da Maria (Full Stack)
('Desenvolvimento Web Completo', 'Aprenda HTML, CSS, JavaScript, React, Node.js e muito mais', 1, 2, '/images/courses/web-dev.jpg', 199.90, 4800, 'iniciante', 'publicado', NOW(), NOW()),
('React Avançado', 'Desenvolvimento de aplicações modernas com React e Next.js', 1, 2, '/images/courses/react.jpg', 299.90, 3600, 'avancado', 'publicado', NOW(), NOW()),

-- Cursos do João (DevOps)
('DevOps na Prática', 'Do desenvolvimento ao deploy: Docker, CI/CD e Cloud', 3, 3, '/images/courses/devops.jpg', 399.90, 5400, 'intermediario', 'publicado', NOW(), NOW()),
('Arquitetura de Microsserviços', 'Construindo sistemas escaláveis e resilientes', 3, 3, '/images/courses/microservices.jpg', 499.90, 4200, 'avancado', 'publicado', NOW(), NOW()),

-- Cursos da Ana (UI/UX)
('Design de Interfaces Modernas', 'Princípios de UI/UX e prototipação com Figma', 5, 4, '/images/courses/uiux.jpg', 249.90, 3000, 'iniciante', 'publicado', NOW(), NOW()),
('Acessibilidade na Web', 'Criando interfaces acessíveis e inclusivas', 5, 4, '/images/courses/accessibility.jpg', 199.90, 2400, 'intermediario', 'publicado', NOW(), NOW());

-- Inserir módulos
INSERT INTO modules (course_id, title, description, order_number, created_at) VALUES
-- Módulos do curso Web Completo
(1, 'Fundamentos da Web', 'Introdução a HTML, CSS e JavaScript', 1, NOW()),
(1, 'Front-end com React', 'Desenvolvimento de interfaces com React', 2, NOW()),
(1, 'Back-end com Node.js', 'Criação de APIs com Express', 3, NOW()),

-- Módulos do curso DevOps
(3, 'Containers com Docker', 'Fundamentos de containerização', 1, NOW()),
(3, 'CI/CD Pipeline', 'Integração e deploy contínuo', 2, NOW()),
(3, 'Cloud Computing', 'Deploy na AWS e Azure', 3, NOW());

-- Inserir matrículas
INSERT INTO enrollments (user_id, course_id, status, progress, created_at, updated_at) VALUES
-- Matrículas do Pedro
(5, 1, 'em_andamento', 30, NOW(), NOW()),
(5, 3, 'em_andamento', 15, NOW(), NOW()),

-- Matrículas da Carla
(6, 1, 'em_andamento', 45, NOW(), NOW()),
(6, 5, 'em_andamento', 60, NOW(), NOW()),

-- Matrículas do Lucas
(7, 2, 'em_andamento', 25, NOW(), NOW()),
(7, 6, 'em_andamento', 40, NOW(), NOW());

-- Inserir atividades
INSERT INTO activities (user_id, type, description, created_at) VALUES
-- Atividades dos alunos
(5, 'course_start', 'Iniciou o curso Desenvolvimento Web Completo', NOW()),
(5, 'course_start', 'Iniciou o curso DevOps na Prática', NOW()),
(6, 'course_start', 'Iniciou o curso Desenvolvimento Web Completo', NOW()),
(6, 'course_start', 'Iniciou o curso Design de Interfaces Modernas', NOW()),
(7, 'course_start', 'Iniciou o curso React Avançado', NOW()),
(7, 'course_start', 'Iniciou o curso Acessibilidade na Web', NOW()),

-- Atividades dos instrutores
(2, 'course_create', 'Criou o curso Desenvolvimento Web Completo', NOW()),
(2, 'course_create', 'Criou o curso React Avançado', NOW()),
(3, 'course_create', 'Criou o curso DevOps na Prática', NOW()),
(3, 'course_create', 'Criou o curso Arquitetura de Microsserviços', NOW()),
(4, 'course_create', 'Criou o curso Design de Interfaces Modernas', NOW()),
(4, 'course_create', 'Criou o curso Acessibilidade na Web', NOW()); 