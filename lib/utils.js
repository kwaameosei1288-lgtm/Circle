// Utility Functions

// Initialize Supabase Client
let supabase = null;
let initPromise = null;

function waitForSupabaseLibrary() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds at 100ms intervals
        
        const checkSupabase = setInterval(() => {
            attempts++;
            if (window.supabase) {
                clearInterval(checkSupabase);
                console.log('✓ Supabase library detected');
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkSupabase);
                console.error('✗ Supabase library failed to load after 5 seconds');
                resolve(false);
            }
        }, 100);
    });
}

async function initSupabase() {
    if (supabase) return supabase; // Already initialized
    if (initPromise) return initPromise; // Initialization in progress
    
    // Create initialization promise to prevent multiple simultaneous initializations
    initPromise = (async () => {
        try {
            // Wait for Supabase library to be available
            const libLoaded = await waitForSupabaseLibrary();
            if (!libLoaded || !window.supabase) {
                throw new Error('Supabase JS library not loaded');
            }
            
            // Wait for config
            if (!window.config) {
                throw new Error('Configuration not loaded. Please check lib/config.js');
            }
            
            const SUPABASE_URL = window.config.SUPABASE_URL;
            const SUPABASE_ANON_KEY = window.config.SUPABASE_ANON_KEY;
            
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Supabase configuration missing');
            }
            
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✓ Supabase initialized successfully');
            console.log('  URL:', SUPABASE_URL);
            console.log('  Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
            
            return supabase;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            initPromise = null; // Reset on error to allow retry
            throw error;
        }
    })();
    
    return initPromise;
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

// Initialize on document ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing utils...');
        initSupabase().catch(error => {
            console.error('Initial Supabase initialization failed:', error);
        });
    });
} else {
    console.log('Document already loaded, initializing utils...');
    initSupabase().catch(error => {
        console.error('Initial Supabase initialization failed:', error);
    });
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
        if (!supabase) {
            console.warn('Supabase not initialized yet, attempting initialization...');
            initSupabase();
        }
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
    apiCall,
    // Promise-based initialization for async operations
    async ensureInitialized() {
        return await initSupabase();
    }
};