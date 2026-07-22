<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../supabaseClient';

const route = useRoute();
const matchId = route.params.id;

const clues = ref([]);
const placements = ref({});
const submitted = ref(false);
const score = ref(0);
const dragging = ref(null);
const dragSource = ref(null);
const touchDragEl = ref(null);
const touchClone = ref(null);
const touchPos = ref({ x: 0, y: 0 });
const loading = ref(true);
const errorMsg = ref('');
const kidName = ref('');
const kidEmail = ref('');

const shuffledAnswers = ref([]);

const availableAnswers = computed(() => {
  const placed = new Set(Object.values(placements.value).filter(v => v !== undefined));
  return shuffledAnswers.value
    .map((a, i) => ({ ...a, pos: i }))
    .filter(a => !placed.has(a.pos));
});


onMounted(async () => {
  if (!matchId) {
    loading.value = false;
    errorMsg.value = 'No game ID provided.';
    return;
  }

  const { data, error } = await supabase
    .from('match_qns')
    .select('qns_json')
    .eq('qns_id', matchId)
    .single();

  if (error || !data) {
    loading.value = false;
    errorMsg.value = 'Game not found.';
    return;
  }

  clues.value = JSON.parse(data.qns_json);

  const answers = clues.value.map((c, i) => ({ text: c.answer, clueIndex: i }));
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  shuffledAnswers.value = answers;

  clues.value.forEach((_, i) => { placements.value[i] = undefined; });
  loading.value = false;
});

function handleDragStart(answerIndex, source) {
  dragging.value = answerIndex;
  dragSource.value = source;
}

function handleDragEnd() {
  dragging.value = null;
  dragSource.value = null;
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(clueIndex) {
  if (dragging.value === null) return;
  if (submitted.value) return;

  const existing = placements.value[clueIndex];

  if (dragSource.value !== null && dragSource.value !== clueIndex && existing !== undefined) {
    placements.value[dragSource.value] = existing;
  } else if (dragSource.value !== null && dragSource.value !== clueIndex) {
    placements.value[dragSource.value] = undefined;
  }

  placements.value[clueIndex] = dragging.value;
  dragging.value = null;
  dragSource.value = null;
}

function handleTouchStart(e, answerIndex, source) {
  if (submitted.value) return;
  e.preventDefault();
  dragging.value = answerIndex;
  dragSource.value = source;
  const touch = e.touches[0];
  touchPos.value = { x: touch.clientX, y: touch.clientY };

  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const clone = el.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.zIndex = '9999';
  clone.style.pointerEvents = 'none';
  clone.style.opacity = '0.85';
  clone.style.transform = 'scale(1.05)';
  clone.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
  document.body.appendChild(clone);
  touchClone.value = clone;
  touchDragEl.value = el;
  el.style.opacity = '0.3';
}

function handleTouchMove(e) {
  if (!touchClone.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  touchPos.value = { x: touch.clientX, y: touch.clientY };
  const rect = touchDragEl.value.getBoundingClientRect();
  touchClone.value.style.left = (touch.clientX - rect.width / 2) + 'px';
  touchClone.value.style.top = (touch.clientY - rect.height / 2) + 'px';
}

function handleTouchEnd(e) {
  if (!touchClone.value || dragging.value === null) {
    cleanupTouch();
    return;
  }

  const touch = e.changedTouches[0];
  const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
  const slot = dropTarget?.closest('.answer-slot');
  if (slot) {
    const clueIndex = parseInt(slot.dataset.index);
    if (!isNaN(clueIndex)) {
      const existing = placements.value[clueIndex];

      if (dragSource.value !== null && dragSource.value !== clueIndex && existing !== undefined) {
        placements.value[dragSource.value] = existing;
      } else if (dragSource.value !== null && dragSource.value !== clueIndex) {
        placements.value[dragSource.value] = undefined;
      }

      placements.value[clueIndex] = dragging.value;
    }
  }
  cleanupTouch();
}

function cleanupTouch() {
  if (touchClone.value) {
    document.body.removeChild(touchClone.value);
    touchClone.value = null;
  }
  if (touchDragEl.value) {
    touchDragEl.value.style.opacity = '1';
    touchDragEl.value = null;
  }
  dragging.value = null;
  dragSource.value = null;
}

function resetGame() {
  clues.value.forEach((_, i) => { placements.value[i] = undefined; });
  submitted.value = false;
  score.value = 0;
}

async function checkAnswers() {
  if (!kidName.value.trim()) {
    alert('Please enter your name.');
    return;
  }
  if (!kidEmail.value.trim()) {
    alert('Please enter your email.');
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(kidEmail.value.trim())) {
    alert('Please enter a valid email address.');
    return;
  }

  score.value = 0;
  const ansJson = clues.value.map((clue, i) => {
    const placed = placements.value[i];
    const userAnswer = placed !== undefined ? shuffledAnswers.value[placed].text : '';
    if (placed !== undefined && shuffledAnswers.value[placed].clueIndex === i) {
      score.value++;
    }
    return { clue: clue.clue, answer: clue.answer, user_answer: userAnswer };
  });

  const { error } = await supabase.from('match_submissions').insert([{
    submission_id: crypto.randomUUID(),
    kid_name: kidName.value.trim(),
    kid_email_id: kidEmail.value.trim(),
    ans_json: JSON.stringify(ansJson),
  }]);

  if (error) {
    alert('Submission failed: ' + error.message);
    return;
  }

  submitted.value = true;
}
</script>

<template>
  <div class="match-container" v-if="clues.length">
    <h1>Match It Up!</h1>

    <div v-if="!submitted" class="form-row">
      <div class="form-group">
        <label for="kid-name">Name</label>
        <input id="kid-name" v-model="kidName" placeholder="Your name" required />
      </div>
      <div class="form-group">
        <label for="kid-email">Email</label>
        <input id="kid-email" v-model="kidEmail" type="email" placeholder="Your email" required />
      </div>
    </div>

    <div class="game-area">
      <div class="clues-column">
        <div
          v-for="(clue, i) in clues"
          :key="i"
          class="clue-row"
        >
          <span class="clue-label">{{ i + 1 }}.</span>
          <span class="clue-text">{{ clue.clue }}</span>
          <div
            class="answer-slot"
            :class="{
              filled: placements[i] !== undefined,
              correct: submitted && placements[i] !== undefined && shuffledAnswers[placements[i]].clueIndex === i,
              wrong: submitted && placements[i] !== undefined && shuffledAnswers[placements[i]].clueIndex !== i,
              'drag-over': dragging !== null
            }"
            :data-index="i"
            @dragover="handleDragOver"
            @drop="handleDrop(i)"
          >
            <span
              v-if="placements[i] !== undefined"
              class="placed-text"
              draggable="true"
              @dragstart.stop="handleDragStart(placements[i], i)"
              @dragend="handleDragEnd"
              @touchstart="handleTouchStart($event, placements[i], i)"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              {{ shuffledAnswers[placements[i]].text }}
            </span>
            <span v-else class="slot-placeholder">Drop here</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!submitted" class="answers-tray">
      <p class="tray-label">Drag answers to match</p>
      <div class="answer-chips">
        <div
          v-for="answer in availableAnswers"
          :key="answer.pos"
          class="answer-chip"
          :class="{ dragging: dragging === answer.pos }"
          draggable="true"
          @dragstart="handleDragStart(answer.pos, null)"
          @dragend="handleDragEnd"
          @touchstart="handleTouchStart($event, answer.pos)"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          {{ answer.text }}
        </div>
      </div>
    </div>

    <div v-if="submitted" class="result-bar">
      <span class="result-score">{{ score }} / {{ clues.length }}</span>
      <span class="result-label">{{ score === clues.length ? 'Perfect!' : 'Try again!' }}</span>
    </div>

    <div v-if="!submitted" class="btn-row">
      <button
        class="submit-btn"
        @click="checkAnswers"
      >
        Submit
      </button>
      <button class="reset-btn" @click="resetGame">
        Reset
      </button>
    </div>

  </div>

  <div v-else class="match-container">
    <p v-if="loading">Loading game...</p>
    <p v-else class="error-text">{{ errorMsg }}</p>
  </div>
</template>

<style scoped>
.match-container {
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

h1 {
  text-align: center;
  color: #333;
  margin: 0;
  font-size: clamp(18px, 5vw, 28px);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.form-group input {
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

.form-group input:focus {
  background-color: #fff;
  border-color: #ff9f43;
  box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.15);
}

.game-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.clues-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clue-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f7f8fa;
  border-radius: 12px;
  padding: 12px 14px;
}

.clue-label {
  font-weight: 700;
  color: #ff9f43;
  font-size: 15px;
  min-width: 24px;
}

.clue-text {
  flex: 1;
  font-size: 14px;
  color: #444;
}

.answer-slot {
  min-width: 110px;
  min-height: 40px;
  border: 2px dashed #ccc;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.answer-slot.drag-over {
  border-color: #ff9f43;
  background: #fff8e1;
}

.answer-slot.filled {
  border-style: solid;
  border-color: #ff9f43;
  background: #fff3e0;
}

.answer-slot.correct {
  border-color: #1a7f37;
  background: #e8f5e9;
}

.answer-slot.wrong {
  border-color: #c0392b;
  background: #fce4ec;
}

.placed-text {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  text-align: center;
  cursor: grab;
  user-select: none;
}

.slot-placeholder {
  font-size: 12px;
  color: #bbb;
}

.answers-tray {
  background: #f0f2f5;
  border-radius: 14px;
  padding: 16px;
}

.tray-label {
  margin: 0 0 12px;
  font-size: 13px;
  color: #888;
  text-align: center;
}

.answer-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.answer-chip {
  background: #ff9f43;
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: grab;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  touch-action: none;
}

.answer-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 159, 67, 0.35);
}

.answer-chip.dragging {
  opacity: 0.4;
  transform: scale(0.95);
}

.result-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 12px;
}

.result-score {
  font-size: 20px;
  font-weight: 700;
  color: #1a7f37;
}

.result-label {
  font-size: 15px;
  color: #555;
  font-weight: 500;
}

.submit-btn {
  background: #ff9f43;
  color: #fff;
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

.submit-btn:hover {
  background: #e67e22;
}

.btn-row {
  display: flex;
  gap: 10px;
}

.btn-row .submit-btn {
  flex: 1;
}

.reset-btn {
  background: #f1f3f5;
  color: #555;
  padding: 14px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: background 0.2s ease;
  min-height: 44px;
  touch-action: manipulation;
  flex-shrink: 0;
}

.reset-btn:hover {
  background: #e2e5e9;
}

.back-btn {
  background: none;
  border: 2px solid #e9ecef;
  color: #888;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  min-height: 44px;
  touch-action: manipulation;
}

.back-btn:hover {
  border-color: #ccc;
  color: #555;
}

.error-text {
  text-align: center;
  color: #c0392b;
  font-size: 15px;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .clue-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  .answer-slot {
    min-width: 90px;
  }

  .answer-chip {
    font-size: 12px;
    padding: 8px 12px;
  }
}
</style>
