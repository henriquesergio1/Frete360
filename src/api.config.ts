// api.config.ts

// Mude esta variável para 'mock' para usar os dados fictícios para desenvolvimento local.
// Em produção (Docker), 'api' é o valor correto.
export const API_MODE: 'api' | 'mock' = 'api';

// URL base para o backend. Com o reverse proxy do Nginx, usamos um caminho relativo.
// O Nginx irá encaminhar qualquer requisição que comece com /api para o serviço de backend.
export const API_URL = '/api';
