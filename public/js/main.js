// Karyo Clothing Store - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeNavigation();
    initializeProductCards();
    initializeCart();
    initializeForms();
    initializeAnimations();
});

// Navigation functionality
function initializeNavigation() {
    // Active link highlighting
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Mobile menu auto-close
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navbarCollapse.classList.contains('show')) {
                    navbarToggler.click();
                }
            });
        });
    }
}

// Product card interactions
function initializeProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        // Track product views
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Track product view (you can send this to analytics)
                    console.log('Product viewed:', entry.target);
                }
            });
        });
        
        observer.observe(card);
    });
}

// Cart functionality
function initializeCart() {
    // Update cart count in navbar
    updateCartCount();
    
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('[onclick*="addToCart"]');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add loading state
            this.classList.add('loading');
            this.disabled = true;
            
            // Remove loading state after operation
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
            }, 1000);
        });
    });
    
    // Quantity update buttons
    const quantityButtons = document.querySelectorAll('[onclick*="changeQuantity"]');
    quantityButtons.forEach(button => {
        button.addEventListener('click', function() {
            updateCartTotals();
        });
    });
}

// Form enhancements
function initializeForms() {
    // Add validation styling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                    field.classList.add('is-valid');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showToast('Please fill in all required fields', 'error');
            } else {
                // Show loading state
                const submitButton = form.querySelector('[type="submit"]');
                if (submitButton) {
                    submitButton.classList.add('loading');
                    submitButton.disabled = true;
                }
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required') && !this.value.trim()) {
                    this.classList.add('is-invalid');
                } else {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                }
            });
        });
    });
    
    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            this.value = value;
        });
    });
    
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.classList.add('is-invalid');
                showToast('Please enter a valid email address', 'error');
            }
        });
    });
}

// Animations and scroll effects
function initializeAnimations() {
    // Scroll-triggered animations
    const animatedElements = document.querySelectorAll('.card, .product-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease';
                entry.target.style.opacity = '1';
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        observer.observe(element);
    });
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility functions
function updateCartCount() {
    // This would typically fetch from your backend
    const cartCount = localStorage.getItem('cartCount') || '0';
    const cartBadges = document.querySelectorAll('.badge');
    cartBadges.forEach(badge => {
        if (badge.closest('.btn')) {
            badge.textContent = cartCount;
            badge.style.display = cartCount === '0' ? 'none' : 'block';
        }
    });
}

function updateCartTotals() {
    // Calculate and update cart totals
    const cartItems = document.querySelectorAll('.cart-item');
    let total = 0;
    
    cartItems.forEach(item => {
        const price = parseFloat(item.dataset.price);
        const quantity = parseInt(item.querySelector('.quantity-input').value);
        total += price * quantity;
    });
    
    const totalElements = document.querySelectorAll('.cart-total');
    totalElements.forEach(element => {
        element.textContent = `₹${total.toLocaleString()}`;
    });
}

function showToast(message, type = 'info') {
    // Create and show toast notification
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : 'check-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Sales psychology functions
function createUrgencyTimer(endTime) {
    const timer = document.getElementById('urgency-timer');
    if (!timer) return;
    
    const countdown = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (distance < 0) {
            clearInterval(countdown);
            timer.innerHTML = "OFFER EXPIRED";
            return;
        }
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        timer.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

// Initialize urgency timer (24 hours from now)
const urgencyEndTime = new Date().getTime() + (24 * 60 * 60 * 1000);
createUrgencyTimer(urgencyEndTime);

// Track user interactions for analytics
function trackEvent(eventName, eventData = {}) {
    console.log('Event tracked:', eventName, eventData);
    // In a real application, send this to your analytics service
}

// Add event listeners for tracking
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-primary, .btn-success')) {
        trackEvent('button_click', {
            button_text: e.target.textContent.trim(),
            page: window.location.pathname
        });
    }
});

// Performance optimization
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
lazyLoadImages();

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim();
            if (query.length > 2) {
                performSearch(query);
            }
        }, 300);
    });
}

function performSearch(query) {
    // Implement search functionality
    console.log('Searching for:', query);
    trackEvent('search', { query: query });
}

// Initialize search
initializeSearch();

// Add loading states to buttons
document.querySelectorAll('.btn').forEach(btn => {
    if (btn.type === 'submit' || btn.onclick) {
        btn.addEventListener('click', function() {
            if (!this.classList.contains('loading')) {
                this.classList.add('loading');
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 2000);
            }
        });
    }
});