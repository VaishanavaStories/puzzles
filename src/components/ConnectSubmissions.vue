<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

const router = useRouter();
const submissions = ref([]);
const loading = ref(true);

const modalOpen = ref(false);
const selectedSubmission = ref(null);

onMounted(async () => {
  if (!sessionStorage.getItem('admin_id')) {
    router.push('/admin');
    return;
  }

  const { data, error } = await supabase
    .from('connect_submissions')
    .select('submission_id, qn_id, kid_name, kid_email_id, ans_json, created_at')
    .order('created_at', { ascending: false });

  loading.value = false;

  if (!error && data) {
    submissions.value = data;
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
    answers.forEach(item => {
      if (item.user_answer && item.user_answer.trim().toUpperCase() === item.answer.trim().toUpperCase()) {
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

function getAnswers(ansJson) {
  try {
    return typeof ansJson === 'string' ? JSON.parse(ansJson) : ansJson;
  } catch {
    return [];
  }
}

function exportToExcel() {
  const data = submissions.value.map(sub => {
    const score = getScore(sub.ans_json);
    return {
      Name: sub.kid_name,
      Email: sub.kid_email_id,
      Score: `${score.correct}/${score.total}`,
      'Submitted At': new Date(sub.created_at).toLocaleString(),
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 10 },
    { wch: 22 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Connect Submissions');
  XLSX.writeFile(wb, 'connect_submissions.xlsx');
}
</script>

<template>
  <div class="submissions-page">
    <header class="submissions-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/dashboard')">&larr;</button>
        <h1>Connect Submissions</h1>
      </div>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>

    <div class="submissions-content">
      <div v-if="!loading && submissions.length > 0" class="submissions-toolbar">
        <span class="submissions-count">
          {{ submissions.length }} submission{{ submissions.length !== 1 ? 's' : '' }}
        </span>
        <button class="export-btn" @click="exportToExcel">&#128229; Export Excel</button>
      </div>

      <div v-if="loading" class="loading">Loading submissions...</div>

      <div v-else-if="submissions.length === 0" class="empty">
        No connect submissions yet.
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
      <div v-if="modalOpen && selectedSubmission" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card detail-modal">
          <div class="modal-header">
            <div>
              <span class="modal-kid-name">{{ selectedSubmission.kid_name }}</span>
              <span class="modal-score">{{ getScore(selectedSubmission.ans_json).correct }}/{{ getScore(selectedSubmission.ans_json).total }}</span>
            </div>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="answers-list">
              <div
                v-for="(item, idx) in getAnswers(selectedSubmission.ans_json)"
                :key="idx"
                class="answer-row"
                :class="{ correct: item.user_answer && item.user_answer.trim().toUpperCase() === item.answer.trim().toUpperCase() }"
              >
                <div class="answer-clue">{{ item.clue }}</div>
                <div class="answer-pair">
                  <span class="expected">Answer: {{ item.answer }}</span>
                  <span class="given">Given: {{ item.user_answer || '(no answer)' }}</span>
                </div>
              </div>
            </div>
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

.loading,
.empty {
  text-align: center;
  padding: 32px;
  font-size: 15px;
  color: #888;
}

.submissions-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.submissions-count {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.export-btn {
  background: #1a7f37;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  min-height: 36px;
  touch-action: manipulation;
}

.export-btn:hover { background: #156d2c; }

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

.detail-modal {
  background: #fff;
  border-radius: 16px;
  max-width: 560px;
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
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answer-row {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 12px 16px;
  transition: border-color 0.2s ease;
}

.answer-row.correct {
  border-color: #1a7f37;
  background: #f0fff4;
}

.answer-clue {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
}

.answer-pair {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.expected {
  color: #1a7f37;
  font-weight: 600;
}

.given {
  color: #666;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .detail-modal,
.modal-leave-active .detail-modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .detail-modal {
  transform: scale(0.92);
  opacity: 0;
}

.modal-leave-to .detail-modal {
  transform: scale(0.92);
  opacity: 0;
}
</style>
