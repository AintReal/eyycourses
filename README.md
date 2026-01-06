# eyycourses - Learning Platform

A full-stack learning management system built with React and Supabase. I built it because basically I wanted to create a course for my tiktok followers but all the existing platforms were either too expensive or too limited in features. So I decided to build my own platform that would give me full control over the content and user experience. This is Version 0.1.1 so mind any bugs or missing features.

---

## What's Inside

- Email/Password auth + Google OAuth
- Access code system for course access control sent by email or SMS
- User profiles with progress tracking and course history (hopefully soon)
- Course and lesson management with full admin dashboard
- uploading lessons with video, text, quizzes, and assignments (hopefully soon)
- Responsive design for mobile and desktop
- so far using Cloudinary to upload videos of lessons
- Bilingual UI with English and Arabic RTL support
- Clean dark theme with zinc gray colors
- Toast notifications for user feedback

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