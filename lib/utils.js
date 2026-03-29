// Utility Functions

// Initialize Supabase Client
let supabase = null;

function initSupabase() {
    if (supabase) return; // Already initialized
    
    if (!window.supabase) {
        console.error('Supabase JS library not loaded');
        return;
    }
    
    const SUPABASE_URL = window.config?.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.config?.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase configuration missing. Please check lib/config.js');
        console.error('SUPABASE_URL:', SUPABASE_URL);
        console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);
        return;
    }
    
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✓ Supabase initialized successfully');
        console.log('  URL:', SUPABASE_URL);
        console.log('  Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
    }
}

// Verify Supabase connection
async function verifySupabaseConnection() {
    try {
        if (!supabase) {
            console.warn('Supabase not initialized, attempting initialization...');
            initSupabase();
        }
        
        if (!supabase) {
            console.error('✗ Supabase client not available');
            return false;
        }
        
        // Test authentication endpoint
        const { data, error } = await supabase.auth.getUser();
        
        if (error && error.message !== 'Auth session missing!') {
            console.error('✗ Supabase connection failed:', error.message);
            return false;
        }
        
        console.log('✓ Supabase connection verified');
        return true;
    } catch (error) {
        console.error('✗ Error verifying Supabase connection:', error);
        return false;
    }
}

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
    if (!supabase) initSupabase();
    
    const SUPABASE_URL = window.config?.SUPABASE_URL;
    const session = await supabase.auth.getSession();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`
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

// Initialize on document ready with delay to ensure Supabase library is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing Supabase in 100ms...');
        console.log('Config available:', !!window.config);
        console.log('Supabase library loaded:', !!window.supabase);
        setTimeout(initSupabase, 100);
    });
} else {
    console.log('Document already loaded, initializing Supabase in 100ms...');
    console.log('Config available:', !!window.config);
    console.log('Supabase library loaded:', !!window.supabase);
    setTimeout(initSupabase, 100);
}

// Debug function to check configuration
window.debugSupabase = function() {
    console.log('=== SUPABASE DEBUG INFO ===');
    console.log('Config URL:', window.config?.SUPABASE_URL);
    console.log('Config Key:', window.config?.SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    console.log('Supabase library loaded:', !!window.supabase);
    console.log('Supabase client initialized:', !!supabase);
    console.log('Utils available:', !!window.utils);
    if (window.utils) {
        console.log('Utils.supabase available:', !!window.utils.supabase);
    }
    console.log('========================');
};

// Export functions
window.utils = {
    get supabase() {
        if (!supabase) initSupabase();
        return supabase;
    },
    initSupabase,
    verifySupabaseConnection,
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