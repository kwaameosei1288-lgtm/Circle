// storage.js

// Initialize localStorage with default data if not present
function initializeStorage() {
    if (!localStorage.getItem('payments')) {
        localStorage.setItem('payments', JSON.stringify([]));
    }
    if (!localStorage.getItem('user')) {
        const defaultUser = {
            username: 'Mavis',
            password: 'Password123',
            loggedIn: false,
            passwordChanged: false
        };
        localStorage.setItem('user', JSON.stringify(defaultUser));
    }
    if (!localStorage.getItem('settings')) {
        localStorage.setItem('settings', JSON.stringify({ treasurerName: 'Mavis', darkMode: true }));
    }
}

// Save payments to localStorage
function savePayments(payments) {
    localStorage.setItem('payments', JSON.stringify(payments));
}

// Get payments from localStorage
function getPayments() {
    return JSON.parse(localStorage.getItem('payments'));
}

// Save user to localStorage
function saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Get user from localStorage
function getUser() {
    return JSON.parse(localStorage.getItem('user'));
}

// Save settings to localStorage
function saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
}

// Get settings from localStorage
function getSettings() {
    return JSON.parse(localStorage.getItem('settings'));
}

// Initialize storage on script load
initializeStorage();