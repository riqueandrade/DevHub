document.addEventListener('DOMContentLoaded', () => {
    // Animação de entrada dos elementos com IntersectionObserver
    const animateElements = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const elements = document.querySelectorAll('.hero h1, .hero-text, .hero-stats, .cta-button, .code-window, .feature-card, .tech-card, .course-card, .testimonial-card');
        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(element);
        });
    };

    // Efeito de digitação otimizado
    const typeCode = () => {
        const codeElement = document.querySelector('.code-content code');
        if (!codeElement) return;
        
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

    // Parallax effect com throttle
    const parallaxEffect = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        let ticking = false;
        document.addEventListener('mousemove', (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const hero = document.querySelector('.hero');
                    if (hero) {
                        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
                        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
                        hero.style.backgroundPosition = `${moveX}px ${moveY}px`;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    };

    // Navbar scroll com throttle
    const handleNavbarScroll = () => {
        let ticking = false;
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 100) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    };

    // Newsletter form com validação e feedback
    const handleNewsletterForm = () => {
        const form = document.querySelector('.newsletter-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const input = form.querySelector('input');
                const button = form.querySelector('button');
                
                if (input.value && input.checkValidity()) {
                    button.disabled = true;
                    button.textContent = 'Enviando...';
                    
                    try {
                        // Simular envio (substituir por chamada real à API)
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        alert('Obrigado por se inscrever! Em breve você receberá nossas novidades.');
                        input.value = '';
                    } catch (error) {
                        alert('Erro ao se inscrever. Por favor, tente novamente.');
                    } finally {
                        button.disabled = false;
                        button.textContent = 'Inscrever-se';
                    }
                }
            });
        }
    };

    // Inicializar funcionalidades
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        animateElements();
        setTimeout(typeCode, 1000);
        parallaxEffect();
        handleNavbarScroll();
        handleNewsletterForm();
    }
}); 