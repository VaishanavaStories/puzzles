import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

const { mockSingle, mockSelect, mockFrom, mockInsert } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) }));
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({ select: mockSelect, insert: mockInsert }));
  return { mockSingle, mockSelect, mockFrom, mockInsert };
});

vi.mock('../../supabaseClient.js', () => ({
  supabase: { from: mockFrom },
}));

const mockRoute = { params: { id: '550e8400-e29b-41d4-a716-446655440000' } };
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

import CrosswordPuzzle from '../CrosswordPuzzle.vue';

const puzzleJson = JSON.stringify([
  { startx: 1, starty: 1, orientation: 'across', answer: 'CAT', position: 1, clue: 'Feline pet' },
  { startx: 1, starty: 1, orientation: 'down', answer: 'CAR', position: 1, clue: 'Vehicle' },
]);

function mountPuzzle() {
  return mount(CrosswordPuzzle, {
    global: { stubs: { teleport: true } },
  });
}

describe('CrosswordPuzzle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    expect(wrapper.text()).toContain('Loading puzzle...');
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Crossword Challenge!');
    });
  });

  it('renders title after puzzle loads', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Crossword Challenge!');
    });
  });

  it('renders name and email inputs', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      const inputs = wrapper.findAll('.form-row input');
      expect(inputs.length).toBe(2);
    });
  });

  it('renders across and down clue sections', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Across');
      expect(wrapper.text()).toContain('Down');
    });
  });

  it('shows clue text from puzzle data', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Feline pet');
      expect(wrapper.text()).toContain('Vehicle');
    });
  });

  it('shows submit button before submission', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
      expect(wrapper.find('.submit-btn').text()).toBe('Submit Answer');
    });
  });

  it('shows error toast when submitting without name', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
    });
    await wrapper.find('.submit-btn').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.text()).toContain('Please enter both your name and email');
  });

  it('shows error toast for invalid email', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
    });
    const nameInput = wrapper.findAll('.form-row input')[0];
    const emailInput = wrapper.findAll('.form-row input')[1];
    await nameInput.setValue('Test');
    await emailInput.setValue('bad-email');
    await wrapper.find('.submit-btn').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Please enter a valid email address');
  });

  it('shows confirmation modal after validation passes', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
    });
    const nameInput = wrapper.findAll('.form-row input')[0];
    const emailInput = wrapper.findAll('.form-row input')[1];
    await nameInput.setValue('Test');
    await emailInput.setValue('test@example.com');
    await wrapper.find('.submit-btn').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.modal-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('Are you sure');
  });

  it('dismisses confirmation when Go Back is clicked', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
    });
    const nameInput = wrapper.findAll('.form-row input')[0];
    const emailInput = wrapper.findAll('.form-row input')[1];
    await nameInput.setValue('Test');
    await emailInput.setValue('test@example.com');
    await wrapper.find('.submit-btn').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    const goBackBtn = wrapper.findAll('.modal-btn').find(b => b.text() === 'Go Back');
    await goBackBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.modal-card').exists()).toBe(false);
  });

  it('submits to supabase after confirming', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    mockInsert.mockResolvedValue({ error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
    });
    const nameInput = wrapper.findAll('.form-row input')[0];
    const emailInput = wrapper.findAll('.form-row input')[1];
    await nameInput.setValue('Test');
    await emailInput.setValue('test@example.com');
    await wrapper.find('.submit-btn').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    const submitBtn = wrapper.findAll('.modal-btn').find(b => b.text() === 'Submit');
    await submitBtn.trigger('click');
    await vi.waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('crosssword_submissions');
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  it('shows success toast after successful submission', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    mockInsert.mockResolvedValue({ error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
    });
    const nameInput = wrapper.findAll('.form-row input')[0];
    const emailInput = wrapper.findAll('.form-row input')[1];
    await nameInput.setValue('Test');
    await emailInput.setValue('test@example.com');
    await wrapper.find('.submit-btn').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    const submitBtn = wrapper.findAll('.modal-btn').find(b => b.text() === 'Submit');
    await submitBtn.trigger('click');
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Submitted successfully');
    });
  });

  it('replaces submit button with submitted badge after success', async () => {
    mockSingle.mockResolvedValue({ data: { qns_json: puzzleJson }, error: null });
    mockInsert.mockResolvedValue({ error: null });
    const wrapper = mountPuzzle();
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
    });
    const nameInput = wrapper.findAll('.form-row input')[0];
    const emailInput = wrapper.findAll('.form-row input')[1];
    await nameInput.setValue('Test');
    await emailInput.setValue('test@example.com');
    await wrapper.find('.submit-btn').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    const confirmSubmit = wrapper.findAll('.modal-btn').find(b => b.text() === 'Submit');
    await confirmSubmit.trigger('click');
    await vi.waitFor(() => {
      expect(wrapper.find('.submit-btn').exists()).toBe(false);
      expect(wrapper.find('.submitted-badge').exists()).toBe(true);
      expect(wrapper.find('.submitted-badge').text()).toContain('Submitted');
    });
  });
});
