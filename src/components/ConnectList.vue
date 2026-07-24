<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabaseClient';

const router = useRouter();
const games = ref([]);
const loading = ref(true);

onMounted(async () => {
  if (!sessionStorage.getItem('admin_id')) {
    router.push('/admin');
    return;
  }

  const { data, error } = await supabase
    .from('connect_qns')
    .select('qns_id, connect_name, created_at')
    .order('created_at', { ascending: false });

  loading.value = false;

  if (!error && data) {
    games.value = data;
  }
});

function handleLogout() {
  sessionStorage.removeItem('admin_id');
  router.push('/admin');
}
</script>

<template>
  <div class="list-page">
    <header class="list-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/dashboard')">&larr;</button>
        <h1>Connect Games</h1>
      </div>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>

    <div class="list-content">
      <div v-if="loading" class="loading">Loading games...</div>

      <div v-else-if="games.length === 0" class="empty">No connect games created yet.</div>

      <div v-else class="game-list">
        <div v-for="game in games" :key="game.qns_id" class="game-card" @click="router.push(`/connect/${game.qns_id}`)">
          <div class="card-header">
            <span class="game-name">{{ game.connect_name || 'Untitled' }}</span>
            <span class="game-time">{{ new Date(game.created_at).toLocaleString() }}</span>
          </div>
          <div class="game-id">{{ game.qns_id }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-page {
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f0f2f5;
}

.list-header {
  background: #fff;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: #f1f3f5;
  color: #555;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.back-btn:hover { background: #e2e5e9; }

.list-header h1 {
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
}

.logout-btn:hover { background: #e2e5e9; }

.list-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading,
.empty {
  text-align: center;
  padding: 32px;
  font-size: 15px;
  color: #888;
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.game-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.game-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.game-time {
  font-size: 12px;
  color: #999;
}

.game-id {
  font-family: monospace;
  font-size: 13px;
  color: #888;
  word-break: break-all;
}
</style>
