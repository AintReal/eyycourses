/**
 * Type Definitions for eyycourses Platform
 * Shared TypeScript interfaces and types
 */


// Database Models
export interface DatabaseUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  code_validated: boolean;
  is_banned: boolean;
  last_login: string | null;
}

export interface DatabaseCourse {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  is_open: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
}

export interface DatabaseLesson {
  id: string;
  course_id: string;
  title_en: string;
  title_ar: string;
  video_url: string;
  content_html: string | null;
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAccessCode {
  id: string;
  code: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
}


// UI Component Props!!!!!

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}


// Form Types

export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  agreeToTerms: boolean;
}

export interface CourseFormData {
  title_en: string;
  title_ar: string;
  description_en?: string;
  description_ar?: string;
  is_open: boolean;
  order_index: number;
}

export interface LessonFormData {
  title_en: string;
  title_ar: string;
  video_url: string;
  content_html?: string;
  order_index: number;
  duration_minutes?: number;
}


// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | ApiError;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}


// Analytics Types

export interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  paidUsers: number;
  freeUsers: number;
  totalRevenue: number;
  activeCourses: number;
  totalLessons: number;
  conversionRate: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface RevenueBySource {
  source: string;
  amount: number;
  count: number;
}

export interface UserGrowthData {
  period: string;
  newUsers: number;
  activeUsers: number;
  churnedUsers: number;
}


// Authentication Types

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: UserMetadata;
  app_metadata: AppMetadata;
  created_at: string;
}

export interface UserMetadata {
  full_name?: string;
  code_validated?: boolean;
  avatar_url?: string;
}

export interface AppMetadata {
  provider?: string;
  providers?: string[];
  is_admin?: boolean;
}


// Video & Media Types

export interface VideoUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface SignedUrl {
  url: string;
  expiresAt: string;
}

export interface MediaFile {
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
}


// Search & Filter Types

export interface SearchFilters {
  query?: string;
  status?: 'active' | 'banned' | 'all';
  codeValidated?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CourseFilters {
  isOpen?: boolean;
  searchQuery?: string;
  sortBy?: 'title' | 'date' | 'order';
}


// Settings & Configuration Types

export interface AppConfig {
  siteName: string;
  supportEmail: string;
  defaultLanguage: 'en' | 'ar';
  pricePerUser: number;
  currency: string;
  maxVideoSize: number;
  allowedVideoFormats: string[];
}

export interface UserPreferences {
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  notifications: boolean;
  emailUpdates: boolean;
}

// Utility Types

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type ValueOf<T> = T[keyof T];


// Route & Navigation Types

export interface RouteConfig {
  path: string;
  title: string;
  component: React.ComponentType;
  requireAuth: boolean;
  requireAdmin: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}


// Notification Types

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
}


// Export all types

export type {
};

export default {
  // This allows importing the entire types module
};
