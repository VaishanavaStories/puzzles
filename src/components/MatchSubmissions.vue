<script setup>
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

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
  <div class="page">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/dashboard')">&larr; Back</button>
      <h1>Match Submissions</h1>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>
    <div class="page-content">
      <div class="placeholder-card">
        <h2>Coming Soon</h2>
        <p>View and score kid submissions for match games.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f0f2f5;
}

.page-header {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.back-btn {
  background: none;
  border: none;
  color: #ff9f43;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
  min-height: 40px;
}

.back-btn:hover { background: #fff3e0; }

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
}

.logout-btn:hover { background: #e2e5e9; }

.page-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.placeholder-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.placeholder-card h2 {
  margin: 0 0 12px;
  font-size: 22px;
  color: #333;
}

.placeholder-card p {
  margin: 0;
  font-size: 15px;
  color: #888;
}
</style>
