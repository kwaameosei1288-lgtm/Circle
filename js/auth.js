// Authentication Logic

// Wait for utils to be ready
function waitForUtils() {
    return new Promise((resolve) => {
        if (window.utils && window.utils.supabase) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.utils && window.utils.supabase) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.error('Utils initialization timeout');
                resolve();
            }, 5000);
        }
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    // Ensure utils is initialized
    await waitForUtils();
    
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
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Modal close
    document.querySelector('.close').addEventListener('click', function() {
        closeModal('passwordModal');
    });
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('passwordModal');
        if (event.target === modal) {
            closeModal('passwordModal');
        }
    });
});

// Check for existing session
async function checkExistingSession() {
    try {
        if (!window.utils || !window.utils.supabase) {
            console.log('Utils not ready yet');
            return;
        }
        
        const { data: { session } } = await window.utils.supabase.auth.getSession();
        if (session) {
            // Verify user profile exists
            const { data: profile } = await window.utils.supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profile) {
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
    
    // Clear previous error
    errorElement.textContent = '';
    
    try {
        // Ensure utils is ready
        if (!window.utils || !window.utils.supabase) {
            throw new Error('System not initialized. Please refresh the page.');
        }
        
        // Disable submit button and show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
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
            throw new Error('Invalid username. Use: kingsley, mavis, rosemary, jacob, or constance');
        }
        
        // Sign in with Supabase
        const { data, error } = await window.utils.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        if (!data.user) throw new Error('Login failed: No user returned');
        
        // Store session information
        localStorage.setItem('session', JSON.stringify(data.session));
        localStorage.setItem('userId', data.user.id);
        
        // Get user profile from database
        const { data: profile, error: profileError } = await window.utils.supabase
            .from('profiles')
            .select('id, name, email, role, password_changed')
            .eq('id', data.user.id)
            .single();
        
        if (profileError) {
            throw new Error('Could not fetch user profile. Please contact admin.');
        }
        
        // Store user info locally
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userName', profile.name);
        
        // Check if first login (password not changed)
        if (!profile.password_changed) {
            window.utils.showToast('Please change your password on first login', 'info');
            setTimeout(() => {
                openModal('passwordModal');
            }, 500);
        } else {
            window.location.href = 'dashboard.html';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = error.message || 'Login failed. Please try again.';
        errorElement.style.display = 'block';
    } finally {
        // Re-enable submit button
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    }
}

// Password change handler
document.addEventListener('DOMContentLoaded', function() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
});

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
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
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
        
        // Update password in Supabase Auth
        const { error: updateError } = await window.utils.supabase.auth.updateUser({
            password: newPassword
        });
        
        if (updateError) throw updateError;
        
        // Get current user and update profile
        const { data: { user } } = await window.utils.supabase.auth.getUser();
        if (!user) throw new Error('Could not identify current user');
        
        const { error: profileError } = await window.utils.supabase
            .from('profiles')
            .update({ password_changed: true })
            .eq('id', user.id);
        
        if (profileError) throw profileError;
        
        // Success
        closeModal('passwordModal');
        window.utils.showToast('Password updated successfully!', 'success');
        
        // Clear password fields
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Password change error:', error);
        window.utils.showToast(error.message || 'Failed to update password', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
    }
}