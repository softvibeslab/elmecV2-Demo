// API URLs - Update these to match your backend API
export const URLs = {
  BASE: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.elmec.com/api/v1',

  // Authentication
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  REGISTER: '/auth/register/',
  REGISTER_CUSTOMER: '/auth/register-customer/',

  // User Management
  INFO_USER: '/users/profile/',
  USER_PARTIAL_UPDATE: '/users/profile/update/',
  USER_ADMIN_LIST: '/users/',
  USER_ADMIN_RETRIEVE: '/users/',
  USER_ADMIN_PARTIAL_UPDATE: '/users/',
  USER_ADMIN_PAGINATED: '/users/paginated/',

  // Directory
  DIRECTORY_LIST: '/directory/',

  // Requests
  CUSTOMER_REQUEST_LIST: '/requests/customer/',
  CUSTOMER_REQUEST_RETRIEVE: '/requests/customer/',
  CUSTOMER_REQUEST_COUNT: '/requests/customer/count/',
  AGENT_REQUEST_LIST: '/requests/agent/',
  AGENT_REQUEST_RETRIEVE: '/requests/agent/',
  AGENT_REQUEST_COUNT: '/requests/agent/count/',
  TOTAL_REQUEST_COUNT: '/requests/count/',
  LIST_AGENTS_SELF_REQUEST: '/requests/agents/',
  LIST_CUSTOMER_SELF_REQUEST: '/requests/customers/',

  // Chat
  REQUEST_CHAT_LIST: '/chat/rooms/',
  REQUEST_CHAT_RETRIEVE: '/chat/rooms/',
  REQUEST_CHAT_MESSAGE_LIST: '/chat/messages/',
  REQUEST_CHAT_MESSAGE_CREATE: '/chat/messages/create/',
  REQUEST_CHAT_MESSAGE_CREATEGIF: '/chat/messages/gif/',

  // Misc
  STATES_LIST: '/states/',
  DEVICES_TOKEN: '/devices/token/',
};

// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  REQUESTS: 'requests',
  CHAT_ROOMS: 'chatRooms',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  DEPARTMENTS: 'departments',
  COMPANIES: 'companies',
  FILES: 'files',
  SETTINGS: 'settings',
};

// Real-time Database paths
export const REALTIME_PATHS = {
  PRESENCE: 'presence',
  NOTIFICATIONS: 'notifications',
  TYPING: 'typing',
  ONLINE_USERS: 'onlineUsers',
};

// Request Types
export const REQUEST_TYPES = {
  SALES: 1, // Ventas
  SUPPORT: 2, // Soporte
  QUOTATION: 3, // Cotización
  ORDER_TRACKING: 4, // Rastreo de pedidos
};

// Request Status
export const REQUEST_STATUS = {
  NEW: 'nuevo',
  ASSIGNED: 'asignado',
  IN_PROGRESS: 'en_proceso',
  PAUSED: 'pausado',
  RESOLVED: 'resuelto',
  CLOSED: 'cerrado',
};

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  AGENT: 'agent',
  ADMIN: 'admin',
};

// Chat Types
export const CHAT_TYPES = {
  SUPPORT: 'support',
  SALES: 'sales',
  GENERAL: 'general',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  REQUEST_UPDATE: 'request_update',
  NEW_MESSAGE: 'new_message',
  ASSIGNMENT: 'assignment',
  REMINDER: 'reminder',
  SYSTEM: 'system',
};

// Analytics Events
export const ANALYTICS_EVENTS = {
  // User Events
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',

  // Request Events
  REQUEST_CREATED: 'request_created',
  REQUEST_UPDATED: 'request_updated',
  REQUEST_RESOLVED: 'request_resolved',

  // Chat Events
  CHAT_CREATED: 'chat_created',
  MESSAGE_SENT: 'message_sent',

  // Navigation
  SCREEN_VIEW: 'screen_view',

  // Engagement
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  FEATURE_USED: 'feature_used',
};
