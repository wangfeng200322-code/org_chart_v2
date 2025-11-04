<template>
  <div class="api-key-panel">
    <input v-model="apiKey" placeholder="Enter API key" />
    <select v-model="storage">
      <option value="session">Session</option>
      <option value="local">Local</option>
      <option value="cookie">Cookie</option>
    </select>
    <button @click="save">Save</button>
    <button @click="clearKey" class="secondary">Clear</button>
  </div>
  <div class="hint">Key is sent as X-API-Key header.</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const apiKey = ref('');
const storage = ref('session');

onMounted(() => {
  const existing = sessionStorage.getItem('apiKey') || localStorage.getItem('apiKey') || getCookie('apiKey') || '';
  if (existing) apiKey.value = existing;
});

function save() {
  clearKey();
  if (!apiKey.value) return;
  if (storage.value === 'session') sessionStorage.setItem('apiKey', apiKey.value);
  else if (storage.value === 'local') localStorage.setItem('apiKey', apiKey.value);
  else if (storage.value === 'cookie') document.cookie = `apiKey=${apiKey.value}; path=/; SameSite=Lax`;
}

function clearKey() {
  sessionStorage.removeItem('apiKey');
  localStorage.removeItem('apiKey');
  document.cookie = 'apiKey=; Max-Age=0; path=/';
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
</script>

<style scoped>
.api-key-panel { display: flex; gap: 0.5rem; align-items: center; }
.api-key-panel input { padding: 0.4rem; }
.api-key-panel select, .api-key-panel button { padding: 0.4rem; }
.hint { font-size: 0.85rem; color: #666; margin-top: 0.25rem; }
.secondary { background: #eee; }
</style>


