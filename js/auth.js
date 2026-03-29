// Authentication Logic

// Wait for utils to be ready
function waitForUtils() {
    return new Promise((resolve) => {
        console.log('Checking for utils...');
        
        if (window.utils && window.utils.supabase) {
            console.log('Utils and supabase ready immediately');
            resolve();
        } else {
            let checkCount = 0;
            const checkInterval = setInterval(() => {
                checkCount++;
                console.log(`Attempt ${checkCount}: window.utils =`, !!window.utils, 'supabase =', !!window.utils?.supabase);
                
                if (window.utils && window.utils.supabase) {
                    clearInterval(checkInterval);
                    console.log('Utils ready after', checkCount, 'attempts');
                    resolve();
                }
            }, 100);
            
            // Timeout after 8 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.error('Utils initialization timeout after', checkCount, 'attempts');
                console.log('window.utils =', window.utils);
                console.log('window.supabase =', !!window.supabase);
                console.log('window.config =', window.config);
                resolve();
            }, 8000);
        }
    });
}

// Password strength meter
function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    return strength;
}

function updatePasswordStrength(inputId, strengthId, textId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const password = input.value;
    const strengthBar = document.getElementById(strengthId);
    const strengthText = document.getElementById(textId);
    
    const strength = calculatePasswordStrength(password);
    let level = 'Very Weak';
    let className = '';
    
    if (strength === 0) {
        className = '';
        level = 'Very Weak';
    } else if (strength === 1) {
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

// Notification modal
function showNotification(title, message, type = 'success') {
    const modal = document.getElementById('notificationModal');
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    const btn = document.getElementById('notificationBtn');
    
    if (!modal || !icon || !titleEl || !messageEl || !btn) {
        console.error('Notification modal elements not found');
        alert(title + ': ' + message);
        return;
    }
    
    // Update icon
    icon.className = `notification-icon ${type}`;
    
    // Update content
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Update button color
    btn.className = type === 'error' ? 'btn-danger' : 'btn-primary';
    
    // Show modal
    modal.style.display = 'block';
    
    // Close button
    btn.onclick = () => {
        modal.style.display = 'none';
    };
    
    // Outside click
    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Ensure utils is initialized
        await waitForUtils();
        
        // Setup password toggles
        setupPasswordToggle('password', 'passwordToggle');
        setupPasswordToggle('newPassword', 'newPasswordToggle');
        setupPasswordToggle('confirmPassword', 'confirmPasswordToggle');
        
        // Password strength meter listener
        const newPasswordInput = document.getElementById('newPassword');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', () => {
                updatePasswordStrength('newPassword', 'passwordStrength', 'strengthText');
            });
        }
        
        // Check if user is already logged in
        checkExistingSession();
        
        // Hide bootloader after 2 seconds
        setTimeout(() => {
            const bootloader = document.getElementById('bootloader');
            if (bootloader) {
                bootloader.style.display = 'none';
            }
        }, 2000);

        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Password form submission
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', handlePasswordChange);
        }

        // Modal close
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeModal('passwordModal');
            });
        }
        
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('passwordModal');
            if (event.target === modal) {
                closeModal('passwordModal');
            }
        });
    } catch (error) {
        console.error('DOMContentLoaded error:', error);
    }
});

// Check for existing session
async function checkExistingSession() {
    try {
        if (!window.utils || !window.utils.supabase) {
            console.log('Utils not ready yet, skipping existing session check');
            return;
        }
        
        console.log('Checking for existing session...');
        
        const { data: { session } } = await window.utils.supabase.auth.getSession();
        if (session) {
            console.log('Existing session found, fetching profile...');
            
            // Verify user profile exists
            const { data: profile, error: profileError } = await window.utils.supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profileError) {
                console.log('Profile error:', profileError);
                return;
            }
            
            if (profile) {
                console.log('Profile found, redirecting to dashboard');
                localStorage.setItem('session', JSON.stringify(session));
                localStorage.setItem('userRole', profile.role);
                localStorage.setItem('userName', profile.name);
                localStorage.setItem('userId', session.user.id);
                window.location.href = 'dashboard.html';
            }
        }
    } catch (error) {
        console.log('No existing session or error checking session:', error.message);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('errorMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Clear previous error
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
    
    try {
        // Validate inputs
        if (!username || !password) {
            throw new Error('Please enter username and password');
        }
        
        // Ensure utils is ready
        if (!window.utils) {
            console.error('window.utils is not defined:', window.utils);
            console.error('Available globals:', Object.keys(window).filter(k => !k.startsWith('webkit')).slice(0, 20));
            throw new Error('System loading... Please wait a moment and try again.');
        }
        
        if (!window.utils.supabase) {
            console.error('Supabase client not initialized');
            console.error('window.supabase library:', !!window.supabase);
            console.error('window.config:', window.config);
            // Try to initialize it
            if (window.utils.initSupabase) {
                console.log('Attempting manual initialization...');
                window.utils.initSupabase();
                if (!window.utils.supabase) {
                    throw new Error('Failed to initialize Supabase. Check your configuration.');
                }
            } else {
                throw new Error('Supabase not initialized. Please refresh the page.');
            }
        }
        
        // Disable submit button and show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
        }
        
        console.log('Attempting login with username:', username);
        
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
            throw new Error('Invalid username. Use: kingsley, mavis, rosemary, jacob, or constance');
        }
        
        console.log('Mapped to email:', email);
        
        // Sign in with Supabase
        const { data, error } = await window.utils.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Supabase auth error:', error);
            throw error;
        }
        
        if (!data.user) {
            throw new Error('Login failed: No user returned');
        }
        
        console.log('Auth successful, user:', data.user.id);
        
        // Store session information
        localStorage.setItem('session', JSON.stringify(data.session));
        localStorage.setItem('userId', data.user.id);
        
        // Get user profile from database
        console.log('Fetching profile for user:', data.user.id);
        
        const { data: profile, error: profileError } = await window.utils.supabase
            .from('profiles')
            .select('id, name, email, role, password_changed')
            .eq('id', data.user.id)
            .single();
        
        if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw new Error('Could not fetch user profile. Please contact admin.');
        }
        
        console.log('Profile fetched:', profile);
        
        // Store user info locally
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userName', profile.name);
        
        // Show success notification
        showNotification('Login Successful', `Welcome, ${profile.name}!`, 'success');
        
        // Check if first login (password not changed)
        if (!profile.password_changed) {
            setTimeout(() => {
                document.getElementById('notificationModal').style.display = 'none';
                openModal('passwordModal');
            }, 1500);
        } else {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        const errorMsg = error.message || 'Login failed. Please try again.';
        
        // Show error notification
        showNotification('Login Failed', errorMsg, 'error');
        
        // Also show inline error
        if (errorElement) {
            errorElement.textContent = errorMsg;
            errorElement.style.display = 'block';
        }
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        // Ensure utils is ready
        if (!window.utils || !window.utils.supabase) {
            throw new Error('System not initialized. Please refresh the page.');
        }
        
        // Validation
        if (!newPassword || !confirmPassword) {
            throw new Error('Please fill in all fields');
        }
        
        if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        
        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';
        }
        
        console.log('Updating password...');
        
        // Update password in Supabase Auth
        const { error: updateError } = await window.utils.supabase.auth.updateUser({
            password: newPassword
        });
        
        if (updateError) {
            console.error('Auth update error:', updateError);
            throw updateError;
        }
        
        // Get current user and update profile
        const { data: { user } } = await window.utils.supabase.auth.getUser();
        if (!user) throw new Error('Could not identify current user');
        
        console.log('Updating profile for user:', user.id);
        
        const { error: profileError } = await window.utils.supabase
            .from('profiles')
            .update({ password_changed: true })
            .eq('id', user.id);
        
        if (profileError) {
            console.error('Profile update error:', profileError);
            throw profileError;
        }
        
        console.log('Password changed successfully');
        
        // Success
        closeModal('passwordModal');
        showNotification('Success', 'Password updated successfully! Redirecting to dashboard...', 'success');
        
        // Clear password fields
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('Error', error.message || 'Failed to update password', 'error');
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Password';
        }
    }
}
