import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CrosswordGrid from '../CrosswordGrid.vue';

const simplePuzzle = [
  { startx: 1, starty: 1, orientation: 'across', answer: 'CAT', position: 1, clue: 'Feline pet' },
  { startx: 1, starty: 1, orientation: 'down', answer: 'CAR', position: 1, clue: 'Vehicle' },
];

const singleWordPuzzle = [
  { startx: 1, starty: 1, orientation: 'across', answer: 'HELLO', position: 1, clue: 'Greeting' },
];

describe('CrosswordGrid', () => {
  it('renders correct number of cells for across word', () => {
    const wrapper = mount(CrosswordGrid, { props: { puzzleData: singleWordPuzzle } });
    const inputs = wrapper.findAll('.cell-input');
    expect(inputs.length).toBe(5);
  });

  it('deduplicates shared cells at intersections', () => {
    const wrapper = mount(CrosswordGrid, { props: { puzzleData: simplePuzzle } });
    const inputs = wrapper.findAll('.cell-input');
    expect(inputs.length).toBe(5);
  });

  it('displays position number on first cell of each word', () => {
    const wrapper = mount(CrosswordGrid, { props: { puzzleData: singleWordPuzzle } });
    const firstInput = wrapper.find('.cell-input');
    expect(firstInput.attributes('placeholder')).toBe('1');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(CrosswordGrid, { props: { puzzleData: singleWordPuzzle } });
    const firstInput = wrapper.find('.cell-input');
    await firstInput.setValue('A');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual({ x: 1, y: 1, val: 'A' });
  });

  it('uppercases input value', async () => {
    const wrapper = mount(CrosswordGrid, { props: { puzzleData: singleWordPuzzle } });
    const firstInput = wrapper.find('.cell-input');
    await firstInput.setValue('a');
    expect(firstInput.element.value).toBe('A');
  });

  it('sets inputs to readonly when isReadOnly is true', () => {
    const wrapper = mount(CrosswordGrid, {
      props: { puzzleData: singleWordPuzzle, isReadOnly: true },
    });
    const inputs = wrapper.findAll('.cell-input');
    inputs.forEach(input => {
      expect(input.attributes('readonly')).toBeDefined();
    });
  });

  it('shows existing answers from currentAnswers prop', () => {
    const wrapper = mount(CrosswordGrid, {
      props: {
        puzzleData: singleWordPuzzle,
        currentAnswers: { '1-1': 'H', '2-1': 'E' },
      },
    });
    const inputs = wrapper.findAll('.cell-input');
    expect(inputs[0].element.value).toBe('H');
    expect(inputs[1].element.value).toBe('E');
  });

  it('applies correct class when answer matches', () => {
    const wrapper = mount(CrosswordGrid, {
      props: {
        puzzleData: simplePuzzle,
        currentAnswers: { '1-1': 'C' },
        results: [{ ...simplePuzzle[0], user_answer: 'C' }],
      },
    });
    const firstInput = wrapper.find('.cell-input');
    expect(firstInput.classes()).toContain('correct');
  });

  it('applies wrong class when answer does not match', () => {
    const wrapper = mount(CrosswordGrid, {
      props: {
        puzzleData: simplePuzzle,
        currentAnswers: { '1-1': 'X' },
        results: [{ ...simplePuzzle[0], user_answer: 'X' }],
      },
    });
    const firstInput = wrapper.find('.cell-input');
    expect(firstInput.classes()).toContain('wrong');
  });

  it('sets grid-template-columns with correct column count', () => {
    const wrapper = mount(CrosswordGrid, { props: { puzzleData: singleWordPuzzle } });
    const board = wrapper.find('.grid-board');
    expect(board.attributes('style')).toContain('grid-template-columns');
    expect(board.attributes('style')).toContain('repeat(6');
  });

  it('handles backspace key event', async () => {
    const wrapper = mount(CrosswordGrid, {
      props: {
        puzzleData: singleWordPuzzle,
        currentAnswers: { '1-1': 'H' },
      },
    });
    const firstInput = wrapper.find('.cell-input');
    await firstInput.setValue('H');
    await firstInput.trigger('keydown', { key: 'Backspace' });
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    const lastEmit = wrapper.emitted('update:modelValue').slice(-1)[0][0];
    expect(lastEmit.val).toBe('');
  });

  it('handles space key to toggle direction', async () => {
    const wrapper = mount(CrosswordGrid, {
      props: { puzzleData: simplePuzzle },
    });
    const firstInput = wrapper.find('.cell-input');
    await firstInput.trigger('keydown', { code: 'Space' });
    expect(firstInput.element.value).toBe('');
  });
});
