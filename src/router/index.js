import { createRouter, createWebHistory } from 'vue-router';
import CrosswordPuzzle from '../components/CrosswordPuzzle.vue'; // Create this file

const routes = [
  { path: '/puzzle/:id', component: CrosswordPuzzle }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;