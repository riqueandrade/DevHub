document.addEventListener('DOMContentLoaded', () => {
    // Animação de entrada dos elementos
    const animateElements = () => {
        const elements = document.querySelectorAll('.hero h1, .hero-text, .hero-stats, .cta-button, .code-window, .feature-card, .tech-card, .course-card, .testimonial-card');
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    };

    // Efeito de digitação no código
    const typeCode = () => {
        const codeElement = document.querySelector('.code-content code');
        const codeText = codeElement.textContent;
        codeElement.textContent = '';
        
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < codeText.length) {
                codeElement.textContent += codeText[index];
                index++;
            } else {
                clearInterval(typeInterval);
            }
        }, 50);
    };

    // Efeito parallax suave no hero
    const parallaxEffect = () => {
        document.addEventListener('mousemove', (e) => {
            const hero = document.querySelector('.hero');
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            
            hero.style.backgroundPosition = `${moveX}px ${moveY}px`;
        });
    };

    // Navbar scroll effect
    const handleNavbarScroll = () => {
        const navbar = document.querySelector('.navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    };

    // Smooth scroll para links internos
    const smoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };

    // Hover effect nos cards de tecnologia
    const techCardsEffect = () => {
        const cards = document.querySelectorAll('.tech-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    };

    // Animação de números
    const animateNumbers = () => {
        const stats = document.querySelectorAll('.stat span');
        stats.forEach(stat => {
            const finalNumber = parseInt(stat.textContent);
            let currentNumber = 0;
            const increment = finalNumber / 50;
            const interval = setInterval(() => {
                if (currentNumber < finalNumber) {
                    currentNumber += increment;
                    stat.textContent = Math.ceil(currentNumber) + (stat.textContent.includes('+') ? '+' : '');
                } else {
                    clearInterval(interval);
                }
            }, 30);
        });
    };

    // Newsletter form
    const handleNewsletterForm = () => {
        const form = document.querySelector('.newsletter-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('input');
                if (input.value) {
                    alert('Obrigado por se inscrever! Em breve você receberá nossas novidades.');
                    input.value = '';
                }
            });
        }
    };

    // Inicializar todas as funcionalidades
    animateElements();
    setTimeout(typeCode, 1000);
    parallaxEffect();
    handleNavbarScroll();
    smoothScroll();
    techCardsEffect();
    setTimeout(animateNumbers, 500);
    handleNewsletterForm();
}); 