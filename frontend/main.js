/**
 * ============================================
 * MAIN.JS - Global JavaScript Functions
 * Adventist General Hospital
 * ============================================
 */

// ============================================
// DOM Ready - Initialize all modules
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all components
    initMobileMenu();
    initDropdowns();
    initHeaderScroll();
    initCounters();
    initSmoothScroll();
    initFormValidation();
    initPasswordToggle();
    initModals();
    initTabs();
    initTooltips();
    initBackToTop();
    initSearchFilter();
    initToastMessages();
    
    console.log('Adventist General Hospital - System Ready 🏥');
});

// ============================================
// Mobile Menu Toggle
// ============================================
function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const nav = document.getElementById('mainNav');
    
    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu on link click (mobile)
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 992) {
                    nav.classList.remove('active');
                    toggle.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        });
        
        // Close menu on outside click
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                if (!nav.contains(e.target) && !toggle.contains(e.target)) {
                    nav.classList.remove('active');
                    toggle.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            }
        });
    }
}

// ============================================
// Dropdowns (Desktop & Mobile)
// ============================================
function initDropdowns() {
    // Desktop dropdown hover
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            if (window.innerWidth > 992) {
                this.querySelector('.dropdown-menu').style.opacity = '1';
                this.querySelector('.dropdown-menu').style.visibility = 'visible';
                this.querySelector('.dropdown-menu').style.transform = 'translateY(0)';
            }
        });
        
        dropdown.addEventListener('mouseleave', function() {
            if (window.innerWidth > 992) {
                this.querySelector('.dropdown-menu').style.opacity = '0';
                this.querySelector('.dropdown-menu').style.visibility = 'hidden';
                this.querySelector('.dropdown-menu').style.transform = 'translateY(10px)';
            }
        });
    });
    
    // Mobile dropdown toggle (handled in HTML via CSS)
}

// ============================================
// Header Scroll Effect
// ============================================
function initHeaderScroll() {
    const header = document.getElementById('header');
    let lastScroll = 0;
    
    if (header) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Hide header on scroll down, show on scroll up (optional)
            if (currentScroll > lastScroll && currentScroll > 300) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });
    }
}

// ============================================
// Counter Animation
// ============================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    
    if (counters.length === 0) return;
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000;
                const increment = target / (duration / 16);
                let current = 0;
                
                // Handle special cases like percentage
                const isPercentage = counter.textContent.includes('%');
                const isCurrency = counter.textContent.includes('ETB');
                
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        let displayValue = Math.round(current);
                        if (isPercentage) {
                            counter.textContent = displayValue + '%';
                        } else if (isCurrency) {
                            counter.textContent = 'ETB ' + displayValue.toLocaleString();
                        } else {
                            counter.textContent = displayValue;
                        }
                        requestAnimationFrame(updateCounter);
                    } else {
                        if (isPercentage) {
                            counter.textContent = target + '%';
                        } else if (isCurrency) {
                            counter.textContent = 'ETB ' + target.toLocaleString();
                        } else {
                            counter.textContent = target + '+';
                        }
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.getElementById('header')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// Form Validation
// ============================================
function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const inputs = this.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                const errorElement = input.parentElement.querySelector('.error-message');
                const value = input.value.trim();
                
                if (!value) {
                    input.classList.add('error');
                    if (errorElement) errorElement.style.display = 'block';
                    isValid = false;
                } else {
                    input.classList.remove('error');
                    if (errorElement) errorElement.style.display = 'none';
                }
                
                // Email validation
                if (input.type === 'email' && value) {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailPattern.test(value)) {
                        input.classList.add('error');
                        if (errorElement) {
                            errorElement.textContent = 'Please enter a valid email address';
                            errorElement.style.display = 'block';
                        }
                        isValid = false;
                    }
                }
                
                // Phone validation
                if (input.type === 'tel' && value) {
                    const phonePattern = /^[\+\d\s\-\(\)]{7,20}$/;
                    if (!phonePattern.test(value)) {
                        input.classList.add('error');
                        if (errorElement) {
                            errorElement.textContent = 'Please enter a valid phone number';
                            errorElement.style.display = 'block';
                        }
                        isValid = false;
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                // Scroll to first error
                const firstError = this.querySelector('.error');
                if (firstError) {
                    firstError.focus();
                }
            }
        });
        
        // Clear error on input
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const errorElement = this.parentElement.querySelector('.error-message');
                if (errorElement) errorElement.style.display = 'none';
            });
        });
    });
}

// ============================================
// Password Toggle Visibility
// ============================================
function initPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
}

// ============================================
// Modal Management
// ============================================
function initModals() {
    // Open modals
    document.querySelectorAll('[data-modal-open]').forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal-open');
            const modal = document.getElementById(modalId);
            if (modal) {
                openModal(modal);
            }
        });
    });
    
    // Close modals
    document.querySelectorAll('[data-modal-close]').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                closeModal(modal);
            }
        });
    });
    
    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                closeModal(modal);
            });
        }
    });
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus trap
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) {
        focusable[0].focus();
    }
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// Tabs
// ============================================
function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(tabContainer => {
        const tabs = tabContainer.querySelectorAll('[data-tab]');
        const contents = tabContainer.querySelectorAll('[data-tab-content]');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update active content
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetId) {
                        content.classList.add('active');
                    }
                });
            });
        });
    });
}

// ============================================
// Tooltips
// ============================================
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        const text = element.getAttribute('data-tooltip');
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        element.appendChild(tooltip);
        
        element.addEventListener('mouseenter', function() {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
        });
        
        element.addEventListener('mouseleave', function() {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
        });
    });
}

// ============================================
// Back to Top Button
// ============================================
function initBackToTop() {
    const button = document.getElementById('backToTop');
    if (!button) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 500) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    });
    
    button.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// Search Filter (for tables/lists)
// ============================================
function initSearchFilter() {
    document.querySelectorAll('[data-search]').forEach(searchInput => {
        const targetSelector = searchInput.getAttribute('data-search');
        const targetItems = document.querySelectorAll(targetSelector);
        
        if (targetItems.length === 0) return;
        
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            
            targetItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// Toast Messages / Notifications
// ============================================
function initToastMessages() {
    // Auto-dismiss toast messages
    document.querySelectorAll('.toast-message').forEach(toast => {
        const duration = parseInt(toast.getAttribute('data-duration')) || 5000;
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, duration);
    });
}

// ============================================
// Utility Functions (Global)
// ============================================

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Time in milliseconds
 */
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.setAttribute('data-duration', duration);
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto dismiss
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Format currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: ETB)
 */
function formatCurrency(amount, currency = 'ETB') {
    return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Format date
 * @param {string|Date} date - The date to format
 * @param {string} format - 'short', 'long', 'full'
 */
function formatDate(date, format = 'short') {
    const d = new Date(date);
    const options = {
        short: { month: 'short', day: 'numeric', year: 'numeric' },
        long: { month: 'long', day: 'numeric', year: 'numeric' },
        full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    };
    return d.toLocaleDateString('en-US', options[format] || options.short);
}

/**
 * Debounce function for performance
 * @param {function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 */
function debounce(func, wait = 250) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 */
function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

/**
 * Validate phone number
 * @param {string} phone - The phone number to validate
 */
function isValidPhone(phone) {
    const pattern = /^[\+\d\s\-\(\)]{7,20}$/;
    return pattern.test(phone);
}

// ============================================
// Export for module usage
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        formatCurrency,
        formatDate,
        debounce,
        isValidEmail,
        isValidPhone,
        openModal,
        closeModal
    };
                          }
