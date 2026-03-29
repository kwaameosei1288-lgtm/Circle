// Dashboard Logic

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

    // Initialize dashboard
    await initializeDashboard();

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
            if (page !== 'dashboard') {
                window.utils.loadPage(page);
            }
        });
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            document.getElementById('mainContent').classList.remove('sidebar-open');
        }
    });
});

async function initializeDashboard() {
    try {
        // Get user info
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

        // Load dashboard data
        await loadDashboardStats();
        await loadRecentContributions();

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        window.utils.showToast('Error loading dashboard data', 'error');
    }
}

async function loadDashboardStats() {
    try {
        // Get total contributions
        const { data: contributions, error: contribError } = await window.utils.supabase
            .from('contributions')
            .select('amount, status')
            .eq('status', 'paid');

        if (contribError) throw contribError;

        const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
        document.getElementById('totalContributions').textContent = window.utils.formatCurrency(totalContributions);

        // Get total received (same as contributions for now)
        document.getElementById('totalReceived').textContent = window.utils.formatCurrency(totalContributions);

        // Get outstanding payments
        const { data: outstanding, error: outstandingError } = await window.utils.supabase
            .from('contributions')
            .select('amount')
            .eq('status', 'pending');

        if (outstandingError) throw outstandingError;

        const outstandingAmount = outstanding.reduce((sum, c) => sum + c.amount, 0);
        document.getElementById('outstandingPayments').textContent = window.utils.formatCurrency(outstandingAmount);

        // Get welfare requests
        const { data: welfare, error: welfareError } = await window.utils.supabase
            .from('welfare_requests')
            .select('id')
            .eq('status', 'pending');

        if (welfareError) throw welfareError;

        document.getElementById('welfareRequests').textContent = welfare.length;

        // Get active members
        const { data: members, error: membersError } = await window.utils.supabase
            .from('profiles')
            .select('id');

        if (membersError) throw membersError;

        document.getElementById('activeMembers').textContent = members.length;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentContributions() {
    try {
        const { data: contributions, error } = await window.utils.supabase
            .from('contributions')
            .select(`
                *,
                profiles (name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        const tbody = document.getElementById('recentContributions');
        tbody.innerHTML = '';

        contributions.forEach(contrib => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contrib.profiles?.name || 'Unknown'}</td>
                <td>${window.utils.formatCurrency(contrib.amount)}</td>
                <td>${contrib.month}</td>
                <td><span class="status-badge status-${contrib.status}">${contrib.status}</span></td>
                <td>${window.utils.formatDate(contrib.created_at)}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading recent contributions:', error);
    }
}