// Profile Logic

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const session = localStorage.getItem('session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize Supabase with session
    const sessionData = JSON.parse(session);
    window.utils.supabase.auth.setSession(sessionData);

    // Hide bootloader
    setTimeout(() => {
        document.getElementById('bootloader').style.display = 'none';
    }, 1000);

    // Initialize profile page
    await initializeProfile();

    // Sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('sidebar-open');
    });

    // Navigation
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page !== 'profile') {
                window.utils.loadPage(page);
            }
        });
    });

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateProfile();
    });

    // Password form
    document.getElementById('passwordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await changePassword();
    });

    // Close sidebar on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            document.getElementById('mainContent').classList.remove('sidebar-open');
        }
    });
});

async function initializeProfile() {
    try {
        // Get user info
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

        // Load profile data
        await loadProfileData();

        // Load user's contributions
        await loadMyContributions();

        // Load user's welfare requests
        await loadMyWelfareRequests();

    } catch (error) {
        console.error('Error initializing profile:', error);
        window.utils.showToast('Error loading profile data', 'error');
    }
}

async function loadProfileData() {
    try {
        const user = await window.utils.getCurrentUser();
        const { data: profile, error } = await window.utils.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        document.getElementById('profileName').value = profile.name;
        document.getElementById('profileEmail').value = profile.email;
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileRole').value = formatRole(profile.role);

    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

async function loadMyContributions() {
    try {
        const user = await window.utils.getCurrentUser();
        const { data: contributions, error } = await window.utils.supabase
            .from('contributions')
            .select('*')
            .eq('member_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('myContributions');
        tbody.innerHTML = '';

        contributions.forEach(contrib => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${window.utils.formatCurrency(contrib.amount)}</td>
                <td>${contrib.payment_type}</td>
                <td>${contrib.month}</td>
                <td><span class="status-badge status-${contrib.status}">${contrib.status}</span></td>
                <td>${window.utils.formatDate(contrib.created_at)}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading contributions:', error);
    }
}

async function loadMyWelfareRequests() {
    try {
        const user = await window.utils.getCurrentUser();
        const { data: requests, error } = await window.utils.supabase
            .from('welfare_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('myWelfareRequests');
        tbody.innerHTML = '';

        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatRequestType(request.request_type)}</td>
                <td>${request.amount ? window.utils.formatCurrency(request.amount) : '-'}</td>
                <td>${request.reason}</td>
                <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                <td>${window.utils.formatDate(request.created_at)}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading welfare requests:', error);
    }
}

function formatRole(role) {
    const roles = {
        'admin': 'Admin',
        'treasurer': 'Treasurer',
        'secretary': 'Secretary',
        'welfare_officer': 'Welfare Officer',
        'assistant_welfare_officer': 'Assistant Welfare Officer',
        'member': 'Member'
    };
    return roles[role] || role;
}

function formatRequestType(type) {
    const types = {
        'marriage': 'Marriage',
        'funeral_parents': 'Funeral (Parents)',
        'sickness_serious': 'Sickness - Serious',
        'sickness_minor': 'Sickness - Minor',
        'external_support': 'External Support'
    };
    return types[type] || type;
}

async function updateProfile() {
    try {
        const user = await window.utils.getCurrentUser();
        const phone = document.getElementById('profilePhone').value;

        const { error } = await window.utils.supabase
            .from('profiles')
            .update({ phone: phone })
            .eq('id', user.id);

        if (error) throw error;

        window.utils.showToast('Profile updated successfully');

    } catch (error) {
        console.error('Error updating profile:', error);
        window.utils.showToast('Error updating profile', 'error');
    }
}

async function changePassword() {
    try {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmPassword) {
            window.utils.showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            window.utils.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        // First verify current password by attempting sign in
        const user = await window.utils.getCurrentUser();
        const { data: profile } = await window.utils.supabase
            .from('profiles')
            .select('email')
            .eq('id', user.id)
            .single();

        const { error: signInError } = await window.utils.supabase.auth.signInWithPassword({
            email: profile.email,
            password: currentPassword
        });

        if (signInError) {
            window.utils.showToast('Current password is incorrect', 'error');
            return;
        }

        // Update password
        const { error } = await window.utils.supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        window.utils.showToast('Password changed successfully');
        document.getElementById('passwordForm').reset();

    } catch (error) {
        console.error('Error changing password:', error);
        window.utils.showToast('Error changing password', 'error');
    }
}