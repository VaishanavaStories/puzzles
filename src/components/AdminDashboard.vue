<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const sections = ref([
  { id: 'crossword', label: 'Crossword', open: true },
  { id: 'match', label: 'Match It Up', open: false },
]);

function toggleSection(id) {
  const s = sections.value.find(s => s.id === id);
  if (s) s.open = !s.open;
}

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
      <div class="sections">
        <div class="section" v-for="section in sections" :key="section.id">
          <div class="section-header" @click="toggleSection(section.id)">
            <span class="section-icon">{{ section.id === 'crossword' ? '&#128221;' : '&#127923;' }}</span>
            <span class="section-label">{{ section.label }}</span>
            <span class="section-chevron" :class="{ open: section.open }">&#9662;</span>
          </div>
          <transition name="expand">
            <div class="section-body" v-show="section.open">
              <template v-if="section.id === 'crossword'">
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
                  <div class="dash-icon submit-icon">&#128203;</div>
                  <div class="dash-info">
                    <h2>Submissions</h2>
                    <p>View and score kid submissions</p>
                  </div>
                  <span class="dash-arrow">&rsaquo;</span>
                </div>
              </template>
              <template v-if="section.id === 'match'">
                <div class="dash-card" @click="router.push('/match/create')">
                  <div class="dash-icon match-create-icon">&#9998;</div>
                  <div class="dash-info">
                    <h2>Create New Match</h2>
                    <p>Build a matching card game</p>
                  </div>
                  <span class="dash-arrow">&rsaquo;</span>
                </div>
                <div class="dash-card" @click="router.push('/match/list')">
                  <div class="dash-icon match-list-icon">&#128218;</div>
                  <div class="dash-info">
                    <h2>View Matches</h2>
                    <p>Browse all created match games</p>
                  </div>
                  <span class="dash-arrow">&rsaquo;</span>
                </div>
                <div class="dash-card" @click="router.push('/match/submissions')">
                  <div class="dash-icon match-submit-icon">&#128203;</div>
                  <div class="dash-info">
                    <h2>Match Submissions</h2>
                    <p>View and score kid submissions</p>
                  </div>
                  <span class="dash-arrow">&rsaquo;</span>
                </div>
              </template>
            </div>
          </transition>
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

.sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}

.section-header:hover {
  background: #fafafa;
}

.section-icon {
  font-size: 24px;
}

.section-label {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: #333;
}

.section-chevron {
  font-size: 14px;
  color: #aaa;
  transition: transform 0.25s ease;
}

.section-chevron.open {
  transform: rotate(180deg);
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px 16px;
}

.dash-card {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.dash-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.dash-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
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

.dash-icon.submit-icon {
  background: #fff8e1;
}

.dash-icon.match-create-icon {
  background: #e8f5e9;
}

.dash-icon.match-list-icon {
  background: #e3f2fd;
}

.dash-icon.match-submit-icon {
  background: #fff8e1;
}

.dash-info {
  flex: 1;
}

.dash-info h2 {
  margin: 0 0 2px;
  font-size: 15px;
  color: #333;
}

.dash-info p {
  margin: 0;
  font-size: 13px;
  color: #888;
}

.dash-arrow {
  font-size: 26px;
  color: #ccc;
  font-weight: 300;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
