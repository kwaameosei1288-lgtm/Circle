// Members Logic

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

    // Initialize members page
    await initializeMembers();

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
            if (page !== 'members') {
                window.utils.loadPage(page);
            }
        });
    });

    // Filters
    document.getElementById('roleFilter').addEventListener('change', loadMembers);

    // Member form
    document.getElementById('memberForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveMember();
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

async function initializeMembers() {
    try {
        // Get user info
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

        // Load members
        await loadMembers();

    } catch (error) {
        console.error('Error initializing members:', error);
        window.utils.showToast('Error loading members data', 'error');
    }
}

async function loadMembers() {
    try {
        let query = window.utils.supabase
            .from('profiles')
            .select('*')
            .order('name');

        const roleFilter = document.getElementById('roleFilter').value;
        if (roleFilter) {
            query = query.eq('role', roleFilter);
        }

        const { data: members, error } = await query;

        if (error) throw error;

        const tbody = document.getElementById('membersTable');
        tbody.innerHTML = '';

        for (const member of members) {
            // Get payment status for current month
            const currentMonth = new Date().toLocaleString('default', { month: 'long' });
            const { data: payments, error: paymentError } = await window.utils.supabase
                .from('contributions')
                .select('status')
                .eq('member_id', member.id)
                .eq('month', currentMonth)
                .eq('status', 'paid');

            const paymentStatus = paymentError ? 'Unknown' : (payments.length > 0 ? 'Paid' : 'Pending');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.phone || '-'}</td>
                <td>${formatRole(member.role)}</td>
                <td><span class="status-badge status-${paymentStatus.toLowerCase()}">${paymentStatus}</span></td>
                <td>${window.utils.formatDate(member.created_at)}</td>
                <td>
                    ${window.utils.hasRole('admin') ? 
                        `<button class="btn-secondary" onclick="editMember('${member.id}')">Edit</button>` : 
                        '-'}
                </td>
            `;
            tbody.appendChild(row);
        }

    } catch (error) {
        console.error('Error loading members:', error);
        window.utils.showToast('Error loading members', 'error');
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

async function saveMember() {
    try {
        const memberData = {
            name: document.getElementById('memberName').value,
            email: document.getElementById('memberEmail').value,
            phone: document.getElementById('memberPhone').value,
            role: document.getElementById('memberRole').value
        };

        const memberId = document.getElementById('memberForm').dataset.memberId;

        if (memberId) {
            // Update existing member
            const { error } = await window.utils.supabase
                .from('profiles')
                .update(memberData)
                .eq('id', memberId);

            if (error) throw error;
            window.utils.showToast('Member updated successfully');
        } else {
            // Create new member (this would require creating auth user first)
            // For now, just show that this feature needs backend implementation
            window.utils.showToast('Adding new members requires backend setup', 'warning');
            return;
        }

        closeModal('memberModal');
        document.getElementById('memberForm').reset();
        delete document.getElementById('memberForm').dataset.memberId;
        await loadMembers();

    } catch (error) {
        console.error('Error saving member:', error);
        window.utils.showToast('Error saving member', 'error');
    }
}

async function editMember(id) {
    try {
        const { data: member, error } = await window.utils.supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('modalTitle').textContent = 'Edit Member';
        document.getElementById('memberName').value = member.name;
        document.getElementById('memberEmail').value = member.email;
        document.getElementById('memberPhone').value = member.phone || '';
        document.getElementById('memberRole').value = member.role;
        document.getElementById('memberForm').dataset.memberId = id;

        openModal('memberModal');

    } catch (error) {
        console.error('Error loading member for edit:', error);
        window.utils.showToast('Error loading member data', 'error');
    }
}

function openAddMemberModal() {
    if (!window.utils.hasRole('admin')) {
        window.utils.showToast('You do not have permission to add members', 'error');
        return;
    }
    document.getElementById('modalTitle').textContent = 'Add Member';
    document.getElementById('memberForm').reset();
    delete document.getElementById('memberForm').dataset.memberId;
    openModal('memberModal');
}