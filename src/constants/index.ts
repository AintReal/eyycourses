/**
 * Constants for eyycourses Platform
 * Application-wide constants and configuration values
 */

// Application configuration
export const APP_CONFIG = {
  NAME: 'eyycourses',
  DESCRIPTION: 'Saudi Arabia Learning Platform',
  VERSION: '1.0.0',
  AUTHOR: 'AintReal',
  SUPPORT_EMAIL: 'support@eyycourses.com',
} as const;

// Pricing and revenue configuration
export const PRICING = {
  DEFAULT_COURSE_PRICE: 38,
  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
  CURRENCY_CODE: 'USD',
  PLATFORM_FEE_PERCENTAGE: 20, // For future multi-tenant platform
} as const;

// Language and localization settings
export const LANGUAGES = {
  ENGLISH: 'en',
  ARABIC: 'ar',
  DEFAULT: 'en',
} as const;

export const LANGUAGE_NAMES = {
  [LANGUAGES.ENGLISH]: 'English',
  [LANGUAGES.ARABIC]: 'العربية',
} as const;

export const RTL_LANGUAGES = [LANGUAGES.ARABIC] as const;

// Authentication configuration
export const AUTH = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  PASSWORD_RESET_TIMEOUT: 3600, // 1 hour in seconds
  SESSION_TIMEOUT: 86400, // 24 hours in seconds
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 300, // 5 minutes in seconds
} as const;

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  EDUCATOR: 'educator', // For future multi-tenant platform
} as const;

// Media upload settings
export const MEDIA = {
  MAX_VIDEO_SIZE_MB: 500,
  MAX_VIDEO_SIZE_BYTES: 500 * 1024 * 1024,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_VIDEO_FORMATS: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  ALLOWED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  VIDEO_SIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
} as const;


// Supabase Storage Buckets

export const STORAGE_BUCKETS = {
  LESSON_VIDEOS: 'lesson-videos',
  COURSE_THUMBNAILS: 'course-thumbnails',
  USER_AVATARS: 'user-avatars',
} as const;


// Database Tables

export const TABLES = {
  USERS: 'users',
  COURSES: 'courses',
  LESSONS: 'lessons',
  ACCESS_CODES: 'access_codes',
  PROGRESS: 'progress',
  ENROLLMENTS: 'enrollments',
} as const;


// UI Constants

export const UI = {
  TOAST_DURATION: 5000, // 5 seconds
  TOAST_ANIMATION_DURATION: 300, // 300ms
  ITEMS_PER_PAGE: 20,
  MAX_SEARCH_RESULTS: 100,
  DEBOUNCE_DELAY: 300, // 300ms for search input
} as const;

export const COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
} as const;


// Analytics

export const ANALYTICS = {
  CHART_DAYS_DEFAULT: 7,
  CHART_DAYS_OPTIONS: [7, 14, 30, 90],
  RECENT_USERS_LIMIT: 10,
  TOP_COURSES_LIMIT: 5,
} as const;


// Validation Patterns

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  PHONE_SA: /^(05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/,
  ACCESS_CODE: /^[A-Z0-9]{8}$/,
  YOUTUBE_URL: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
} as const;


// Error Messages

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: `Password must be at least ${AUTH.MIN_PASSWORD_LENGTH} characters.`,
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  ACCOUNT_BANNED: 'You have been banned from this platform. Please contact support.',
  INVALID_ACCESS_CODE: 'Invalid or already used access code.',
  USER_NOT_FOUND: 'User not found.',
  COURSE_NOT_FOUND: 'Course not found.',
  LESSON_NOT_FOUND: 'Lesson not found.',
  FILE_TOO_LARGE: `File size exceeds the maximum allowed size of ${MEDIA.MAX_VIDEO_SIZE_MB}MB.`,
  INVALID_FILE_FORMAT: 'Invalid file format. Please upload a supported format.',
  UPLOAD_FAILED: 'Upload failed. Please try again.',
  DELETE_FAILED: 'Delete operation failed. Please try again.',
} as const;

// Success Messages

export const SUCCESS_MESSAGES = {
  SIGNIN_SUCCESS: 'Welcome back!',
  SIGNUP_SUCCESS: 'Account created! Please check your email to verify.',
  EMAIL_VERIFIED: 'Email verified successfully!',
  CODE_VALIDATED: 'Access code validated! Welcome to the platform.',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_UPDATED: 'Password updated successfully!',
  COURSE_CREATED: 'Course created successfully!',
  COURSE_UPDATED: 'Course updated successfully!',
  COURSE_DELETED: 'Course deleted successfully!',
  LESSON_CREATED: 'Lesson created successfully!',
  LESSON_UPDATED: 'Lesson updated successfully!',
  LESSON_DELETED: 'Lesson deleted successfully!',
  USER_BANNED: 'User banned successfully!',
  USER_UNBANNED: 'User unbanned successfully!',
  USER_DELETED: 'User deleted successfully!',
  CODES_GENERATED: 'Access codes generated successfully!',
  VIDEO_UPLOADED: 'Video uploaded successfully!',
} as const;


// Routes

export const ROUTES = {
  HOME: '/',
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  ADMIN: '/adminpage',
  ADMIN_DASHBOARD: '/admin-dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  COURSES: '/courses',
  LESSON: '/lesson/:id',
} as const;


// Local Storage Keys

export const STORAGE_KEYS = {
  LANGUAGE: 'eyy_language',
  THEME: 'eyy_theme',
  USER_PREFERENCES: 'eyy_preferences',
  LOGIN_LOCKOUT: 'userLoginLockout',
  LAST_VISITED_LESSON: 'eyy_last_lesson',
} as const;


// API Endpoints (for future use)

export const API_ENDPOINTS = {
  VERIFY_ADMIN: '/verify-admin',
  ANALYTICS: '/analytics',
  EXPORT_USERS: '/export/users',
  EXPORT_CODES: '/export/codes',
} as const;


// Feature Flags (for gradual rollout)

export const FEATURE_FLAGS = {
  GOOGLE_AUTH: true,
  MULTI_TENANT: false, // Coming soon after validation
  PAYMENT_INTEGRATION: false, // Coming soon
  PROGRESS_TRACKING: false, // Coming soon
  CERTIFICATES: false, // Coming soon
  LIVE_CHAT: false, // Coming soon
} as const;


// Social Media & Links

export const SOCIAL_LINKS = {
  TIKTOK: 'https://tiktok.com/@eyycourses',
  INSTAGRAM: 'https://instagram.com/eyycourses',
  TWITTER: 'https://twitter.com/eyycourses',
  GITHUB: 'https://github.com/AintReal/eyycourses',
} as const;


// Platform Stats (for marketing/about page)

export const PLATFORM_STATS = {
  TARGET_USERS: 100, // Validation phase target
  TIKTOK_FOLLOWERS: 17000,
  LAUNCH_DATE: '2026-01-01',
  COUNTRIES_SUPPORTED: ['Saudi Arabia'],
} as const;


// Type Exports for TypeScript

export type Language = typeof LANGUAGES[keyof typeof LANGUAGES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];
export type TableName = typeof TABLES[keyof typeof TABLES];
export type RouteKey = typeof ROUTES[keyof typeof ROUTES];


// Default Export
export default {
  APP_CONFIG,
  PRICING,
  LANGUAGES,
  LANGUAGE_NAMES,
  RTL_LANGUAGES,
  AUTH,
  USER_ROLES,
  MEDIA,
  STORAGE_BUCKETS,
  TABLES,
  UI,
  COLORS,
  ANALYTICS,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  STORAGE_KEYS,
  API_ENDPOINTS,
  FEATURE_FLAGS,
  SOCIAL_LINKS,
  PLATFORM_STATS,
};
