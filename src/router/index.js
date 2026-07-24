import { createRouter, createWebHistory } from 'vue-router';
import CrosswordPuzzle from '../components/CrosswordPuzzle.vue';
import AdminLogin from '../components/AdminLogin.vue';
import AdminDashboard from '../components/AdminDashboard.vue';
import AdminSubmissions from '../components/AdminSubmissions.vue';
import CreateCrossword from '../components/CreateCrossword.vue';
import CrosswordList from '../components/CrosswordList.vue';
import CreateMatch from '../components/CreateMatch.vue';
import MatchList from '../components/MatchList.vue';
import MatchSubmissions from '../components/MatchSubmissions.vue';
import MatchFollowing from '../components/MatchFollowing.vue';
import CreateConnect from '../components/CreateConnect.vue';
import ConnectList from '../components/ConnectList.vue';
import ConnectSubmissions from '../components/ConnectSubmissions.vue';
import ConnectGame from '../components/ConnectGame.vue';

const routes = [
  { path: '/puzzle/:id', component: CrosswordPuzzle },
  { path: '/admin', component: AdminLogin },
  { path: '/dashboard', component: AdminDashboard },
  { path: '/submissions', component: AdminSubmissions },
  { path: '/create', component: CreateCrossword },
  { path: '/crosswords', component: CrosswordList },
  { path: '/match/create', component: CreateMatch },
  { path: '/match/list', component: MatchList },
  { path: '/match/submissions', component: MatchSubmissions },
  { path: '/match/:id', component: MatchFollowing },
  { path: '/connect/create', component: CreateConnect },
  { path: '/connect/list', component: ConnectList },
  { path: '/connect/submissions', component: ConnectSubmissions },
  { path: '/connect/:id', component: ConnectGame },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
