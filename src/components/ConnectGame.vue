<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../supabaseClient';

const route = useRoute();
const connectId = route.params.id;

const questions = ref([]);
const connectName = ref('');
const loading = ref(true);
const errorMsg = ref('');
const submitted = ref(false);
const score = ref(0);
const kidName = ref('');
const kidEmail = ref('');
const userAnswers = ref([]);
const submitting = ref(false);

onMounted(async () => {
  if (!connectId) {
    loading.value = false;
    errorMsg.value = 'No game ID provided.';
    return;
  }

  const { data, error } = await supabase
    .from('connect_qns')
    .select('connect_name, qns_json')
    .eq('qns_id', connectId)
    .single();

  if (error || !data) {
    loading.value = false;
    errorMsg.value = 'Game not found.';
    return;
  }

  connectName.value = data.connect_name || 'Connect';
  const parsed = JSON.parse(data.qns_json);
  questions.value = parsed.questions || parsed;
  userAnswers.value = questions.value.map(() => '');
  loading.value = false;
});

function handleInput(index, value) {
  userAnswers.value[index] = value;
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

  submitting.value = true;
  score.value = 0;

  const ansJson = questions.value.map((q, i) => {
    const userAns = (userAnswers.value[i] || '').trim();
    const correct = userAns.toUpperCase() === q.answer.trim().toUpperCase();
    if (correct) score.value++;
    return { clue: q.clue, answer: q.answer, user_answer: userAns };
  });

  const { error } = await supabase.from('connect_submissions').insert([{
    submission_id: crypto.randomUUID(),
    qn_id: connectId,
    kid_name: kidName.value.trim(),
    kid_email_id: kidEmail.value.trim(),
    ans_json: JSON.stringify(ansJson),
  }]);

  submitting.value = false;

  if (error) {
    alert('Submission failed: ' + error.message);
    return;
  }

  submitted.value = true;
}
</script>

<template>
  <div class="connect-container">
    <div v-if="loading" class="status-msg">Loading game...</div>
    <div v-else-if="errorMsg" class="status-msg error">{{ errorMsg }}</div>

    <template v-else>
      <h1>{{ connectName }}</h1>

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

      <div class="questions-area">
        <div
          v-for="(q, i) in questions"
          :key="i"
          class="question-card"
          :class="{
            correct: submitted && (userAnswers[i] || '').trim().toUpperCase() === q.answer.trim().toUpperCase(),
            wrong: submitted && (userAnswers[i] || '').trim().toUpperCase() !== q.answer.trim().toUpperCase()
          }"
        >
          <div class="question-num">{{ i + 1 }}</div>
          <div class="question-images">
            <img
              v-for="(img, j) in q.images"
              :key="j"
              :src="img"
              alt="clue image"
              class="question-img"
            />
          </div>
          <div class="question-clue">{{ q.clue }}</div>
          <div class="question-input">
            <input
              :value="userAnswers[i]"
              :disabled="submitted"
              type="text"
              placeholder="Your answer"
              :class="{
                correct: submitted && (userAnswers[i] || '').trim().toUpperCase() === q.answer.trim().toUpperCase(),
                wrong: submitted && (userAnswers[i] || '').trim().toUpperCase() !== q.answer.trim().toUpperCase()
              }"
              @input="handleInput(i, $event.target.value)"
              @keyup.enter="i < questions.length - 1 ? $event.target.closest('.question-card').nextElementSibling?.querySelector('input')?.focus() : null"
            />
            <span v-if="submitted && (userAnswers[i] || '').trim().toUpperCase() !== q.answer.trim().toUpperCase()" class="correct-answer">
              {{ q.answer }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="!submitted" class="submit-row">
        <button class="submit-btn" :disabled="submitting" @click="checkAnswers">
          {{ submitting ? 'Submitting...' : 'Submit Answers' }}
        </button>
      </div>

      <div v-else class="result-card">
        <div class="result-score">{{ score }} / {{ questions.length }}</div>
        <div class="result-label">
          {{ score === questions.length ? 'Perfect score!' : 'Well done!' }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.connect-container {
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f0f2f5;
  padding: 24px 16px 48px;
  max-width: 600px;
  margin: 0 auto;
}

.status-msg {
  text-align: center;
  padding: 48px 20px;
  font-size: 16px;
  color: #888;
}

.status-msg.error {
  color: #c0392b;
}

h1 {
  text-align: center;
  margin: 0 0 24px;
  font-size: 24px;
  color: #333;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  min-height: 42px;
}

.form-group input:focus {
  border-color: #ff9f43;
}

.questions-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  transition: border-color 0.3s ease;
  border: 2px solid transparent;
}

.question-card.correct {
  border-color: #1a7f37;
  background: #f0fff4;
}

.question-card.wrong {
  border-color: #c0392b;
  background: #fff5f5;
}

.question-num {
  display: inline-block;
  background: #ff9f43;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.question-images {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.question-img {
  max-width: 150px;
  max-height: 150px;
  object-fit: contain;
  border-radius: 10px;
  border: 2px solid #e9ecef;
}

.question-clue {
  font-size: 15px;
  color: #444;
  margin-bottom: 12px;
  font-weight: 500;
}

.question-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.question-input input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  text-transform: uppercase;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  min-height: 42px;
}

.question-input input:focus {
  border-color: #ff9f43;
}

.question-input input.correct {
  border-color: #1a7f37;
  background: #e6f9eb;
}

.question-input input.wrong {
  border-color: #c0392b;
  background: #fef0f0;
}

.question-input input:disabled {
  opacity: 0.85;
  cursor: not-allowed;
}

.correct-answer {
  font-size: 13px;
  font-weight: 600;
  color: #1a7f37;
}

.submit-row {
  margin-top: 28px;
}

.submit-btn {
  width: 100%;
  background: #ff9f43;
  color: #fff;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
  min-height: 50px;
}

.submit-btn:hover { background: #e67e22; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.result-card {
  text-align: center;
  margin-top: 32px;
  background: #fff;
  border-radius: 16px;
  padding: 32px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.result-score {
  font-size: 40px;
  font-weight: 800;
  color: #ff9f43;
  margin-bottom: 6px;
}

.result-label {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}
</style>
