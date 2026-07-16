<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabaseClient';
import clg from 'crossword-layout-generator';

const router = useRouter();

onMounted(() => {
  if (!sessionStorage.getItem('admin_id')) {
    router.push('/admin');
  }
});

const crosswordName = ref('');
const entries = ref([{ clue: '', answer: '' }]);
const loading = ref(false);

const toast = ref({ show: false, message: '', type: 'error' });

function showToast(message, type = 'error') {
  toast.value = { show: true, message, type };
}

function addEntry() {
  entries.value.push({ clue: '', answer: '' });
}

function removeEntry(index) {
  if (entries.value.length > 1) {
    entries.value.splice(index, 1);
  }
}

function handleLogout() {
  sessionStorage.removeItem('admin_id');
  router.push('/admin');
}

async function handleCreate() {
  const name = crosswordName.value.trim();
  if (!name) {
    showToast('Please enter a crossword name.');
    return;
  }

  const validEntries = entries.value
    .filter(e => e.clue.trim() && e.answer.trim())
    .map(e => ({
      clue: e.clue.trim(),
      answer: e.answer.trim().toUpperCase().replace(/[^A-Z]/g, ''),
    }));

  if (validEntries.length < 2) {
    showToast('Please add at least 2 clue-answer pairs.');
    return;
  }

  loading.value = true;

  const layout = clg.generateLayout(validEntries);

  if (!layout.result || layout.result.length === 0) {
    loading.value = false;
    showToast('Could not generate crossword layout. Try different words.');
    return;
  }

  const placedWords = layout.result.filter(w => w.orientation !== 'none');

  if (placedWords.length < 2) {
    loading.value = false;
    showToast('Only ' + placedWords.length + ' word(s) could be placed. Try different words.');
    return;
  }

  const skippedCount = validEntries.length - placedWords.length;

  const qnsJson = JSON.stringify(placedWords);

  const { error } = await supabase
    .from('crossword_qns')
    .insert({ crossword_name: name, qns_json: qnsJson });

  loading.value = false;

  if (error) {
    if (error.code === '23505') {
      showToast('A crossword with this layout already exists. Try changing a word.');
    } else {
      showToast('Failed to save crossword: ' + error.message);
    }
    return;
  }

  showToast(
    skippedCount > 0
      ? `Crossword created with ${placedWords.length} words (${skippedCount} could not be placed).`
      : 'Crossword created successfully!',
    'success'
  );
  crosswordName.value = '';
  entries.value = [{ clue: '', answer: '' }];
}
</script>

<template>
  <div class="create-page">
    <header class="create-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/dashboard')">&larr;</button>
        <h1>Create Crossword</h1>
      </div>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>

    <div class="create-content">
      <div class="form-card">
        <div class="field">
          <label for="crossword-name">Crossword Name</label>
          <input
            id="crossword-name"
            v-model="crosswordName"
            type="text"
            placeholder="e.g. Animal Kingdom"
          />
        </div>

        <div class="entries-section">
          <div class="entries-header">
            <label>Clues & Answers</label>
            <button class="add-btn" @click="addEntry">+ Add</button>
          </div>

          <TransitionGroup name="entry" tag="div" class="entries-list">
            <div v-for="(entry, index) in entries" :key="index" class="entry-row">
              <span class="entry-num">{{ index + 1 }}</span>
              <input
                v-model="entry.clue"
                type="text"
                placeholder="Clue"
                class="clue-input"
              />
              <input
                v-model="entry.answer"
                type="text"
                placeholder="Answer"
                class="answer-input"
              />
              <button
                v-if="entries.length > 1"
                class="remove-btn"
                @click="removeEntry(index)"
              >&times;</button>
              <div v-else class="remove-spacer"></div>
            </div>
          </TransitionGroup>
        </div>

        <button class="create-btn" :disabled="loading" @click="handleCreate">
          {{ loading ? 'Creating...' : 'Create Crossword' }}
        </button>
      </div>
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
.create-page {
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f0f2f5;
}

.create-header {
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

.create-header h1 {
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

.create-content {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px 32px;
}

.form-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.field {
  margin-bottom: 24px;
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

.entries-section {
  margin-bottom: 24px;
}

.entries-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.entries-header label {
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.add-btn {
  background: #ff9f43;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  min-height: 36px;
}

.add-btn:hover { background: #e67e22; }

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.entry-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.entry-num {
  width: 24px;
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  text-align: center;
  flex-shrink: 0;
}

.clue-input {
  flex: 1;
  padding: 10px 14px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  min-height: 40px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.clue-input:focus {
  border-color: #ff9f43;
  background: #fff;
}

.answer-input {
  width: 120px;
  padding: 10px 14px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 15px;
  text-transform: uppercase;
  outline: none;
  min-height: 40px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.answer-input:focus {
  border-color: #ff9f43;
  background: #fff;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: #ccc;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.remove-btn:hover { color: #c0392b; }

.remove-spacer {
  width: 30px;
  flex-shrink: 0;
}

.create-btn {
  width: 100%;
  background: #ff9f43;
  color: #fff;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
  min-height: 48px;
}

.create-btn:hover { background: #e67e22; }
.create-btn:disabled { opacity: 0.6; cursor: not-allowed; }

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
  min-height: 44px;
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

.entry-enter-active,
.entry-leave-active {
  transition: all 0.2s ease;
}

.entry-enter-from,
.entry-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
