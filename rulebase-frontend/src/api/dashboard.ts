import api from './axios';

export const dashboardApi = {
  getAll: () => api.get('/dashboard'),
};
