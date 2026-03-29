// Utility Functions

// Supabase Client
const SUPABASE_URL = window.config?.SUPABASE_URL || 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = window.config?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Toast Notifications
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
        ${message}
    `;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS'
    }).format(amount);
}

// Format Date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB');
}

// Get Current User
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Check Role
function hasRole(requiredRole) {
    const userRole = localStorage.getItem('userRole');
    const roles = {
        'admin': 4,
        'treasurer': 3,
        'secretary': 2,
        'welfare_officer': 1,
        'assistant_welfare_officer': 0
    };
    
    return roles[userRole] >= roles[requiredRole];
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = 'index.html';
}

// Load Page Content
function loadPage(page) {
    window.location.href = `${page}.html`;
}

// API Calls
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
    };
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        ...defaultOptions,
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
}

// Export functions
window.utils = {
    supabase,
    showToast,
    openModal,
    closeModal,
    formatCurrency,
    formatDate,
    getCurrentUser,
    hasRole,
    logout,
    loadPage,
    apiCall
};