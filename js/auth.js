// Authentication Logic - Simplified and Rebuilt

// Wait for all dependencies to be ready
async function initializeAuth() {
    try {
        console.log('Initializing authentication...');

        // Wait for utils and Supabase
        let attempts = 0;
        while ((!window.utils || !window.utils.supabase) && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.utils || !window.utils.supabase) {
            throw new Error('Failed to load dependencies');
        }

        console.log('✓ Dependencies loaded');

        // Check for existing session
        await checkExistingSession();

        // Setup event listeners
        setupEventListeners();

        // Hide bootloader after a short delay
        setTimeout(() => {
            const bootloader = document.getElementById('bootloader');
            if (bootloader) {
                bootloader.style.display = 'none';
            }
        }, 1500);

    } catch (error) {
        console.error('Auth initialization failed:', error);
        showError('System initialization failed. Please refresh the page.');
    }
}

// Check if user is already logged in
async function checkExistingSession() {
    try {
        const { data: { session } } = await window.utils.supabase.auth.getSession();

        if (session) {
            console.log('Existing session found');

            // Verify profile exists
            const { data: profile } = await window.utils.supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                // Store session data
                localStorage.setItem('session', JSON.stringify(session));
                localStorage.setItem('userId', session.user.id);
                localStorage.setItem('userRole', profile.role);
                localStorage.setItem('userName', profile.name);

                // Check if password change is needed
                if (!profile.password_changed) {
                    console.log('Password change required');
                    showPasswordModal();
                } else {
                    console.log('Redirecting to dashboard');
                    window.location.href = 'dashboard.html';
                }
            }
        }
    } catch (error) {
        console.log('No valid session found:', error.message);
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    // Password toggles
    setupPasswordToggle('password', 'passwordToggle');
    setupPasswordToggle('newPassword', 'newPasswordToggle');
    setupPasswordToggle('confirmPassword', 'confirmPasswordToggle');

    // Password strength meter
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
    }

    // Modal close
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closePasswordModal());
    }

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('passwordModal');
        if (event.target === modal) {
            closePasswordModal();
        }
    });
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');

    // Clear previous errors
    hideError();

    try {
        // Validate inputs
        if (!username || !password) {
            throw new Error('Please enter both username and password');
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        // Map username to email
        const emailMap = {
            'kingsley': 'kingsley@helpinghands.com',
            'mavis': 'mavis@helpinghands.com',
            'rosemary': 'rosemary@helpinghands.com',
            'jacob': 'jacob@helpinghands.com',
            'constance': 'constance@helpinghands.com'
        };

        const email = emailMap[username.toLowerCase()];
        if (!email) {
            throw new Error('Invalid username');
        }

        console.log('Attempting login for:', username);

        // Attempt login
        const { data, error } = await window.utils.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        if (!data.user || !data.session) {
            throw new Error('Login failed');
        }

        console.log('Login successful');

        // Store session data
        localStorage.setItem('session', JSON.stringify(data.session));
        localStorage.setItem('userId', data.user.id);

        // Fetch user profile
        const { data: profile, error: profileError } = await window.utils.supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            throw new Error('Failed to load user profile');
        }

        // Store profile data
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userName', profile.name);

        // Check if password change is needed
        if (!profile.password_changed) {
            showPasswordModal();
        } else {
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }

    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

// Handle password change
async function handlePasswordChange(event) {
    event.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');

    try {
        // Validate
        if (!newPassword || !confirmPassword) {
            throw new Error('Please fill all fields');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        // Show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';

        console.log('Updating password...');

        // Update password
        const { error: updateError } = await window.utils.supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            throw updateError;
        }

        // Update profile
        const userId = localStorage.getItem('userId');
        const { error: profileError } = await window.utils.supabase
            .from('profiles')
            .update({ password_changed: true })
            .eq('id', userId);

        if (profileError) {
            throw profileError;
        }

        console.log('Password updated successfully');

        // Success
        closePasswordModal();
        showSuccess('Password updated! Redirecting to dashboard...');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);

    } catch (error) {
        console.error('Password change error:', error);
        showError(error.message || 'Failed to update password');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
    }
}

// Password toggle functionality
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);

    if (!input || !toggle) return;

    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        toggle.innerHTML = type === 'password'
            ? '<i class="fas fa-eye"></i>'
            : '<i class="fas fa-eye-slash"></i>';
    });
}

// Password strength meter
function updatePasswordStrength() {
    const input = document.getElementById('newPassword');
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('strengthText');

    if (!input) return;

    const password = input.value;
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    let level = 'Very Weak';
    let className = '';

    if (strength <= 1) {
        className = 'weak';
        level = 'Weak';
    } else if (strength === 2 || strength === 3) {
        className = 'fair';
        level = 'Fair';
    } else if (strength === 4) {
        className = 'good';
        level = 'Good';
    } else {
        className = 'strong';
        level = 'Strong';
    }

    if (strengthBar) {
        strengthBar.className = `meter-fill ${className}`;
    }
    if (strengthText) {
        strengthText.textContent = level;
        strengthText.className = className;
    }
}

// Modal functions
function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Message functions
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.backgroundColor = '#FEE2E2';
        errorDiv.style.borderLeftColor = '#EF4444';
        errorDiv.style.color = '#991B1B';
    }
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.backgroundColor = '#DCFCE7';
        errorDiv.style.borderLeftColor = '#10B981';
        errorDiv.style.color = '#166534';
    }
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAuth);