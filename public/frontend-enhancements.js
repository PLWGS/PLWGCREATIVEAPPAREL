/**
 * PLWGCREATIVEAPPAREL - Frontend Enhancement System
 * Phase 2: Frontend Polish and Testing
 * 
 * This file provides comprehensive UI/UX improvements including:
 * - Loading states and skeleton screens
 * - Error handling and user feedback
 * - Form validation and success messages
 * - Responsive design improvements
 * - Toast notifications
 */

class FrontendEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.createToastContainer();
        this.setupGlobalErrorHandling();
        this.setupFormEnhancements();
        this.setupLoadingStates();
        this.setupResponsiveEnhancements();
    }

    // Toast Notification System
    createToastContainer() {
        if (document.getElementById('toast-container')) return;
        
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-20 right-4 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }

    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        const bgColor = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        }[type] || 'bg-blue-600';

        toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="font-medium">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.remove('translate-x-full'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Loading States and Skeleton Screens
    setupLoadingStates() {
        // Create skeleton loader component
        this.createSkeletonLoader();
        
        // Add loading states to common elements
        this.addLoadingStates();
    }

    createSkeletonLoader() {
        const style = document.createElement('style');
        style.textContent = `
            .skeleton {
                background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .skeleton-text {
                height: 1em;
                border-radius: 4px;
                margin-bottom: 0.5em;
            }
            
            .skeleton-image {
                width: 100%;
                height: 200px;
                border-radius: 8px;
            }
            
            .skeleton-card {
                background: rgba(42, 42, 42, 0.6);
                border: 1px solid rgba(0, 188, 212, 0.2);
                border-radius: 12px;
                padding: 1rem;
            }
        `;
        document.head.appendChild(style);
    }

    addLoadingStates() {
        // Add loading states to buttons
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.textContent.includes('Submit')) {
                this.setButtonLoading(e.target, true);
            }
        });

        // Add loading states to forms
        document.addEventListener('submit', (e) => {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                this.setButtonLoading(submitBtn, true);
            }
        });
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
            `;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Submit';
        }
    }

    // Form Enhancements
    setupFormEnhancements() {
        // Add real-time validation
        this.addRealTimeValidation();
        
        // Add success/error handling
        this.addFormHandling();
    }

    addRealTimeValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                this.validateField(e.target);
            }
        });

        document.addEventListener('blur', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                this.validateField(e.target);
            }
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styling
        field.classList.remove('border-red-500', 'border-green-500');
        this.removeFieldError(field);

        // Validation rules
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (field.type === 'password' && value && value.length < 8) {
            isValid = false;
            errorMessage = 'Password must be at least 8 characters long';
        } else if (field.type === 'tel' && value && !this.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }

        // Apply validation styling
        if (value) {
            if (isValid) {
                field.classList.add('border-green-500');
            } else {
                field.classList.add('border-red-500');
                this.showFieldError(field, errorMessage);
            }
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPhone(phone) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    showFieldError(field, message) {
        this.removeFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        errorDiv.dataset.fieldError = field.name || field.id;
        
        field.parentNode.appendChild(errorDiv);
    }

    removeFieldError(field) {
        const errorDiv = field.parentNode.querySelector(`[data-field-error="${field.name || field.id}"]`);
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    addFormHandling() {
        document.addEventListener('submit', async (e) => {
            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            if (submitBtn) {
                this.setButtonLoading(submitBtn, true);
            }

            try {
                // Simulate form submission delay for better UX
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Show success message
                this.showToast('Form submitted successfully!', 'success');
                
                // Reset form if it's not a login/registration form
                if (!form.action.includes('login') && !form.action.includes('register')) {
                    form.reset();
                    // Remove validation styling
                    form.querySelectorAll('input, textarea, select').forEach(field => {
                        field.classList.remove('border-red-500', 'border-green-500');
                        this.removeFieldError(field);
                    });
                }
                
            } catch (error) {
                this.showToast('An error occurred. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    this.setButtonLoading(submitBtn, false);
                }
            }
        });
    }

    // Error Handling
    setupGlobalErrorHandling() {
        // Global fetch error handling
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    this.showToast(errorData.error || `HTTP ${response.status}: ${response.statusText}`, 'error');
                }
                
                return response;
            } catch (error) {
                this.showToast('Network error. Please check your connection.', 'error');
                throw error;
            }
        };

        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showToast('An unexpected error occurred.', 'error');
        });

        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showToast('An unexpected error occurred.', 'error');
        });
    }

    // Responsive Enhancements
    setupResponsiveEnhancements() {
        // Add mobile menu toggle functionality
        this.setupMobileMenu();
        
        // Add responsive table handling
        this.setupResponsiveTables();
        
        // Add touch gesture support
        this.setupTouchGestures();
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.querySelector('button.lg\\:hidden');
        const desktopNav = document.querySelector('.hidden.lg\\:flex');
        
        if (mobileMenuBtn && desktopNav) {
            let isMenuOpen = false;
            
            mobileMenuBtn.addEventListener('click', () => {
                isMenuOpen = !isMenuOpen;
                
                if (isMenuOpen) {
                    desktopNav.classList.remove('hidden');
                    desktopNav.classList.add('block', 'absolute', 'top-full', 'left-0', 'right-0', 'bg-background', 'glass-nav', 'p-4');
                    mobileMenuBtn.innerHTML = `
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    `;
                } else {
                    desktopNav.classList.add('hidden');
                    desktopNav.classList.remove('block', 'absolute', 'top-full', 'left-0', 'right-0', 'bg-background', 'glass-nav', 'p-4');
                    mobileMenuBtn.innerHTML = `
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    `;
                }
            });
        }
    }

    setupResponsiveTables() {
        // Make tables responsive on mobile
        document.querySelectorAll('table').forEach(table => {
            if (table.scrollWidth > table.clientWidth) {
                table.parentNode.style.overflowX = 'auto';
                table.parentNode.style.webkitOverflowScrolling = 'touch';
            }
        });
    }

    setupTouchGestures() {
        // Add swipe gestures for mobile
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Swipe left/right detection
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - could be used for navigation
                    console.log('Swipe left detected');
                } else {
                    // Swipe right - could be used for navigation
                    console.log('Swipe right detected');
                }
            }
        });
    }

    // Utility Methods
    createSkeletonCard(className = '') {
        return `
            <div class="skeleton-card ${className}">
                <div class="skeleton skeleton-image mb-4"></div>
                <div class="skeleton skeleton-text w-3/4"></div>
                <div class="skeleton skeleton-text w-1/2"></div>
                <div class="skeleton skeleton-text w-2/3"></div>
            </div>
        `;
    }

    createSkeletonGrid(count = 6, className = '') {
        return Array(count).fill(0).map(() => this.createSkeletonCard(className)).join('');
    }

    // API Response Enhancement
    enhanceApiResponse(response, successMessage = 'Operation completed successfully') {
        if (response.ok) {
            this.showToast(successMessage, 'success');
            return response.json();
        } else {
            return response.json().then(errorData => {
                this.showToast(errorData.error || 'An error occurred', 'error');
                throw new Error(errorData.error || 'Request failed');
            });
        }
    }
}

// Initialize enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.frontendEnhancements = new FrontendEnhancements();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendEnhancements;
}
