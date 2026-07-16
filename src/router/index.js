import { createRouter, createWebHistory } from 'vue-router';
import CrosswordPuzzle from '../components/CrosswordPuzzle.vue';
import AdminLogin from '../components/AdminLogin.vue';
import AdminDashboard from '../components/AdminDashboard.vue';
import AdminSubmissions from '../components/AdminSubmissions.vue';
import CreateCrossword from '../components/CreateCrossword.vue';
import CrosswordList from '../components/CrosswordList.vue';

const routes = [
  { path: '/puzzle/:id', component: CrosswordPuzzle },
  { path: '/admin', component: AdminLogin },
  { path: '/dashboard', component: AdminDashboard },
  { path: '/submissions', component: AdminSubmissions },
  { path: '/create', component: CreateCrossword },
  { path: '/crosswords', component: CrosswordList },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
