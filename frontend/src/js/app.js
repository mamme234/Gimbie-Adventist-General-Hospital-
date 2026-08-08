/**
 * Gimbie Adventist General Hospital - Main Application
 */

import API from './api.js';
import { initAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    // ===== INITIALIZE AUTH =====
    initAuth();

    // ===== MOBILE MENU =====
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('mainNav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    // ===== ACTIVE NAV LINK =====
    const navLinks = document.querySelectorAll('.nav__link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            link.classList.add('active');
        } else if (currentPath.includes('/pages/') && href.includes('/pages/')) {
            const currentPage = currentPath.split('/').pop();
            const linkPage = href.split('/').pop();
            if (currentPage === linkPage) {
                link.classList.add('active');
            }
        }
    });

    // ===== SCROLL ANIMATIONS =====
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.feature-card, .service-card, .testimonial-card, .statistic');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();

    // ===== COUNTER ANIMATION =====
    const counters = document.querySelectorAll('.statistic__number');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    };

    const observerOptions = { threshold: 0.5 };
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                animateCounter(counter);
                counterObserver.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    // ===== LOAD TESTIMONIALS =====
    loadTestimonials();

    // ===== LOAD SERVICES =====
    loadServices();

    // ===== CONTACT FORM =====
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                subject: formData.get('subject'),
                message: formData.get('message'),
            };

            try {
                console.log('Contact form submitted:', data);
                showToast('Thank you for your message! We will get back to you soon.', 'success');
                this.reset();
            } catch (error) {
                console.error('Error sending message:', error);
                showToast('Something went wrong. Please try again later.', 'error');
            }
        });
    }
});

// ===== LOAD TESTIMONIALS =====
async function loadTestimonials() {
    const container = document.getElementById('testimonialsContainer');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/testimonials/approved`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            container.innerHTML = data.data.map(testimonial => `
                <div class="testimonial-card">
                    <div class="stars">${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}</div>
                    <p class="comment">"${testimonial.comment}"</p>
                    <div class="patient">
                        <div>
                            <div class="name">${testimonial.patientName}</div>
                            <div class="location">${testimonial.location}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = getFallbackTestimonials();
        }
    } catch (error) {
        console.error('Error loading testimonials:', error);
        container.innerHTML = getFallbackTestimonials();
    }
}

function getFallbackTestimonials() {
    const testimonials = [
        {
            name: 'Patient',
            location: 'Gimbi',
            rating: 5,
            comment: 'The staff were welcoming and professional, and my experience at the hospital was very good.'
        },
        {
            name: 'Patient',
            location: 'West Wollega',
            rating: 5,
            comment: 'The medical team explained the treatment clearly and treated me with respect.'
        },
        {
            name: 'Patient',
            location: 'Gimbi',
            rating: 5,
            comment: 'The hospital environment was comfortable, and the staff were helpful throughout my visit.'
        }
    ];

    return testimonials.map(t => `
        <div class="testimonial-card">
            <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
            <p class="comment">"${t.comment}"</p>
            <div class="patient">
                <div>
                    <div class="name">${t.name}</div>
                    <div class="location">${t.location}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== LOAD SERVICES =====
function loadServices() {
    const container = document.getElementById('servicesGrid');
    if (!container) return;

    const services = [
        { icon: 'fa-stethoscope', name: 'General Medicine', desc: 'Diagnosis and treatment of common illnesses and chronic conditions.' },
        { icon: 'fa-baby', name: 'Maternity & Child Health', desc: 'Prenatal, delivery, and postnatal care for mothers and newborns.' },
        { icon: 'fa-bolt', name: 'Emergency Services', desc: '24/7 emergency care for accidents, injuries, and urgent medical needs.' },
        { icon: 'fa-x-ray', name: 'Diagnostic Services', desc: 'Laboratory tests, X-ray, ultrasound, and other diagnostic imaging.' },
        { icon: 'fa-syringe', name: 'Immunization & Vaccination', desc: 'Preventive care through routine vaccinations for children and adults.' },
        { icon: 'fa-heart', name: 'Chronic Disease Management', desc: 'Ongoing care for diabetes, hypertension, HIV/AIDS, and more.' },
    ];

    container.innerHTML = services.map(service => `
        <div class="service-card">
            <i class="fas ${service.icon}"></i>
            <h3>${service.name}</h3>
            <p>${service.desc}</p>
        </div>
    `).join('');
}

// ===== SHOW TOAST =====
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: #fff;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#0f5c2e' : '#c62828'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== ANIMATION STYLES =====
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .feature-card, .service-card, .testimonial-card, .statistic {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .feature-card.visible, .service-card.visible, .testimonial-card.visible, .statistic.visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(styleSheet);

// ===== EXPOSE GLOBALLY =====
window.API = API;
