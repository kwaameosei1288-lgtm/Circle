// Dashboard Logic

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check authentication
        const session = localStorage.getItem('session');
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        // Wait for utils to be initialized
        if (!window.utils || !window.utils.supabase) {
            // Wait up to 5 seconds for utils to load
            for (let i = 0; i < 50; i++) {
                if (window.utils && window.utils.supabase) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (!window.utils || !window.utils.supabase) {
                throw new Error('Failed to initialize system. Please refresh the page.');
            }
        }

        // Initialize Supabase with session
        const sessionData = JSON.parse(session);
        if (window.utils.supabase.auth.setSession) {
            await window.utils.supabase.auth.setSession(sessionData);
        }

        // Verify the session is valid
        const { data: { user }, error } = await window.utils.supabase.auth.getUser();
        if (error || !user) {
            console.error('Invalid session, redirecting to login:', error);
            localStorage.removeItem('session');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            window.location.href = 'index.html';
            return;
        }

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
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        window.location.href = 'index.html';
    }
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
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');

        // Get total contributions (user's own or all if admin/treasurer)
        try {
            let query = window.utils.supabase
                .from('contributions')
                .select('amount, status')
                .eq('status', 'paid');
            
            if (userRole !== 'admin' && userRole !== 'treasurer') {
                query = query.eq('member_id', userId);
            }
            
            const { data: contributions, error: contribError } = await query;
            if (contribError) throw contribError;

            const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
            document.getElementById('totalContributions').textContent = window.utils.formatCurrency(totalContributions);

            // Get total received (same as contributions for now)
            document.getElementById('totalReceived').textContent = window.utils.formatCurrency(totalContributions);
        } catch (error) {
            console.error('Error loading contributions:', error);
            document.getElementById('totalContributions').textContent = 'N/A';
            document.getElementById('totalReceived').textContent = 'N/A';
        }

        // Get outstanding payments (user's own or all if admin/treasurer)
        try {
            let query = window.utils.supabase
                .from('contributions')
                .select('amount')
                .eq('status', 'pending');
            
            if (userRole !== 'admin' && userRole !== 'treasurer') {
                query = query.eq('member_id', userId);
            }
            
            const { data: outstanding, error: outstandingError } = await query;
            if (outstandingError) throw outstandingError;

            const outstandingAmount = outstanding.reduce((sum, c) => sum + c.amount, 0);
            document.getElementById('outstandingPayments').textContent = window.utils.formatCurrency(outstandingAmount);
        } catch (error) {
            console.error('Error loading outstanding payments:', error);
            document.getElementById('outstandingPayments').textContent = 'N/A';
        }

        // Get welfare requests (user's own or all if welfare officer)
        try {
            let query = window.utils.supabase
                .from('welfare_requests')
                .select('id')
                .eq('status', 'pending');
            
            if (userRole !== 'admin' && userRole !== 'welfare_officer' && userRole !== 'assistant_welfare_officer') {
                query = query.eq('user_id', userId);
            }
            
            const { data: welfare, error: welfareError } = await query;
            if (welfareError) throw welfareError;

            document.getElementById('welfareRequests').textContent = welfare.length;
        } catch (error) {
            console.error('Error loading welfare requests:', error);
            document.getElementById('welfareRequests').textContent = '0';
        }

        // Get active members (only if admin)
        try {
            if (userRole === 'admin') {
                const { data: members, error: membersError } = await window.utils.supabase
                    .from('profiles')
                    .select('id');
                
                if (membersError) throw membersError;
                document.getElementById('activeMembers').textContent = members.length;
            } else {
                document.getElementById('activeMembers').textContent = 'N/A';
            }
        } catch (error) {
            console.error('Error loading members:', error);
            document.getElementById('activeMembers').textContent = 'N/A';
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentContributions() {
    try {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');

        let query = window.utils.supabase
            .from('contributions')
            .select(`
                *,
                profiles (name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (userRole !== 'admin' && userRole !== 'treasurer') {
            query = query.eq('member_id', userId);
        }

        const { data: contributions, error } = await query;

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