<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabaseClient';

const router = useRouter();
const crosswords = ref([]);
const loading = ref(true);

onMounted(async () => {
  if (!sessionStorage.getItem('admin_id')) {
    router.push('/admin');
    return;
  }

  const { data, error } = await supabase
    .from('crossword_qns')
    .select('qns_id, crossword_name, created_at')
    .order('created_at', { ascending: false });

  loading.value = false;

  if (!error && data) {
    crosswords.value = data;
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
        <h1>Crosswords</h1>
      </div>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>

    <div class="list-content">
      <div v-if="loading" class="loading">Loading crosswords...</div>

      <div v-else-if="crosswords.length === 0" class="empty">No crosswords created yet.</div>

      <div v-else class="crossword-list">
        <div v-for="cw in crosswords" :key="cw.qns_id" class="cw-card" @click="router.push(`/puzzle/${cw.qns_id}`)">
          <div class="card-header">
            <span class="cw-name">{{ cw.crossword_name || 'Untitled' }}</span>
            <span class="cw-time">{{ new Date(cw.created_at).toLocaleString() }}</span>
          </div>
          <div class="cw-id">{{ cw.qns_id }}</div>
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

.crossword-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cw-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.cw-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.cw-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.cw-time {
  font-size: 12px;
  color: #999;
}

.cw-id {
  font-family: monospace;
  font-size: 13px;
  color: #888;
  word-break: break-all;
}
</style>
