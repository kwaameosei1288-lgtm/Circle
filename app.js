// app.js

// DOM Elements
const loginPage = document.getElementById('login-page');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const paymentForm = document.getElementById('payment-form');
const paymentsTableBody = document.getElementById('payments-body');
const searchBar = document.getElementById('search-bar');
const monthFilter = document.getElementById('month-filter');
const reportMonth = document.getElementById('report-month');
const generateReportBtn = document.getElementById('generate-report-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const logoutBtn = document.getElementById('logout-btn');
const toast = document.getElementById('toast');

// Views
const dashboardView = document.getElementById('dashboard-view');
const addPaymentView = document.getElementById('add-payment-view');
const reportsView = document.getElementById('reports-view');
const settingsView = document.getElementById('settings-view');

// Navigation Links
const dashboardLink = document.getElementById('dashboard-link');
const addPaymentLink = document.getElementById('add-payment-link');
const reportsLink = document.getElementById('reports-link');
const settingsLink = document.getElementById('settings-link');

// Initialize app
function initApp() {
    // Check if user is logged in
    const user = getUser();
    if (user && user.loggedIn) {
        showDashboard();
    }

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    paymentForm.addEventListener('submit', handleAddPayment);
    logoutBtn.addEventListener('click', handleLogout);
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
    generateReportBtn.addEventListener('click', generateReport);
    exportPdfBtn.addEventListener('click', exportToPDF);
    searchBar.addEventListener('input', renderPayments);
    monthFilter.addEventListener('change', renderPayments);

    // Navigation
    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView(dashboardView);
    });
    addPaymentLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView(addPaymentView);
    });
    reportsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView(reportsView);
    });
    settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView(settingsView);
    });

    // Load initial data
    renderPayments();
}

// Show dashboard and hide login
function showDashboard() {
    loginPage.style.display = 'none';
    dashboard.style.display = 'flex';
    showView(dashboardView);
}

// Show a specific view
function showView(view) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });

    // Show selected view
    view.classList.add('active');

    // Update active link
    const links = [dashboardLink, addPaymentLink, reportsLink, settingsLink];
    links.forEach(link => link.classList.remove('active'));

    if (view === dashboardView) dashboardLink.classList.add('active');
    if (view === addPaymentView) addPaymentLink.classList.add('active');
    if (view === reportsView) reportsLink.classList.add('active');
    if (view === settingsView) settingsLink.classList.add('active');
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const user = getUser();

    if (username === user.username && password === user.password) {
        user.loggedIn = true;
        saveUser(user);
        showToast('Login successful!');
        showDashboard();
    } else {
        showToast('Invalid username or password!', true);
    }
}

// Handle logout
function handleLogout() {
    const user = getUser();
    user.loggedIn = false;
    saveUser(user);
    showToast('Logged out successfully.');
    loginPage.style.display = 'flex';
    dashboard.style.display = 'none';
}

// Handle adding a payment
function handleAddPayment(e) {
    e.preventDefault();
    const memberName = document.getElementById('member-name').value;
    const phoneNumber = document.getElementById('phone-number').value;
    const amountPaid = document.getElementById('amount-paid').value;
    const paymentDate = document.getElementById('payment-date').value;
    const paymentMonth = document.getElementById('payment-month').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const transactionId = document.getElementById('transaction-id').value;
    const notes = document.getElementById('notes').value;

    const payments = getPayments();
    const newPayment = {
        id: Date.now().toString(),
        memberName,
        phoneNumber,
        amountPaid: parseFloat(amountPaid),
        paymentDate,
        paymentMonth,
        paymentMethod,
        transactionId,
        notes,
        status: 'Paid'
    };

    payments.push(newPayment);
    savePayments(payments);
    showToast('Payment added successfully!');
    paymentForm.reset();
    renderPayments();
}

// Render payments table
function renderPayments() {
    const payments = getPayments();
    const searchTerm = searchBar.value.toLowerCase();
    const selectedMonth = monthFilter.value;

    let filteredPayments = payments.filter(payment => {
        return (
            (payment.memberName.toLowerCase().includes(searchTerm) ||
             payment.phoneNumber.includes(searchTerm) ||
             payment.transactionId.includes(searchTerm)) &&
            (selectedMonth === '' || payment.paymentMonth === selectedMonth)
        );
    });

    paymentsTableBody.innerHTML = filteredPayments.map(payment => `
        <tr>
            <td>${payment.memberName}</td>
            <td>$${payment.amountPaid.toFixed(2)}</td>
            <td>${payment.paymentDate}</td>
            <td>${payment.paymentMonth}</td>
            <td class="status-${payment.status.toLowerCase()}">${payment.status}</td>
            <td>${payment.transactionId}</td>
            <td>
                <button class="edit-btn" data-id="${payment.id}">Edit</button>
                <button class="delete-btn" data-id="${payment.id}">Delete</button>
            </td>
        </tr>
    `).join('');

    // Update summary cards
    updateSummaryCards(filteredPayments);
}

// Update summary cards
function updateSummaryCards(payments) {
    const totalExpected = 10000; // Example value, adjust as needed
    const totalReceived = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const outstandingAmount = totalExpected - totalReceived;
    const paidMembers = payments.length;

    document.getElementById('total-expected').textContent = `$${totalExpected.toFixed(2)}`;
    document.getElementById('total-received').textContent = `$${totalReceived.toFixed(2)}`;
    document.getElementById('outstanding-amount').textContent = `$${outstandingAmount.toFixed(2)}`;
    document.getElementById('paid-members').textContent = paidMembers;
}

// Show toast notification
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? '#ef4444' : 'var(--primary-color)';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Handle saving settings
function handleSaveSettings() {
    const treasurerName = document.getElementById('treasurer-name').value;
    const settings = getSettings();
    settings.treasurerName = treasurerName;
    saveSettings(settings);
    showToast('Settings saved!');
}

// Generate report
function generateReport() {
    const selectedMonth = reportMonth.value;
    const payments = getPayments();
    const filteredPayments = selectedMonth
        ? payments.filter(payment => payment.paymentMonth === selectedMonth)
        : payments;

    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = `
        <div class="form-container">
            <h2>Monthly Report for ${selectedMonth || 'All Months'}</h2>
            <p>Total Paid: $${filteredPayments.reduce((sum, p) => sum + p.amountPaid, 0).toFixed(2)}</p>
            <p>Paid Members: ${filteredPayments.length}</p>
            <div class="payment-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredPayments.map(payment => `
                            <tr>
                                <td>${payment.memberName}</td>
                                <td>$${payment.amountPaid.toFixed(2)}</td>
                                <td>${payment.paymentDate}</td>
                                <td>${payment.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    showToast('Report generated!');
}

// Initialize app on script load
initApp();