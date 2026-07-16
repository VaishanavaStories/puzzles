<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../supabaseClient';
import CrosswordGrid from './CrosswordGrid.vue';

const route = useRoute();
const qnId = route.params.id; 
const puzzleData = ref(null);
const showResults = ref(false);
const finalSubmission = ref(null);

const acrossClues = computed(() => 
  puzzleData.value ? puzzleData.value.filter(i => i.orientation === 'across') : []
);
const downClues = computed(() => 
  puzzleData.value ? puzzleData.value.filter(i => i.orientation === 'down') : []
);

const formData = ref({ name: '', email: '', ans_json: {} });

const toast = ref({ show: false, message: '', type: 'error' });

function showToast(message, type = 'error') {
  toast.value = { show: true, message, type };
}

const confirmState = ref({ show: false, message: '' });
let confirmResolve = null;

function showConfirm(message) {
  return new Promise(resolve => {
    confirmResolve = resolve;
    confirmState.value = { show: true, message };
  });
}

function confirmAnswer(val) {
  confirmState.value.show = false;
  if (confirmResolve) confirmResolve(val);
  confirmResolve = null;
}

async function fetchPuzzle() {
  if (!qnId) return;

  const { data, error } = await supabase
    .from('crossword_qns')
    .select('qns_json')
    .eq('qns_id', qnId)
    .single();

  if (error) {
    console.error('Error fetching puzzle:', error.message);
  } else {
    puzzleData.value = JSON.parse(data.qns_json);
    showResults.value = false;
  }
}

const handleUpdate = (data) => {
  formData.value.ans_json[`${data.x}-${data.y}`] = data.val;
};

async function submitPuzzle() {
  const name = formData.value.name.trim();
  const email = formData.value.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email) {
    showToast('Please enter both your name and email.');
    return;
  }
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address.');
    return;
  }
  if (!puzzleData.value) return;

  const agreed = await showConfirm('Are you sure you want to submit? You won\'t be able to change your answers after submitting.');
  if (!agreed) return;

  const submissionData = puzzleData.value.map(wordObj => ({
    ...wordObj,
    user_answer: wordObj.answer.split('').map((_, i) => {
      const x = wordObj.orientation === 'across' ? wordObj.startx + i : wordObj.startx;
      const y = wordObj.orientation === 'down' ? wordObj.starty + i : wordObj.starty;
      return formData.value.ans_json[`${x}-${y}`] || ' ';
    }).join('')
  }));

  const { error } = await supabase.from('crosssword_submissions').insert([{
    kid_name: name,
    kid_email_id: email,
    ans_json: JSON.stringify(submissionData),
    qn_id: qnId
  }]);

  if (error) {
    showToast('Submission failed: ' + error.message);
  } else {
    finalSubmission.value = submissionData;
    showResults.value = true; 
    showToast('Submitted successfully! Answer will be posted in WhatsApp group.', 'success');
  }
}

onMounted(fetchPuzzle);
</script>

<template>
  <div class="puzzle-container" v-if="puzzleData">
    <h1>Crossword Challenge!</h1>
    
    <div class="form-group">
      <div class="form-row">
        <input v-model="formData.name" placeholder="Name" required />
        <input v-model="formData.email" placeholder="Email" type="email" required />
      </div>
    </div>

    <div class="grid-wrapper">
      <CrosswordGrid 
        :puzzleData="puzzleData" 
        :isReadOnly="showResults" 
        :results="finalSubmission"
        :currentAnswers="formData.ans_json" 
        @update:modelValue="handleUpdate" 
      />
    </div>

    <div class="clues-container">
      <div>
        <h3>Across</h3>
        <ul>
          <li v-for="item in acrossClues" :key="item.position">
            <strong>{{ item.position }}.</strong> {{ item.clue }}
          </li>
        </ul>
      </div>
      <div>
        <h3>Down</h3>
        <ul>
          <li v-for="item in downClues" :key="item.position">
            <strong>{{ item.position }}.</strong> {{ item.clue }}
          </li>
        </ul>
      </div>
    </div>

    <div v-if="showResults" class="submitted-badge">
      <span class="submitted-icon">&#10003;</span>
      Submitted
    </div>
    <button 
      v-else
      @click="submitPuzzle" 
      class="submit-btn"
    >
      Submit Answer
    </button>

    <Transition name="modal">
      <div v-if="confirmState.show" class="modal-overlay" @click.self="confirmAnswer(false)">
        <div class="modal-card">
          <div class="modal-icon">&#9888;</div>
          <p class="modal-message">{{ confirmState.message }}</p>
          <div class="modal-actions">
            <button class="modal-btn cancel" @click="confirmAnswer(false)">Go Back</button>
            <button class="modal-btn confirm" @click="confirmAnswer(true)">Submit</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="toast.show" class="modal-overlay" @click.self="toast.show = false">
        <div class="modal-card">
          <div class="toast-icon-large" :class="toast.type">
            {{ toast.type === 'success' ? '\u2713' : '\u26A0' }}
          </div>
          <p class="modal-message">{{ toast.message }}</p>
          <div class="modal-actions">
            <button class="modal-btn confirm" @click="toast.show = false" :class="toast.type === 'error' ? 'error-btn' : ''">OK</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
  
  <div v-else class="puzzle-container">
    <p>Loading puzzle...</p>
  </div>
</template>

<style scoped>
.puzzle-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 30px);
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Segoe UI', sans-serif;
  box-sizing: border-box;
}

h1 { text-align: center; color: #333; margin: 0; font-size: clamp(18px, 5vw, 28px); }

.grid-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-row input {
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

.form-row input:focus {
  background-color: #fff;
  border-color: #ff9f43;
  box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.15);
}

.form-row input:invalid:focus {
  border-color: #ff4757;
  box-shadow: 0 0 0 4px rgba(255, 71, 88, 0.15);
}

.clues-container {
  text-align: left;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

h3 { color: #ff9f43; margin-top: 0; }
ul { list-style: none; padding: 0; }
li { margin-bottom: 8px; font-size: 14px; color: #555; }

.submit-btn {
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

.submit-btn:hover { background: #e67e22; }

.submitted-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 10px;
  color: #1a7f37;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
}

.submitted-icon {
  width: 22px;
  height: 22px;
  background: #1a7f37;
  color: #fff;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
  .clues-container { grid-template-columns: 1fr; padding: 14px; gap: 12px; }
  li { font-size: 13px; }
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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

.error-btn {
  background: #c0392b !important;
  color: #fff !important;
}

.error-btn:hover {
  background: #a93226 !important;
}

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

.modal-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 14px;
  background: #fff8e1;
  color: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
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

.modal-btn.cancel {
  background: #f1f3f5;
  color: #555;
}

.modal-btn.cancel:hover { background: #e2e5e9; }

.modal-btn.confirm {
  background: #ff9f43;
  color: #fff;
}

.modal-btn.confirm:hover { background: #e67e22; }

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
