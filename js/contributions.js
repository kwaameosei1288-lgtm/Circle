// Contributions Logic

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

    // Initialize contributions page
    await initializeContributions();

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
            if (page !== 'contributions') {
                window.utils.loadPage(page);
            }
        });
    });

    // Filters
    document.getElementById('monthFilter').addEventListener('change', loadContributions);
    document.getElementById('statusFilter').addEventListener('change', loadContributions);

    // Add payment form
    document.getElementById('addPaymentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await addPayment();
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

async function initializeContributions() {
    try {
        // Get user info
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

        // Load members for dropdown
        await loadMembers();

        // Load contributions
        await loadContributions();

    } catch (error) {
        console.error('Error initializing contributions:', error);
        window.utils.showToast('Error loading contributions data', 'error');
    }
}

async function loadMembers() {
    try {
        const { data: members, error } = await window.utils.supabase
            .from('profiles')
            .select('id, name')
            .order('name');

        if (error) throw error;

        const select = document.getElementById('memberSelect');
        select.innerHTML = '<option value="">Select Member</option>';

        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading members:', error);
    }
}

async function loadContributions() {
    try {
        let query = window.utils.supabase
            .from('contributions')
            .select(`
                *,
                profiles (name)
            `)
            .order('created_at', { ascending: false });

        const monthFilter = document.getElementById('monthFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        if (monthFilter) {
            query = query.eq('month', monthFilter);
        }

        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }

        const { data: contributions, error } = await query;

        if (error) throw error;

        const tbody = document.getElementById('contributionsTable');
        tbody.innerHTML = '';

        contributions.forEach(contrib => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contrib.profiles?.name || 'Unknown'}</td>
                <td>${window.utils.formatCurrency(contrib.amount)}</td>
                <td>${contrib.payment_type}</td>
                <td>${contrib.month}</td>
                <td>${contrib.transaction_id || '-'}</td>
                <td><span class="status-badge status-${contrib.status}">${contrib.status}</span></td>
                <td>${window.utils.formatDate(contrib.created_at)}</td>
                <td>
                    ${window.utils.hasRole('treasurer') || window.utils.hasRole('admin') ? 
                        `<button class="btn-secondary" onclick="updateStatus('${contrib.id}', '${contrib.status === 'paid' ? 'pending' : 'paid'}')">Toggle Status</button>` : 
                        '-'}
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading contributions:', error);
        window.utils.showToast('Error loading contributions', 'error');
    }
}

async function addPayment() {
    try {
        const formData = {
            member_id: document.getElementById('memberSelect').value,
            amount: parseFloat(document.getElementById('amount').value),
            payment_type: document.getElementById('paymentType').value,
            month: document.getElementById('paymentMonth').value,
            transaction_id: document.getElementById('transactionId').value || null,
            status: 'paid',
            created_at: new Date().toISOString()
        };

        const { error } = await window.utils.supabase
            .from('contributions')
            .insert([formData]);

        if (error) throw error;

        window.utils.showToast('Payment added successfully');
        closeModal('addPaymentModal');
        document.getElementById('addPaymentForm').reset();
        await loadContributions();

    } catch (error) {
        console.error('Error adding payment:', error);
        window.utils.showToast('Error adding payment', 'error');
    }
}

async function updateStatus(id, newStatus) {
    try {
        const { error } = await window.utils.supabase
            .from('contributions')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;

        window.utils.showToast('Status updated successfully');
        await loadContributions();

    } catch (error) {
        console.error('Error updating status:', error);
        window.utils.showToast('Error updating status', 'error');
    }
}

function openAddPaymentModal() {
    if (!window.utils.hasRole('treasurer') && !window.utils.hasRole('admin')) {
        window.utils.showToast('You do not have permission to add payments', 'error');
        return;
    }
    openModal('addPaymentModal');
}