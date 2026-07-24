<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabaseClient';

const router = useRouter();
const BUCKET = 'connect-images';

onMounted(() => {
  if (!sessionStorage.getItem('admin_id')) {
    router.push('/admin');
  }
});

const connectName = ref('');
const entries = ref([{ clue: '', images: [{ file: null, url: '', uploading: false, preview: '' }], answer: '' }]);
const loading = ref(false);

const toast = ref({ show: false, message: '', type: 'error' });

function showToast(message, type = 'error') {
  toast.value = { show: true, message, type };
}

function addEntry() {
  entries.value.push({ clue: '', images: [{ file: null, url: '', uploading: false, preview: '' }], answer: '' });
}

function removeEntry(index) {
  if (entries.value.length > 1) {
    entries.value.splice(index, 1);
  }
}

function addImage(entry) {
  entry.images.push({ file: null, url: '', uploading: false, preview: '' });
}

function removeImage(entry, imgIndex) {
  if (entry.images.length > 1) {
    entry.images.splice(imgIndex, 1);
  }
}

function onFileSelected(event, entry, imgIndex) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file.');
    event.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image must be under 5MB.');
    event.target.value = '';
    return;
  }

  const img = entry.images[imgIndex];
  img.file = file;
  img.url = '';

  const reader = new FileReader();
  reader.onload = (e) => { img.preview = e.target.result; };
  reader.readAsDataURL(file);
}

async function uploadImage(qnsId, entryIndex, imgIndex, img) {
  const ext = img.file.name.split('.').pop();
  const path = `connect/${qnsId}/${entryIndex}-${imgIndex}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, img.file, { upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

function handleLogout() {
  sessionStorage.removeItem('admin_id');
  router.push('/admin');
}

async function handleCreate() {
  const name = connectName.value.trim();
  if (!name) {
    showToast('Please enter a connect name.');
    return;
  }

  const incomplete = entries.value.some(e => !e.clue.trim() || !e.answer.trim());
  if (incomplete) {
    showToast('Please fill in all clue and answer fields.');
    return;
  }

  const hasImages = entries.value.every(e => e.images.some(img => img.file || img.url));
  if (!hasImages) {
    showToast('Each question needs at least 1 image.');
    return;
  }

  loading.value = true;
  const qnsId = crypto.randomUUID();

  try {
    for (let i = 0; i < entries.value.length; i++) {
      const entry = entries.value[i];
      for (let j = 0; j < entry.images.length; j++) {
        const img = entry.images[j];
        if (img.file && !img.url) {
          img.uploading = true;
          img.url = await uploadImage(qnsId, i, j, img);
          img.uploading = false;
        }
      }
    }

    const validEntries = entries.value.map(e => ({
      clue: e.clue.trim(),
      images: e.images.map(img => img.url).filter(Boolean),
      answer: e.answer.trim(),
    }));

    const qnsJson = JSON.stringify({ questions: validEntries });

    const { error } = await supabase
      .from('connect_qns')
      .insert({ qns_id: qnsId, connect_name: name, qns_json: qnsJson });

    if (error) throw error;

    showToast('Connect game created successfully!', 'success');
    connectName.value = '';
    entries.value = [{ clue: '', images: [{ file: null, url: '', uploading: false, preview: '' }], answer: '' }];
  } catch (err) {
    showToast('Failed to save: ' + err.message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="create-page">
    <header class="create-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/dashboard')">&larr;</button>
        <h1>Create Connect</h1>
      </div>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>

    <div class="create-content">
      <div class="form-card">
        <div class="field">
          <label for="connect-name">Connect Name</label>
          <input
            id="connect-name"
            v-model="connectName"
            type="text"
            placeholder="e.g. Animal Kingdom"
          />
        </div>

        <div class="entries-section">
          <div class="entries-header">
            <label>Questions</label>
            <button class="add-btn" @click="addEntry">+ Add</button>
          </div>

          <TransitionGroup name="entry" tag="div" class="entries-list">
            <div v-for="(entry, index) in entries" :key="index" class="entry-card">
              <div class="entry-card-header">
                <span class="entry-num">{{ index + 1 }}</span>
                <button
                  v-if="entries.length > 1"
                  class="remove-btn"
                  @click="removeEntry(index)"
                >&times;</button>
              </div>

              <div class="entry-fields">
                <div class="field">
                  <label>Clue</label>
                  <input
                    v-model="entry.clue"
                    type="text"
                    placeholder="e.g. Farm animal that says moo"
                  />
                </div>

                <div class="field">
                  <label>Answer</label>
                  <input
                    v-model="entry.answer"
                    type="text"
                    placeholder="e.g. COW"
                    class="answer-input"
                  />
                </div>

                <div class="field">
                  <div class="images-header">
                    <label>Images</label>
                    <button class="add-img-btn" @click="addImage(entry)">+ Image</button>
                  </div>
                  <div class="images-list">
                    <div v-for="(img, imgIndex) in entry.images" :key="imgIndex" class="image-row">
                      <label class="file-label">
                        <input
                          type="file"
                          accept="image/*"
                          class="file-input"
                          @change="onFileSelected($event, entry, imgIndex)"
                        />
                        <span v-if="img.preview" class="thumb-preview">
                          <img :src="img.preview" alt="preview" />
                        </span>
                        <span v-else class="file-placeholder">
                          <span class="file-icon">&#128247;</span>
                          Choose image
                        </span>
                      </label>
                      <span v-if="img.uploading" class="uploading-badge">Uploading...</span>
                      <span v-else-if="img.url" class="uploaded-badge">&#10003; Uploaded</span>
                      <button
                        v-if="entry.images.length > 1"
                        class="remove-img-btn"
                        @click="removeImage(entry, imgIndex)"
                      >&times;</button>
                      <div v-else class="remove-spacer"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <button class="create-btn" :disabled="loading" @click="handleCreate">
          {{ loading ? 'Uploading & Creating...' : 'Create Connect' }}
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
  margin-bottom: 20px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.field input[type="text"] {
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

.field input[type="text"]:focus {
  background-color: #fff;
  border-color: #ff9f43;
  box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.15);
}

.answer-input {
  text-transform: uppercase;
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
  gap: 16px;
}

.entry-card {
  background: #f7f8fa;
  border: 2px solid #e9ecef;
  border-radius: 14px;
  padding: 20px;
  transition: border-color 0.2s ease;
}

.entry-card:focus-within {
  border-color: #ff9f43;
}

.entry-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.entry-num {
  font-size: 14px;
  font-weight: 700;
  color: #ff9f43;
  background: #fff8e1;
  padding: 2px 12px;
  border-radius: 8px;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: #ccc;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s ease;
}

.remove-btn:hover { color: #c0392b; }

.entry-fields {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.entry-fields .field:last-child {
  margin-bottom: 0;
}

.images-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.images-header label {
  margin-bottom: 0;
}

.add-img-btn {
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.add-img-btn:hover { background: #bbdefb; }

.images-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.file-input {
  display: none;
}

.file-placeholder {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fff;
  border: 2px dashed #d0d5dd;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  transition: border-color 0.2s ease, background 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  min-height: 38px;
}

.file-label:hover .file-placeholder {
  border-color: #ff9f43;
  background: #fff8f0;
}

.file-icon {
  font-size: 16px;
}

.thumb-preview {
  display: flex;
  align-items: center;
  width: 100%;
}

.thumb-preview img {
  height: 40px;
  max-width: 120px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid #e9ecef;
}

.uploading-badge {
  font-size: 11px;
  font-weight: 600;
  color: #1976d2;
  background: #e3f2fd;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.uploaded-badge {
  font-size: 11px;
  font-weight: 600;
  color: #1a7f37;
  background: #f0fff4;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.remove-img-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #ccc;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.remove-img-btn:hover { color: #c0392b; }

.remove-spacer {
  width: 26px;
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
