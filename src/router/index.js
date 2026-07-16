import { createRouter, createWebHistory } from 'vue-router';
import CrosswordPuzzle from '../components/CrosswordPuzzle.vue';
import AdminLogin from '../components/AdminLogin.vue';
import AdminSubmissions from '../components/AdminSubmissions.vue';

const routes = [
  { path: '/puzzle/:id', component: CrosswordPuzzle },
  { path: '/admin', component: AdminLogin },
  { path: '/submissions', component: AdminSubmissions },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
