/* ═══════════════════════════════════════════
   Metro Admin — Login Page Logic
   Supabase email/password auth only
   ═══════════════════════════════════════════ */

const SUPABASE_URL = 'https://gqakrauxcwxpkqawvuul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxYWtyYXV4Y3d4cGtxYXd2dXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTU5MzAsImV4cCI6MjA4NzIzMTkzMH0.5ETItyGK4CpbC-cS4A3ac45mknl9jK_wMOHDoj-PwIA';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DOM refs ───
const $loginForm = document.getElementById('loginForm');
const $email = document.getElementById('email');
const $password = document.getElementById('password');
const $loginBtn = document.getElementById('loginBtn');
const $errorMessage = document.getElementById('errorMessage');
const $togglePassword = document.getElementById('togglePassword');

// ─── If already logged in, redirect ───
(async function checkSession() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session) {
            window.location.href = 'index.html';
        }
    } catch (_) { /* ignore */ }
})();

// ─── Toggle password visibility ───
$togglePassword.addEventListener('click', () => {
    const isPassword = $password.type === 'password';
    $password.type = isPassword ? 'text' : 'password';
    $togglePassword.classList.toggle('active', isPassword);
});

// ─── Form submit ───
$loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = $email.value.trim();
    const password = $password.value;

    if (!email || !password) {
        showError('Please enter your email and password.');
        return;
    }

    setLoading(true);
    hideError();

    try {
        const { data, error } = await _supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            showError(error.message || 'Invalid email or password.');
            setLoading(false);
            return;
        }

        if (data.session) {
            window.location.href = 'index.html';
        } else {
            showError('Login failed. Please try again.');
            setLoading(false);
        }
    } catch (err) {
        console.error('[Auth] Login error:', err);
        showError('An unexpected error occurred. Please try again.');
        setLoading(false);
    }
});

// ─── Helpers ───
function showError(msg) {
    $errorMessage.textContent = msg;
    $errorMessage.classList.add('visible');
}

function hideError() {
    $errorMessage.textContent = '';
    $errorMessage.classList.remove('visible');
}

function setLoading(isLoading) {
    if (isLoading) {
        $loginBtn.classList.add('loading');
    } else {
        $loginBtn.classList.remove('loading');
    }
}
