<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  if (!sessionStorage.getItem('admin_id')) {
    router.push('/admin');
  }
});

function handleLogout() {
  sessionStorage.removeItem('admin_id');
  router.push('/admin');
}
</script>

<template>
  <div class="submissions-page">
    <header class="submissions-header">
      <h1>Submissions</h1>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>
    <div class="submissions-content">
      <p>This is submissions page</p>
    </div>
  </div>
</template>

<style scoped>
.submissions-page {
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f0f2f5;
}

.submissions-header {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.submissions-header h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.logout-btn {
  background: #f1f3f5;
  color: #555;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  min-height: 40px;
  touch-action: manipulation;
}

.logout-btn:hover { background: #e2e5e9; }

.submissions-content {
  max-width: 800px;
  margin: 32px auto;
  padding: 0 20px;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.submissions-content p {
  margin: 0;
  font-size: 16px;
  color: #555;
}
</style>
