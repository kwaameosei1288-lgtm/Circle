// Reports Logic

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

    // Initialize reports page
    await initializeReports();

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
            if (page !== 'reports') {
                window.utils.loadPage(page);
            }
        });
    });

    // Set current month
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    document.getElementById('reportMonth').value = currentMonth;

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

async function initializeReports() {
    try {
        // Get user info
        const userName = localStorage.getItem('userName') || 'User';
        document.getElementById('userName').textContent = userName;
        document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

    } catch (error) {
        console.error('Error initializing reports:', error);
        window.utils.showToast('Error loading reports', 'error');
    }
}

async function generateWeeklyReport() {
    try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        // Get contributions for the week
        const { data: contributions, error: contribError } = await window.utils.supabase
            .from('contributions')
            .select(`
                *,
                profiles (name)
            `)
            .gte('created_at', weekStart.toISOString())
            .order('created_at', { ascending: false });

        if (contribError) throw contribError;

        // Get welfare requests for the week
        const { data: welfare, error: welfareError } = await window.utils.supabase
            .from('welfare_requests')
            .select(`
                *,
                profiles (name)
            `)
            .gte('created_at', weekStart.toISOString())
            .order('created_at', { ascending: false });

        if (welfareError) throw welfareError;

        // Generate PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Helping Hands Circle - Weekly Report', 20, 30);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

        let yPosition = 65;

        // Contributions Summary
        doc.setFontSize(16);
        doc.text('Contributions Summary', 20, yPosition);
        yPosition += 15;

        const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
        const paidCount = contributions.filter(c => c.status === 'paid').length;
        const pendingCount = contributions.filter(c => c.status === 'pending').length;

        doc.setFontSize(12);
        doc.text(`Total Contributions: GHS ${totalContributions}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Paid: ${paidCount}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Pending: ${pendingCount}`, 20, yPosition);
        yPosition += 20;

        // Welfare Summary
        doc.setFontSize(16);
        doc.text('Welfare Summary', 20, yPosition);
        yPosition += 15;

        const approvedCount = welfare.filter(w => w.status === 'approved').length;
        const pendingWelfareCount = welfare.filter(w => w.status === 'pending').length;

        doc.setFontSize(12);
        doc.text(`Total Requests: ${welfare.length}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Approved: ${approvedCount}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Pending: ${pendingWelfareCount}`, 20, yPosition);

        doc.save('weekly_report.pdf');
        window.utils.showToast('Weekly report generated successfully');

    } catch (error) {
        console.error('Error generating weekly report:', error);
        window.utils.showToast('Error generating report', 'error');
    }
}

async function generateMonthlyReport() {
    try {
        const selectedMonth = document.getElementById('reportMonth').value;

        // Get contributions for the month
        const { data: contributions, error: contribError } = await window.utils.supabase
            .from('contributions')
            .select(`
                *,
                profiles (name)
            `)
            .eq('month', selectedMonth)
            .order('created_at', { ascending: false });

        if (contribError) throw contribError;

        // Get welfare requests for the month
        const { data: welfare, error: welfareError } = await window.utils.supabase
            .from('welfare_requests')
            .select(`
                *,
                profiles (name)
            `)
            .eq('month', selectedMonth)
            .order('created_at', { ascending: false });

        if (welfareError) throw welfareError;

        // Generate PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(`Helping Hands Circle - ${selectedMonth} Report`, 20, 30);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

        let yPosition = 65;

        // Contributions Summary
        doc.setFontSize(16);
        doc.text('Contributions Summary', 20, yPosition);
        yPosition += 15;

        const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
        const paidCount = contributions.filter(c => c.status === 'paid').length;
        const pendingCount = contributions.filter(c => c.status === 'pending').length;

        doc.setFontSize(12);
        doc.text(`Total Contributions: GHS ${totalContributions}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Paid: ${paidCount}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Pending: ${pendingCount}`, 20, yPosition);
        yPosition += 20;

        // Welfare Summary
        doc.setFontSize(16);
        doc.text('Welfare Summary', 20, yPosition);
        yPosition += 15;

        const approvedCount = welfare.filter(w => w.status === 'approved').length;
        const pendingWelfareCount = welfare.filter(w => w.status === 'pending').length;

        doc.setFontSize(12);
        doc.text(`Total Requests: ${welfare.length}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Approved: ${approvedCount}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Pending: ${pendingWelfareCount}`, 20, yPosition);

        doc.save(`${selectedMonth}_report.pdf`);
        window.utils.showToast('Monthly report generated successfully');

    } catch (error) {
        console.error('Error generating monthly report:', error);
        window.utils.showToast('Error generating report', 'error');
    }
}

async function exportWeeklyCSV() {
    try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        // Get contributions for the week
        const { data: contributions, error } = await window.utils.supabase
            .from('contributions')
            .select(`
                *,
                profiles (name)
            `)
            .gte('created_at', weekStart.toISOString());

        if (error) throw error;

        const csvData = contributions.map(c => ({
            'Member': c.profiles?.name || 'Unknown',
            'Amount': c.amount,
            'Payment Type': c.payment_type,
            'Month': c.month,
            'Status': c.status,
            'Date': new Date(c.created_at).toLocaleDateString()
        }));

        const csv = Papa.unparse(csvData);
        downloadCSV(csv, 'weekly_contributions.csv');
        window.utils.showToast('Weekly CSV exported successfully');

    } catch (error) {
        console.error('Error exporting weekly CSV:', error);
        window.utils.showToast('Error exporting CSV', 'error');
    }
}

async function exportMonthlyCSV() {
    try {
        const selectedMonth = document.getElementById('reportMonth').value;

        // Get contributions for the month
        const { data: contributions, error } = await window.utils.supabase
            .from('contributions')
            .select(`
                *,
                profiles (name)
            `)
            .eq('month', selectedMonth);

        if (error) throw error;

        const csvData = contributions.map(c => ({
            'Member': c.profiles?.name || 'Unknown',
            'Amount': c.amount,
            'Payment Type': c.payment_type,
            'Month': c.month,
            'Status': c.status,
            'Date': new Date(c.created_at).toLocaleDateString()
        }));

        const csv = Papa.unparse(csvData);
        downloadCSV(csv, `${selectedMonth}_contributions.csv`);
        window.utils.showToast('Monthly CSV exported successfully');

    } catch (error) {
        console.error('Error exporting monthly CSV:', error);
        window.utils.showToast('Error exporting CSV', 'error');
    }
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}