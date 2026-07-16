<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabaseClient';
import CrosswordGrid from './CrosswordGrid.vue';

const router = useRouter();
const crosswords = ref([]);
const selectedId = ref('');
const submissions = ref([]);
const loading = ref(false);
const puzzleData = ref(null);

const modalOpen = ref(false);
const selectedSubmission = ref(null);

onMounted(async () => {
  if (!sessionStorage.getItem('admin_id')) {
    router.push('/admin');
    return;
  }

  const { data, error } = await supabase
    .from('crossword_qns')
    .select('qns_id, crossword_name');

  if (!error && data) {
    crosswords.value = data;
  }
});

watch(selectedId, async (id) => {
  submissions.value = [];
  puzzleData.value = null;
  if (!id) return;

  loading.value = true;

  const [subResult, puzzleResult] = await Promise.all([
    supabase
      .from('crosssword_submissions')
      .select('submission_id, kid_name, kid_email_id, ans_json, created_at')
      .eq('qn_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('crossword_qns')
      .select('qns_json')
      .eq('qns_id', id)
      .single(),
  ]);

  loading.value = false;

  if (!subResult.error && subResult.data) {
    submissions.value = subResult.data.sort((a, b) => getScore(b.ans_json).correct - getScore(a.ans_json).correct);
  }

  if (!puzzleResult.error && puzzleResult.data) {
    puzzleData.value = JSON.parse(puzzleResult.data.qns_json);
  }
});

function handleLogout() {
  sessionStorage.removeItem('admin_id');
  router.push('/admin');
}

function getScore(ansJson) {
  try {
    const answers = typeof ansJson === 'string' ? JSON.parse(ansJson) : ansJson;
    let correct = 0;
    const total = answers.length;
    answers.forEach(word => {
      const userAns = (word.user_answer || '').trim();
      if (userAns.length === word.answer.length && word.answer.toUpperCase() === userAns.toUpperCase()) {
        correct++;
      }
    });
    return { correct, total };
  } catch {
    return { correct: 0, total: 0 };
  }
}

function openSubmission(sub) {
  selectedSubmission.value = sub;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  selectedSubmission.value = null;
}

function getUserAnswers(ansJson) {
  try {
    const answers = typeof ansJson === 'string' ? JSON.parse(ansJson) : ansJson;
    const map = {};
    answers.forEach(word => {
      const ua = (word.user_answer || '').toUpperCase();
      for (let i = 0; i < word.answer.length; i++) {
        const x = word.orientation === 'across' ? word.startx + i : word.startx;
        const y = word.orientation === 'down' ? word.starty + i : word.starty;
        map[`${x}-${y}`] = ua[i] || '';
      }
    });
    return map;
  } catch {
    return {};
  }
}
</script>

<template>
  <div class="submissions-page">
    <header class="submissions-header">
      <h1>Submissions</h1>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>
    <div class="submissions-content">
      <div class="dropdown-group">
        <label for="crossword-select">Crossword Name</label>
        <select id="crossword-select" v-model="selectedId">
          <option value="" disabled>Select a crossword</option>
          <option v-for="cw in crosswords" :key="cw.qns_id" :value="cw.qns_id">
            {{ cw.crossword_name }}
          </option>
        </select>
      </div>

      <div v-if="!loading && selectedId && submissions.length > 0" class="submissions-count">
        {{ submissions.length }} submission{{ submissions.length !== 1 ? 's' : '' }}
      </div>

      <div v-if="loading" class="loading">Loading submissions...</div>

      <div v-else-if="selectedId && submissions.length === 0" class="empty">
        No submissions yet for this crossword.
      </div>

      <div v-else class="submissions-list">
        <div
          v-for="sub in submissions"
          :key="sub.submission_id"
          class="submission-card"
          @click="openSubmission(sub)"
        >
          <div class="card-header">
            <span class="kid-name">{{ sub.kid_name }}</span>
            <span class="submitted-at">{{ new Date(sub.created_at).toLocaleString() }}</span>
          </div>
          <div class="card-email">{{ sub.kid_email_id }}</div>
          <div class="card-score">
            <span class="score-label">Score</span>
            <span class="score-value">{{ getScore(sub.ans_json).correct }}/{{ getScore(sub.ans_json).total }}</span>
          </div>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="modalOpen && selectedSubmission && puzzleData" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card grid-modal">
          <div class="modal-header">
            <div>
              <span class="modal-kid-name">{{ selectedSubmission.kid_name }}</span>
              <span class="modal-score">{{ getScore(selectedSubmission.ans_json).correct }}/{{ getScore(selectedSubmission.ans_json).total }}</span>
            </div>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <CrosswordGrid
              :puzzleData="puzzleData"
              :isReadOnly="true"
              :results="JSON.parse(selectedSubmission.ans_json)"
              :currentAnswers="getUserAnswers(selectedSubmission.ans_json)"
            />
          </div>
        </div>
      </div>
    </Transition>
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
  margin-bottom: 32px;
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
  margin: 0 auto;
  padding: 0 20px 32px;
}

.dropdown-group {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.dropdown-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.dropdown-group select {
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
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
}

.dropdown-group select:focus {
  background-color: #fff;
  border-color: #ff9f43;
  box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.15);
}

.loading,
.empty {
  text-align: center;
  padding: 32px;
  font-size: 15px;
  color: #888;
}

.submissions-count {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 16px;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.submission-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.submission-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.kid-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.submitted-at {
  font-size: 12px;
  color: #999;
}

.card-email {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.card-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-label {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.score-value {
  font-size: 14px;
  font-weight: 700;
  color: #ff9f43;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.grid-modal {
  background: #fff;
  border-radius: 16px;
  max-width: 640px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header > div {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-kid-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.modal-score {
  font-size: 14px;
  font-weight: 700;
  color: #ff9f43;
  background: #fff8e1;
  padding: 2px 10px;
  border-radius: 8px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

.modal-close:hover { color: #333; }

.modal-body {
  padding: 20px;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .grid-modal,
.modal-leave-active .grid-modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .grid-modal {
  transform: scale(0.92);
  opacity: 0;
}

.modal-leave-to .grid-modal {
  transform: scale(0.92);
  opacity: 0;
}
</style>
