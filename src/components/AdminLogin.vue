<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabaseClient';

const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);

const toast = ref({ show: false, message: '', type: 'error' });

function showToast(message, type = 'error') {
  toast.value = { show: true, message, type };
}

async function handleLogin() {
  const user = username.value.trim();
  const pass = password.value.trim();

  if (!user || !pass) {
    showToast('Please enter both username and password.');
    return;
  }

  loading.value = true;

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_name', user)
    .eq('password', pass)
    .maybeSingle();

  loading.value = false;

  if (error) {
    showToast('Login failed: ' + error.message);
    return;
  }

  if (!data) {
    showToast('Invalid username or password.');
    return;
  }

  sessionStorage.setItem('admin_id', data.id);
  router.push('/dashboard');
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-icon">&#128274;</div>
      <h1>Admin Login</h1>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter username"
            autocomplete="username"
          />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
          />
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>

    <Transition name="modal">
      <div v-if="toast.show" class="modal-overlay" @click.self="toast.show = false">
        <div class="modal-card">
          <div class="toast-icon-large" :class="toast.type">
            {{ toast.type === 'success' ? '\u2713' : '\u26A0' }}
          </div>
          <p class="modal-message">{{ toast.message }}</p>
          <div class="modal-actions">
            <button class="modal-btn ok-btn" :class="toast.type === 'error' ? 'error-btn' : ''" @click="toast.show = false">OK</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Segoe UI', sans-serif;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 20px;
  padding: 40px 32px 32px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.login-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

h1 {
  margin: 0 0 28px;
  font-size: 22px;
  color: #333;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  text-align: left;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.field input {
  width: 100%;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  font-size: 16px;
  min-height: 44px;
}

.field input:focus {
  background-color: #fff;
  border-color: #ff9f43;
  box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.15);
}

.login-btn {
  margin-top: 8px;
  background: #ff9f43;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  transition: background 0.3s ease;
  width: 100%;
  min-height: 44px;
  touch-action: manipulation;
}

.login-btn:hover { background: #e67e22; }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 20px;
  max-width: 340px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.toast-icon-large {
  width: 48px;
  height: 48px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.toast-icon-large.success {
  background: #f0fff4;
  color: #1a7f37;
}

.toast-icon-large.error {
  background: #fff0f0;
  color: #c0392b;
}

.modal-message {
  margin: 0 0 20px;
  font-size: 15px;
  color: #444;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s ease;
  min-height: 44px;
  touch-action: manipulation;
}

.ok-btn {
  background: #ff9f43;
  color: #fff;
}

.ok-btn:hover { background: #e67e22; }

.error-btn {
  background: #c0392b !important;
  color: #fff !important;
}

.error-btn:hover { background: #a93226 !important; }

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card {
  transform: scale(0.92);
  opacity: 0;
}

.modal-leave-to .modal-card {
  transform: scale(0.92);
  opacity: 0;
}
</style>
