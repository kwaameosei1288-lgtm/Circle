// Authentication Logic

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const session = localStorage.getItem('session');
    if (session) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Hide bootloader after 2 seconds
    setTimeout(() => {
        document.getElementById('bootloader').style.display = 'none';
    }, 2000);

    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
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
            
            // Sign in with Supabase
            const { data, error } = await window.utils.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            // Store session
            localStorage.setItem('session', JSON.stringify(data.session));
            
            // Get user profile
            const { data: profile, error: profileError } = await window.utils.supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            
            if (profileError) throw profileError;
            
            localStorage.setItem('userRole', profile.role);
            localStorage.setItem('userName', profile.name);
            
            // Check if first login (password not changed)
            if (!profile.password_changed) {
                openModal('passwordModal');
            } else {
                window.location.href = 'dashboard.html';
            }
            
        } catch (error) {
            document.getElementById('errorMessage').textContent = error.message;
        }
    });

    // Password change form
    document.getElementById('passwordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        if (newPassword.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }
        
        try {
            const { error } = await window.utils.supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) throw error;
            
            // Update profile
            const user = await window.utils.getCurrentUser();
            await window.utils.supabase
                .from('profiles')
                .update({ password_changed: true })
                .eq('id', user.id);
            
            closeModal('passwordModal');
            window.utils.showToast('Password updated successfully');
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            alert('Error updating password: ' + error.message);
        }
    });

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