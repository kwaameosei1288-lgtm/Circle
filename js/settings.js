// Settings Logic

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

    // Initialize settings page
    await initializeSettings();

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
            if (page !== 'settings') {
                window.utils.loadPage(page);
            }
        });
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('change', toggleTheme);

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

async function initializeSettings() {
    try {
        // Get user info
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

        // Check if admin
        if (window.utils.hasRole('admin')) {
            document.getElementById('adminSettings').style.display = 'block';
        }

        // Load theme preference
        const theme = localStorage.getItem('theme') || 'light';
        document.getElementById('themeToggle').checked = theme === 'dark';
        document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
        applyTheme(theme);

    } catch (error) {
        console.error('Error initializing settings:', error);
        window.utils.showToast('Error loading settings', 'error');
    }
}

function toggleTheme() {
    const isDark = document.getElementById('themeToggle').checked;
    const theme = isDark ? 'dark' : 'light';
    document.getElementById('themeLabel').textContent = isDark ? 'Dark Mode' : 'Light Mode';
    
    localStorage.setItem('theme', theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.style.setProperty('--primary-color', '#60A5FA');
        root.style.setProperty('--accent-color', '#1F2937');
        root.style.setProperty('--text-color', '#F9FAFB');
        root.style.setProperty('--bg-color', '#111827');
        root.style.setProperty('--card-bg', 'rgba(31, 41, 55, 0.95)');
        root.style.setProperty('--border-color', '#374151');
    } else {
        root.style.setProperty('--primary-color', '#10B981');
        root.style.setProperty('--accent-color', '#1F2937');
        root.style.setProperty('--text-color', '#374151');
        root.style.setProperty('--bg-color', '#F9FAFB');
        root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--border-color', '#E5E7EB');
    }
}

function confirmResetSystem() {
    if (!window.utils.hasRole('admin')) {
        window.utils.showToast('You do not have permission to reset the system', 'error');
        return;
    }

    document.getElementById('confirmMessage').textContent = 
        'Are you sure you want to reset the entire system? This will delete all data and cannot be undone.';
    
    document.getElementById('confirmYes').onclick = resetSystem;
    openModal('confirmModal');
}

async function resetSystem() {
    try {
        // This is a dangerous operation - in a real app, this would require additional confirmation
        // For now, we'll just show a message
        window.utils.showToast('System reset functionality would be implemented here', 'warning');
        closeModal('confirmModal');

    } catch (error) {
        console.error('Error resetting system:', error);
        window.utils.showToast('Error resetting system', 'error');
    }
}