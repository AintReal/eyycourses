# eyycourses - Learning Platform

A full-stack learning management system built with React and Supabase. I built it because basically I wanted to create a course for my tiktok followers but all the existing platforms were either too expensive or too limited in features. So I decided to build my own platform that would give me full control over the content and user experience. This is Version 1.3.0 so mind any bugs or missing features.

---

## What's Inside

- Email/Password auth + Google OAuth
- Access code system for course access control sent by email or SMS
- User profiles with progress tracking and course history
- Course and lesson management with full admin dashboard
- uploading lessons with video, text, quizzes, and assignments
- Responsive design for mobile and desktop
- Bilingual UI with English and Arabic RTL support
- Clean dark theme with zinc gray colors

---

## Quick Setup

```bash
# Clone and install
git clone https://github.com/AintReal/eyycourses.git
cd eyycourses
npm install

# Create .env file with your Supabase credentials
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key

# Run development server
npm run dev