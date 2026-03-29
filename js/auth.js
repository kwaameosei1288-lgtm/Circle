// Authentication Logic - Enhanced and Fixed

// Global initialization flag
let isInitialized = false;

// Wait for all dependencies to be ready
async function initializeAuth() {
    if (isInitialized) return;
    isInitialized = true;

    try {
        console.log('🚀 Initializing authentication system...');

        // Wait for critical dependencies with timeout
        const depsReady = await waitForDependencies();
        if (!depsReady) {
            throw new Error('Dependencies failed to load within timeout');
        }

        console.log('✅ Dependencies loaded successfully');

        // Check for existing session
        await checkExistingSession();

        // Setup all event listeners
        setupEventListeners();

        // Hide bootloader with animation
        setTimeout(() => {
            const bootloader = document.getElementById('bootloader');
            if (bootloader) {
                bootloader.style.transition = 'opacity 0.5s ease-out';
                bootloader.style.opacity = '0';
                setTimeout(() => {
                    bootloader.style.display = 'none';
                }, 500);
            }
        }, 1000);

        console.log('🎉 Authentication system ready');

    } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        showError(error.message || 'System initialization failed. Please refresh the page.');

        // Show the page even if initialization fails
        const bootloader = document.getElementById('bootloader');
        if (bootloader) {
            bootloader.style.display = 'none';
        }
    }
}

// Wait for dependencies with better error handling
async function waitForDependencies() {
    const maxAttempts = 100; // 10 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;

        // Check if Supabase library is loaded
        if (typeof window.supabase === 'undefined') {
            console.log(`⏳ Waiting for Supabase library... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        // Check if config is loaded
        if (!window.config) {
            console.log(`⏳ Waiting for config... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        // Check if utils is loaded and initialized
        if (!window.utils) {
            console.log(`⏳ Waiting for utils... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        // Try to access supabase getter to ensure it's initialized
        try {
            const supabase = window.utils.supabase;
            if (!supabase) {
                console.log(`⏳ Waiting for Supabase client... (${attempts}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }
        } catch (error) {
            console.log(`⏳ Waiting for Supabase initialization... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        console.log('✅ All dependencies ready');
        return true;
    }

    console.error('❌ Dependencies failed to load within timeout');
    return false;
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
    console.log('Setting up event listeners...');

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form listener attached');
    } else {
        console.warn('❌ Login form not found');
    }

    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
        console.log('✅ Password form listener attached');
    } else {
        console.warn('❌ Password form not found');
    }

    // Password toggles - setup with error handling
    setupPasswordToggle('password', 'passwordToggle');
    setupPasswordToggle('newPassword', 'newPasswordToggle');
    setupPasswordToggle('confirmPassword', 'confirmPasswordToggle');

    // Password strength meter
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', updatePasswordStrength);
        console.log('✅ Password strength listener attached');
    }

    // Modal close buttons
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closePasswordModal());
        console.log('✅ Modal close listener attached');
    }

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('passwordModal');
        if (modal && event.target === modal) {
            closePasswordModal();
        }
    });

    console.log('✅ All event listeners setup complete');
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
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const btnIcon = submitBtn.querySelector('.btn-icon');

    if (btnText) btnText.textContent = 'Signing in...';
    if (btnLoader) btnLoader.style.display = 'block';
    if (btnIcon) btnIcon.style.display = 'none';

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
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const btnIcon = submitBtn.querySelector('.btn-icon');

        if (btnText) btnText.textContent = 'Sign In';
        if (btnLoader) btnLoader.style.display = 'none';
        if (btnIcon) btnIcon.style.display = 'inline-block';
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
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const btnIcon = submitBtn.querySelector('.btn-icon');

        if (btnText) btnText.textContent = 'Updating...';
        if (btnLoader) btnLoader.style.display = 'block';
        if (btnIcon) btnIcon.style.display = 'none';

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
        // Reset button
        submitBtn.disabled = false;
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const btnIcon = submitBtn.querySelector('.btn-icon');

        if (btnText) btnText.textContent = 'Update Password';
        if (btnLoader) btnLoader.style.display = 'none';
        if (btnIcon) btnIcon.style.display = 'inline-block';
    }
}

// Enhanced password toggle functionality
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);

    if (!input || !toggle) {
        console.warn(`Password toggle setup failed: input=${inputId}, toggle=${toggleId}`);
        return;
    }

    // Remove any existing listeners to prevent duplicates
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);

    // Add the event listener to the new element
    newToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const currentType = input.type;
        const newType = currentType === 'password' ? 'text' : 'password';

        input.type = newType;
        newToggle.innerHTML = newType === 'password'
            ? '<i class="fas fa-eye"></i>'
            : '<i class="fas fa-eye-slash"></i>';

        // Add visual feedback
        newToggle.style.transform = 'scale(0.95)';
        setTimeout(() => {
            newToggle.style.transform = '';
        }, 150);

        console.log(`Password visibility toggled for ${inputId}: ${newType}`);
    });

    console.log(`✅ Password toggle setup complete for ${inputId}`);
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

// Enhanced error message display
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        const errorText = errorDiv.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorDiv.textContent = message;
        }
        errorDiv.style.display = 'flex';
        errorDiv.style.animation = 'slideInFromTop 0.4s ease-out';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }
}

// Enhanced success message display
function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        const errorText = errorDiv.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorDiv.textContent = message;
        }
        errorDiv.style.display = 'flex';
        errorDiv.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        errorDiv.style.borderLeftColor = '#4facfe';
        errorDiv.style.color = 'white';
        errorDiv.style.animation = 'slideInFromTop 0.4s ease-out';

        // Auto-hide after 3 seconds for success
        setTimeout(() => {
            hideError();
        }, 3000);
    }
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.animation = 'slideOutToTop 0.3s ease-in';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 300);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAuth);