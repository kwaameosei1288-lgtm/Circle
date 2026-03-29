// Constitution Logic

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

    // Initialize constitution page
    await initializeConstitution();

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
            if (page !== 'constitution') {
                window.utils.loadPage(page);
            }
        });
    });

    // Acceptance form
    document.getElementById('acceptanceForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await acceptConstitution();
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

async function initializeConstitution() {
    try {
        // Get user info
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

        // Check if user has accepted constitution
        const user = await window.utils.getCurrentUser();
        const { data: acceptance, error } = await window.utils.supabase
            .from('constitution_acceptance')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw error;
        }

        if (acceptance) {
            // User has already accepted
            document.getElementById('acceptanceCard').style.display = 'none';
        }

    } catch (error) {
        console.error('Error initializing constitution:', error);
        window.utils.showToast('Error loading constitution', 'error');
    }
}

async function acceptConstitution() {
    try {
        const user = await window.utils.getCurrentUser();
        const { error } = await window.utils.supabase
            .from('constitution_acceptance')
            .insert([{
                user_id: user.id,
                accepted_at: new Date().toISOString()
            }]);

        if (error) throw error;

        window.utils.showToast('Constitution accepted successfully');
        document.getElementById('acceptanceCard').style.display = 'none';

    } catch (error) {
        console.error('Error accepting constitution:', error);
        window.utils.showToast('Error accepting constitution', 'error');
    }
}