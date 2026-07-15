<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../supabaseClient';
import CrosswordGrid from './CrosswordGrid.vue';

const route = useRoute();
const qnId = route.params.id; 
const puzzleData = ref(null);
const showResults = ref(false);
const finalSubmission = ref(null); // Store data to display red highlights

const acrossClues = computed(() => 
  puzzleData.value ? puzzleData.value.filter(i => i.orientation === 'across') : []
);
const downClues = computed(() => 
  puzzleData.value ? puzzleData.value.filter(i => i.orientation === 'down') : []
);

const formData = ref({ name: '', email: '', ans_json: {} });

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
    showResults.value = false; // <--- Change this to false so it is editable
  }
}

const handleUpdate = (data) => {
  formData.value.ans_json[`${data.x}-${data.y}`] = data.val;
};

async function submitPuzzle() {
  const name = formData.value.name.trim();
  const email = formData.value.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation
  if (!name || !email) {
    alert("Please enter both your name and email.");
    return;
  }
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }
  if (!puzzleData.value) return;

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
    alert('Submission failed: ' + error.message);
  } else {
    // 1. Set the submission data to trigger red highlighting in CrosswordGrid
    finalSubmission.value = submissionData;
    // 2. Lock the grid
    showResults.value = true; 
    alert('Submitted successfully!');
  }
}

onMounted(fetchPuzzle);
</script>

<template>
  <div class="puzzle-container" v-if="puzzleData">
    <h1>Word Puzzle Challenge!</h1>
    
    <div class="form-group">
      <div class="form-row">
        <input v-model="formData.name" placeholder="Name" required />
        <input v-model="formData.email" placeholder="Email" type="email" required />
      </div>
    </div>

    <CrosswordGrid 
      :puzzleData="puzzleData" 
      :isReadOnly="showResults" 
      :results="finalSubmission"
      :currentAnswers="formData.ans_json" 
      @update:modelValue="handleUpdate" 
    />

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

    <button 
      @click="submitPuzzle" 
      class="submit-btn" 
      :disabled="showResults"
    >
      {{ showResults ? 'Submitted' : 'Submit Answer' }}
    </button>
  </div>
  
  <div v-else class="puzzle-container">
    <p>Loading puzzle...</p>
  </div>
</template>

<style scoped>
.puzzle-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 30px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Segoe UI', sans-serif;
}

h1 { text-align: center; color: #333; margin: 0; }

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
}

.form-row input:focus {
  background-color: #fff;
  border-color: #ff9f43;
  box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.15);
}

/* Highlight invalid fields */
.form-row input:invalid:focus {
  border-color: #ff4757;
  box-shadow: 0 0 0 4px rgba(255, 71, 87, 0.15);
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
}

.submit-btn:hover { background: #e67e22; }

@media (max-width: 480px) {
  .form-row, .clues-container { grid-template-columns: 1fr; }
}
</style>