// Supabase configuration
const SUPABASE_URL = 'https://gqakrauxcwxpkqawvuul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxYWtyYXV4Y3d4cGtxYXd2dXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTU5MzAsImV4cCI6MjA4NzIzMTkzMH0.5ETItyGK4CpbC-cS4A3ac45mknl9jK_wMOHDoj-PwIA';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const toastContainer = document.getElementById('toastContainer');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Toast helper
function showToast(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// Check session on load
window.addEventListener('DOMContentLoaded', async () => {
    // Attempt to load dark mode based on preference
    const savedTheme = localStorage.getItem('metro_admin_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Already logged in, redirect to index
        window.location.href = 'index.html';
    }
});

// Handle login attempt
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showToast('Please enter email and password.', 'error');
        return;
    }

    // Set button loading state
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = 'Signing in...';
    loginBtn.disabled = true;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        showToast('Login successful!', 'success');

        // Redirect shortly after
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (err) {
        console.error('Login Error:', err);
        showToast(err.message || 'Failed to sign in. Please try again.', 'error');
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
});
