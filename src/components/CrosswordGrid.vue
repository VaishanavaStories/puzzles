<template>
  <div class="grid-board">
    <div 
      v-for="(cell, key) in uniqueCells" 
      :key="key"
      class="char-slot"
      :style="{ 'grid-column': cell.x, 'grid-row': cell.y }"
    >
      <input 
        :ref="el => inputRefs[key] = el"
        maxlength="1" 
        class="cell-input"
        :class="{ 
          'wrong': getCellStatus(cell.x, cell.y) === 'wrong',
          'correct': getCellStatus(cell.x, cell.y) === 'correct' 
        }"
        :placeholder="cell.pos"
        :readonly="isReadOnly" 
        :value="currentAnswers[`${cell.x}-${cell.y}`] || ''"
        @focus="handleCellFocus(cell.x, cell.y)"
        @keydown="handleKeyDown($event, cell.x, cell.y)"
        @input="handleInput($event, cell.x, cell.y)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  puzzleData: Array,
  isReadOnly: Boolean,
  results: Array,
  currentAnswers: { 
    type: Object,
    default: () => ({})
  }
});
const emit = defineEmits(['update:modelValue']);
const inputRefs = ref({});
const currentDirection = ref('across');

const uniqueCells = computed(() => {
  const cells = {};
  props.puzzleData.forEach(wordObj => {
    for (let i = 0; i < wordObj.answer.length; i++) {
      const x = wordObj.orientation === 'across' ? wordObj.startx + i : wordObj.startx;
      const y = wordObj.orientation === 'down' ? wordObj.starty + i : wordObj.starty;
      const key = `${x}-${y}`;
      
      if (!cells[key]) {
        cells[key] = { x, y, pos: '' };
      }
      
      // If this cell is the start of a word, assign the position number
      if (i === 0) {
        cells[key].pos = wordObj.position;
      }
    }
  });
  return cells;
});

const isCellInDirection = (x, y, direction) => {
  return props.puzzleData.some(w => {
    if (w.orientation !== direction) return false;
    if (direction === 'across') {
      return y === w.starty && x >= w.startx && x < w.startx + w.answer.length;
    } else {
      return x === w.startx && y >= w.starty && y < w.starty + w.answer.length;
    }
  });
};

const handleCellFocus = (x, y) => {
  const words = props.puzzleData.filter(w => 
    (w.orientation === 'across' && y === w.starty && x >= w.startx && x < w.startx + w.answer.length) ||
    (w.orientation === 'down' && x === w.startx && y >= w.starty && y < w.starty + w.answer.length)
  );
  if (words.length > 0) {
    currentDirection.value = words.find(w => w.orientation === 'across') ? 'across' : 'down';
  }
};

const handleInput = (event, x, y) => {
  const val = event.target.value;
  emit('update:modelValue', { x, y, val });

  if (val && val.length === 1) {
    const nextX = currentDirection.value === 'across' ? x + 1 : x;
    const nextY = currentDirection.value === 'down' ? y + 1 : y;
    
    if (isCellInDirection(nextX, nextY, currentDirection.value)) {
      const nextKey = `${nextX}-${nextY}`;
      if (inputRefs.value[nextKey]) inputRefs.value[nextKey].focus();
    }
  }
};

const handleKeyDown = (event, x, y) => {
  if (event.code === 'Space') {
    currentDirection.value = currentDirection.value === 'across' ? 'down' : 'across';
    event.preventDefault();
  } else if (event.key === 'Backspace' && !event.target.value) {
    const prevX = currentDirection.value === 'across' ? x - 1 : x;
    const prevY = currentDirection.value === 'down' ? y - 1 : y;
    const prevKey = `${prevX}-${prevY}`;
    if (inputRefs.value[prevKey]) inputRefs.value[prevKey].focus();
  }
};

const getCellStatus = (x, y) => {
  if (!props.results || props.results.length === 0) return null;
  
  const word = props.results.find(w => {
    if (w.orientation === 'across') return y === w.starty && x >= w.startx && x < w.startx + w.answer.length;
    return x === w.startx && y >= w.starty && y < w.starty + w.answer.length;
  });

  if (!word) return null;
  
  const index = word.orientation === 'across' ? x - word.startx : y - word.starty;
  const userChar = (props.currentAnswers[`${x}-${y}`] || '').toUpperCase();
  const correctChar = word.answer[index]?.toUpperCase();
  
  if (!userChar || userChar === ' ') return null;
  return userChar === correctChar ? 'correct' : 'wrong';
};
</script>

<style scoped>
.grid-board {
  display: grid;
  grid-auto-columns: 32px;
  grid-auto-rows: 32px;
  width: fit-content;
  margin: 0 auto;
}

.char-slot { width: 32px; height: 32px; }

.cell-input {
  width: 30px; height: 30px;
  border: 1px solid #4a90e2;
  border-radius: 4px;
  text-align: center;
  text-transform: uppercase;
  background: #fff;
  font-weight: bold;
  box-sizing: border-box;
  padding: 0;
}

.cell-input:focus {
  background-color: #fffde7;
  border-color: #f39c12;
  outline: none;
}

.cell-input::placeholder { font-size: 9px; color: #aaa; }

.cell-input.wrong {
  background-color: #ffcccc !important;
  border-color: #ff4757 !important;
  color: #ff4757;
}
.cell-input.correct {
  background-color: #d4edda !important;
  border-color: #28a745 !important;
  color: #155724;
}
</style>