// Welfare Logic

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

    // Initialize welfare page
    await initializeWelfare();

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
            if (page !== 'welfare') {
                window.utils.loadPage(page);
            }
        });
    });

    // Filters
    document.getElementById('statusFilter').addEventListener('change', loadWelfareRequests);

    // Request form
    document.getElementById('requestForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await submitWelfareRequest();
    });

    // Request type change
    document.getElementById('requestType').addEventListener('change', function() {
        const type = this.value;
        const amountGroup = document.getElementById('amountGroup');
        const customAmount = document.getElementById('customAmount');
        
        if (type === 'external_support') {
            amountGroup.style.display = 'block';
            customAmount.required = true;
        } else {
            amountGroup.style.display = 'none';
            customAmount.required = false;
        }
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

async function initializeWelfare() {
    try {
        // Get user info
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

        // Load welfare requests
        await loadWelfareRequests();

    } catch (error) {
        console.error('Error initializing welfare:', error);
        window.utils.showToast('Error loading welfare data', 'error');
    }
}

async function loadWelfareRequests() {
    try {
        let query = window.utils.supabase
            .from('welfare_requests')
            .select(`
                *,
                profiles (name)
            `)
            .order('created_at', { ascending: false });

        const statusFilter = document.getElementById('statusFilter').value;
        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }

        const { data: requests, error } = await query;

        if (error) throw error;

        const tbody = document.getElementById('welfareTable');
        tbody.innerHTML = '';

        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.profiles?.name || 'Unknown'}</td>
                <td>${formatRequestType(request.request_type)}</td>
                <td>${request.amount ? window.utils.formatCurrency(request.amount) : '-'}</td>
                <td>${request.reason}</td>
                <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                <td>${window.utils.formatDate(request.created_at)}</td>
                <td>
                    ${canApproveReject(request.status) ? 
                        `<button class="btn-primary" onclick="approveRequest('${request.id}')">Approve</button>
                         <button class="btn-danger" onclick="rejectRequest('${request.id}')">Reject</button>` : 
                        '-'}
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading welfare requests:', error);
        window.utils.showToast('Error loading welfare requests', 'error');
    }
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

function canApproveReject(status) {
    return (window.utils.hasRole('welfare_officer') || window.utils.hasRole('assistant_welfare_officer') || window.utils.hasRole('admin')) && status === 'pending';
}

async function submitWelfareRequest() {
    try {
        const user = await window.utils.getCurrentUser();
        const requestType = document.getElementById('requestType').value;
        const reason = document.getElementById('reason').value;
        
        let amount = null;
        if (requestType === 'marriage') amount = 2000;
        else if (requestType === 'funeral_parents') amount = 3000;
        else if (requestType === 'sickness_serious') amount = 1000;
        else if (requestType === 'external_support') amount = parseFloat(document.getElementById('customAmount').value);

        const requestData = {
            user_id: user.id,
            request_type: requestType,
            amount: amount,
            reason: reason,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { error } = await window.utils.supabase
            .from('welfare_requests')
            .insert([requestData]);

        if (error) throw error;

        window.utils.showToast('Welfare request submitted successfully');
        closeModal('requestModal');
        document.getElementById('requestForm').reset();
        await loadWelfareRequests();

    } catch (error) {
        console.error('Error submitting welfare request:', error);
        window.utils.showToast('Error submitting request', 'error');
    }
}

async function approveRequest(id) {
    try {
        const { error } = await window.utils.supabase
            .from('welfare_requests')
            .update({ status: 'approved' })
            .eq('id', id);

        if (error) throw error;

        window.utils.showToast('Request approved successfully');
        await loadWelfareRequests();

    } catch (error) {
        console.error('Error approving request:', error);
        window.utils.showToast('Error approving request', 'error');
    }
}

async function rejectRequest(id) {
    try {
        const { error } = await window.utils.supabase
            .from('welfare_requests')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) throw error;

        window.utils.showToast('Request rejected');
        await loadWelfareRequests();

    } catch (error) {
        console.error('Error rejecting request:', error);
        window.utils.showToast('Error rejecting request', 'error');
    }
}

function openRequestModal() {
    openModal('requestModal');
}