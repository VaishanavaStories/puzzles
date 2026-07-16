<template>
  <div ref="boardRef" class="grid-board" :style="boardStyle">
    <div 
      v-for="(cell, key) in uniqueCells" 
      :key="key"
      class="char-slot"
      :style="slotStyle(cell)"
    >
      <input 
        :ref="el => { if (el) inputRefs[key] = el }"
        maxlength="1" 
        class="cell-input"
        :style="inputStyle"
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
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

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
const lastFocusedKey = ref(null);
let isProgrammaticFocus = false;

const boardRef = ref(null);
const boardWidth = ref(0);
let resizeObserver = null;

const gridCols = computed(() => {
  if (!props.puzzleData) return 0;
  let maxX = 0;
  props.puzzleData.forEach(w => {
    const end = w.orientation === 'across' ? w.startx + w.answer.length : w.startx;
    if (end > maxX) maxX = end;
  });
  return maxX;
});

const cellSize = computed(() => {
  if (!boardWidth.value || !gridCols.value) return 32;
  const fit = Math.floor(boardWidth.value / gridCols.value);
  return Math.min(36, Math.max(28, fit));
});

const boardStyle = computed(() => ({
  '--cell-size': cellSize.value + 'px',
  'grid-template-columns': `repeat(${gridCols.value}, var(--cell-size))`,
  'grid-auto-rows': 'var(--cell-size)',
}));

const slotStyle = (cell) => ({
  'grid-column': cell.x,
  'grid-row': cell.y,
  width: 'var(--cell-size)',
  height: 'var(--cell-size)',
});

const inputStyle = computed(() => {
  const s = cellSize.value;
  return {
    width: (s - 2) + 'px',
    height: (s - 2) + 'px',
    fontSize: Math.max(10, Math.floor(s * 0.45)) + 'px',
  };
});

onMounted(() => {
  nextTick(() => {
    if (boardRef.value && boardRef.value.parentElement) {
      boardWidth.value = boardRef.value.parentElement.clientWidth;
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          boardWidth.value = entry.contentRect.width;
        }
      });
      resizeObserver.observe(boardRef.value.parentElement);
    }
  });
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
});

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

const getWordsAtCell = (x, y) => {
  return props.puzzleData.filter(w => 
    (w.orientation === 'across' && y === w.starty && x >= w.startx && x < w.startx + w.answer.length) ||
    (w.orientation === 'down' && x === w.startx && y >= w.starty && y < w.starty + w.answer.length)
  );
};

const focusCell = (key) => {
  if (inputRefs.value[key]) {
    isProgrammaticFocus = true;
    inputRefs.value[key].focus();
  }
};

const handleCellFocus = (x, y) => {
  const key = `${x}-${y}`;

  if (isProgrammaticFocus) {
    isProgrammaticFocus = false;
    lastFocusedKey.value = key;
    return;
  }

  const words = getWordsAtCell(x, y);

  if (lastFocusedKey.value === key && words.length > 1) {
    currentDirection.value = currentDirection.value === 'across' ? 'down' : 'across';
  } else if (words.length > 0) {
    currentDirection.value = words.some(w => w.orientation === 'across') ? 'across' : 'down';
  }

  lastFocusedKey.value = key;
};

const moveToNextCell = (x, y) => {
  const [dx, dy] = currentDirection.value === 'across' ? [1, 0] : [0, 1];
  let nx = x + dx;
  let ny = y + dy;
  while (isCellInDirection(nx, ny, currentDirection.value)) {
    if (!props.currentAnswers[`${nx}-${ny}`]) {
      focusCell(`${nx}-${ny}`);
      return;
    }
    nx += dx;
    ny += dy;
  }
  if (isCellInDirection(nx - dx, ny - dy, currentDirection.value)) {
    focusCell(`${nx - dx}-${ny - dy}`);
  }
};

const moveToPrevCell = (x, y) => {
  const [dx, dy] = currentDirection.value === 'across' ? [-1, 0] : [0, -1];
  const px = x + dx;
  const py = y + dy;
  if (isCellInDirection(px, py, currentDirection.value)) {
    focusCell(`${px}-${py}`);
  }
};

const handleInput = (event, x, y) => {
  let val = event.target.value.toUpperCase().slice(-1);
  event.target.value = val;
  emit('update:modelValue', { x, y, val });

  if (val) {
    moveToNextCell(x, y);
  }
};

const handleArrowKey = (event, x, y) => {
  event.preventDefault();
  let dx = 0, dy = 0;
  if (event.key === 'ArrowRight') { dx = 1; currentDirection.value = 'across'; }
  else if (event.key === 'ArrowLeft') { dx = -1; currentDirection.value = 'across'; }
  else if (event.key === 'ArrowDown') { dy = 1; currentDirection.value = 'down'; }
  else if (event.key === 'ArrowUp') { dy = -1; currentDirection.value = 'down'; }

  const nx = x + dx;
  const ny = y + dy;
  if (inputRefs.value[`${nx}-${ny}`]) {
    focusCell(`${nx}-${ny}`);
  }
};

const handleKeyDown = (event, x, y) => {
  if (event.code === 'Space') {
    event.preventDefault();
    currentDirection.value = currentDirection.value === 'across' ? 'down' : 'across';
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    if (event.target.value) {
      event.target.value = '';
      emit('update:modelValue', { x, y, val: '' });
    }
    moveToPrevCell(x, y);
  } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    handleArrowKey(event, x, y);
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
  gap: 0;
  width: fit-content;
  margin: 0 auto;
}

.char-slot {
  box-sizing: border-box;
}

.cell-input {
  border: 1px solid #4a90e2;
  border-radius: 4px;
  text-align: center;
  text-transform: uppercase;
  background: #fff;
  font-weight: bold;
  box-sizing: border-box;
  padding: 0;
  -webkit-appearance: none;
  appearance: none;
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
