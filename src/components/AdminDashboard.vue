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
  <div class="dashboard-page">
    <header class="dashboard-header">
      <h1>Dashboard</h1>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>
    <div class="dashboard-content">
      <div class="cards">
        <div class="dash-card" @click="router.push('/create')">
          <div class="dash-icon create-icon">&#9998;</div>
          <div class="dash-info">
            <h2>Create New Crossword</h2>
            <p>Build a crossword with clues and answers</p>
          </div>
          <span class="dash-arrow">&rsaquo;</span>
        </div>

        <div class="dash-card" @click="router.push('/crosswords')">
          <div class="dash-icon list-icon">&#128218;</div>
          <div class="dash-info">
            <h2>View Crosswords</h2>
            <p>Browse all created crosswords</p>
          </div>
          <span class="dash-arrow">&rsaquo;</span>
        </div>

        <div class="dash-card" @click="router.push('/submissions')">
          <div class="dash-icon">&#128203;</div>
          <div class="dash-info">
            <h2>Submissions</h2>
            <p>View and score kid submissions</p>
          </div>
          <span class="dash-arrow">&rsaquo;</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f0f2f5;
}

.dashboard-header {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
}

.dashboard-header h1 {
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

.dashboard-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dash-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.dash-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.dash-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  background: #fff8e1;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dash-icon.create-icon {
  background: #e8f5e9;
}

.dash-icon.list-icon {
  background: #e3f2fd;
}

.dash-info {
  flex: 1;
}

.dash-info h2 {
  margin: 0 0 4px;
  font-size: 17px;
  color: #333;
}

.dash-info p {
  margin: 0;
  font-size: 14px;
  color: #888;
}

.dash-arrow {
  font-size: 28px;
  color: #ccc;
  font-weight: 300;
}
</style>
