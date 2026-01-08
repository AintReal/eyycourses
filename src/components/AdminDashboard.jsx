import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faUsers, faKey, faCheckCircle, faTimesCircle, faBook, faPlus, faEdit, faTrash, faVideo, faTimes, faSpinner, faChartBar, faBan } from '@fortawesome/free-solid-svg-icons';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import Analytics from './Analytics';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '../../node_modules/react-i18next';

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [accessCodes, setAccessCodes] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [miniLessons, setMiniLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showMiniLessonModal, setShowMiniLessonModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingMiniLesson, setEditingMiniLesson] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  const ffmpegRef = useRef(new FFmpeg());
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const [sectionForm, setSectionForm] = useState({
    title_en: '',
    title_ar: '',
    description_en: '',
    description_ar: '',
    order_index: 0
  });

  const [courseForm, setCourseForm] = useState({
    title_en: '',
    title_ar: '',
    section_id: '',
    is_open: false,
    order_index: 0
  });

  const [lessonForm, setLessonForm] = useState({
    title_en: '',
    title_ar: '',
    video_url: '',
    content_html: '',
    order_index: 0
  });

  const [miniLessonForm, setMiniLessonForm] = useState({
    title_en: '',
    title_ar: '',
    video_url: '',
    content_html: '',
    order_index: 0
  });

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Question builder state
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState([{ text: '', isCorrect: false }]);

  // Force English and LTR for Admin Dashboard
  useEffect(() => {
    i18n.changeLanguage('en');
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  }, [i18n]);

  useEffect(() => {
    loadFFmpeg();
  }, []);

  const loadFFmpeg = async () => {
    try {
      const ffmpeg = ffmpegRef.current;
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setFfmpegLoaded(true);
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      setFfmpegLoaded(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, [navigate]);

  useEffect(() => {
    const generatePreviewUrl = async () => {
      if (!lessonForm.video_url) {
        setPreviewVideoUrl(null);
        return;
      }

      if (lessonForm.video_url.startsWith('lesson-videos/')) {
        try {
          const filePath = lessonForm.video_url.replace('lesson-videos/', '');
          const { data, error } = await supabase.storage
            .from('lesson-videos')
            .createSignedUrl(filePath, 3600);

          if (error) throw error;
          setPreviewVideoUrl(data.signedUrl);
        } catch (error) {
          console.error('Error generating preview URL:', error);
          setPreviewVideoUrl(null);
        }
      } else {
        setPreviewVideoUrl(lessonForm.video_url);
      }
    };

    generatePreviewUrl();
  }, [lessonForm.video_url]);

  const checkAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate('/adminpage');
      return;
    }
    
    // Verify admin privileges
    const isAdmin = session.user.user_metadata?.is_admin === true;
    if (!isAdmin) {
      setToast({ message: 'Access denied. Admin privileges required.', type: 'error' });
      await supabase.auth.signOut();
      navigate('/adminpage');
      return;
    }
    
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch users from public.users table instead of auth.admin
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    }
    
    if (usersData) {
      // Add user numbers based on creation order
      const usersWithNumbers = usersData.map((user, index) => ({
        ...user,
        userNumber: index + 1
      }));
      setUsers(usersWithNumbers);
    }

    const { data: codesData } = await supabase
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (codesData) setAccessCodes(codesData);

    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .order('order_index', { ascending: true });
    if (sectionsData) setSections(sectionsData);

    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('order_index', { ascending: true });
    if (coursesData) setCourses(coursesData);

    setLoading(false);
  };

  const fetchLessons = async (courseId) => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    if (data) setLessons(data);
  };

  const fetchMiniLessons = async (lessonId) => {
    const { data } = await supabase
      .from('mini_lessons')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true });
    if (data) setMiniLessons(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/adminpage');
  };

  const generateNewCodes = async (count) => {
    const newCodes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      newCodes.push({ code, is_used: false });
    }
    const { error } = await supabase.from('access_codes').insert(newCodes);
    if (!error) {
      fetchData();
      setToast({ message: `${count} new codes generated!`, type: 'success' });
    }
  };

  const deleteUser = async (userId, userEmail) => {
    setConfirmDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete ${userEmail}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // Delete from public.users table
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
          
          if (error) throw error;
          
          setToast({ message: 'User deleted successfully!', type: 'success' });
          await fetchData();
        } catch (error) {
          console.error('Error deleting user:', error);
          setToast({ message: 'Error deleting user: ' + error.message, type: 'error' });
        }
        setConfirmDialog(null);
      }
    });
  };

  const banUser = async (userId, userEmail, currentBanStatus) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    setConfirmDialog({
      title: `${action === 'ban' ? 'Ban' : 'Unban'} User`,
      message: `Are you sure you want to ${action} ${userEmail}?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('users')
            .update({ is_banned: !currentBanStatus })
            .eq('id', userId);
          
          if (error) throw error;
          
          setToast({ message: `User ${action}ned successfully!`, type: 'success' });
          await fetchData();
        } catch (error) {
          console.error(`Error ${action}ning user:`, error);
          setToast({ message: `Error ${action}ning user: ` + error.message, type: 'error' });
        }
        setConfirmDialog(null);
      }
    });
  };

  // ========== SECTION MANAGEMENT ==========
  const openSectionModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setSectionForm(section);
    } else {
      setEditingSection(null);
      setSectionForm({ 
        title_en: '', 
        title_ar: '', 
        description_en: '', 
        description_ar: '', 
        order_index: sections.length 
      });
    }
    setShowSectionModal(true);
  };

  const saveSection = async () => {
    if (!sectionForm.title_en.trim() || !sectionForm.title_ar.trim()) {
      setToast({ message: 'Please fill in both English and Arabic titles', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editingSection) {
        const { error } = await supabase
          .from('sections')
          .update({
            title_en: sectionForm.title_en,
            title_ar: sectionForm.title_ar,
            description_en: sectionForm.description_en,
            description_ar: sectionForm.description_ar,
            order_index: sectionForm.order_index
          })
          .eq('id', editingSection.id);
        
        if (error) throw error;
        setToast({ message: 'Section updated successfully!', type: 'success' });
      } else {
        const { error } = await supabase
          .from('sections')
          .insert([{
            title_en: sectionForm.title_en,
            title_ar: sectionForm.title_ar,
            description_en: sectionForm.description_en,
            description_ar: sectionForm.description_ar,
            order_index: sectionForm.order_index
          }]);
        
        if (error) throw error;
        setToast({ message: 'Section created successfully!', type: 'success' });
      }
      
      setShowSectionModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving section:', error);
      setToast({ message: 'Error saving section: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (id) => {
    setConfirmDialog({
      title: 'Delete Section',
      message: 'Are you sure? This will delete all courses and lessons in this section.',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('sections').delete().eq('id', id);
          if (error) throw error;
          setToast({ message: 'Section deleted successfully!', type: 'success' });
          await fetchData();
        } catch (error) {
          console.error('Error deleting section:', error);
          setToast({ message: 'Error deleting section: ' + error.message, type: 'error' });
        }
        setConfirmDialog(null);
      }
    });
  };

  // ========== COURSE MANAGEMENT ==========
  const toggleCourseStatus = async (course) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_open: !course.is_open })
      .eq('id', course.id);
    if (!error) fetchData();
  };

  const openCourseModal = (course = null, sectionId = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm(course);
    } else {
      setEditingCourse(null);
      setCourseForm({ 
        title_en: '', 
        title_ar: '', 
        section_id: sectionId || '', 
        is_open: false, 
        order_index: courses.length 
      });
    }
    setShowCourseModal(true);
  };

  const saveCourse = async () => {
    if (!courseForm.title_en.trim() || !courseForm.title_ar.trim()) {
      setToast({ message: 'Please fill in both English and Arabic titles', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update({
            title_en: courseForm.title_en,
            title_ar: courseForm.title_ar,
            section_id: courseForm.section_id || null,
            is_open: courseForm.is_open,
            order_index: courseForm.order_index
          })
          .eq('id', editingCourse.id);
        
        if (error) throw error;
        setToast({ message: 'Course updated successfully!', type: 'success' });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([{
            title_en: courseForm.title_en,
            title_ar: courseForm.title_ar,
            section_id: courseForm.section_id || null,
            is_open: courseForm.is_open,
            order_index: courseForm.order_index
          }]);
        
        if (error) throw error;
        setToast({ message: 'Course created successfully!', type: 'success' });
      }
      
      setShowCourseModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving course:', error);
      setToast({ message: 'Error saving course: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (id) => {
    setConfirmDialog({
      title: 'Delete Course',
      message: 'Are you sure? This will delete all lessons in this course.',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('courses').delete().eq('id', id);
          if (error) throw error;
          setToast({ message: 'Course deleted successfully!', type: 'success' });
          await fetchData();
        } catch (error) {
          console.error('Error deleting course:', error);
          setToast({ message: 'Error deleting course: ' + error.message, type: 'error' });
        }
        setConfirmDialog(null);
      }
    });
  };

  const openLessonModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm(lesson);
    } else {
      setEditingLesson(null);
      setLessonForm({
        title_en: '',
        title_ar: '',
        video_url: '',
        content_html: '',
        order_index: lessons.length
      });
    }
    setShowLessonModal(true);
  };

  const convertVideoToMP4 = async (file) => {
    if (!ffmpegLoaded) {
      throw new Error('Video converter not ready. Please try again.');
    }

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Write input file
      await ffmpeg.writeFile('input', await fetchFile(file));
      
      // Convert to MP4 with H.264 codec (universal compatibility)
      await ffmpeg.exec([
        '-i', 'input',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-profile:v', 'high',
        '-level', '4.0',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        'output.mp4'
      ]);
      
      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      
      // Clean up
      await ffmpeg.deleteFile('input');
      await ffmpeg.deleteFile('output.mp4');
      
      // Return as Blob
      return new Blob([data.buffer], { type: 'video/mp4' });
    } catch (error) {
      console.error('Video conversion error:', error);
      throw new Error('Failed to convert video. Uploading original format.');
    }
  };

  const uploadVideoToStorage = async (file) => {
    try {
      setUploadingVideo(true);
      setUploadProgress(0);

      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/mov'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|avi)$/i)) {
        throw new Error('Invalid file type. Please upload a video file.');
      }

      // Max 500MB to prevent storage abuse
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 500MB.');
      }

      setUploadProgress(20);

      // Always convert to H.264+AAC for universal compatibility
      let uploadFile = file;
      
      if (ffmpegLoaded) {
        setToast({ message: 'Converting video to universal format for all devices... This may take a few minutes.', type: 'info' });
        try {
          uploadFile = await convertVideoToMP4(file);
          setToast({ message: 'Video converted successfully! Now works on all devices. Uploading...', type: 'success' });
        } catch (conversionError) {
          console.warn('Conversion failed, uploading original:', conversionError);
          setToast({ message: 'Warning: Conversion failed. Uploading original format. May not work on Windows.', type: 'warning' });
        }
      } else {
        setToast({ message: 'Warning: Video converter not loaded. Video may not work on all devices.', type: 'warning' });
      }

      setUploadProgress(50);

      // Unique filename with timestamp
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
      const filePath = `lessons/${fileName}`;

      const { data, error } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'video/mp4'
        });

      if (error) throw error;

      // Store path (not public URL) - signed URLs generated on-demand
      const storagePath = `lesson-videos/${filePath}`;

      setUploadProgress(100);
      return storagePath;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedVideoFile(file);
    
    try {
      const videoUrl = await uploadVideoToStorage(file);
      
      // Update the appropriate form based on which modal is open
      if (showMiniLessonModal) {
        setMiniLessonForm({ ...miniLessonForm, video_url: videoUrl });
      } else {
        setLessonForm({ ...lessonForm, video_url: videoUrl });
      }
      
      setToast({ message: 'Video uploaded successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Upload failed: ' + error.message, type: 'error' });
      setSelectedVideoFile(null);
    }
  };

  const saveLesson = async () => {
    if (!lessonForm.title_en.trim() || !lessonForm.title_ar.trim()) {
      setToast({ message: 'Please fill in both English and Arabic titles', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const lessonData = {
        course_id: selectedCourse,
        title_en: lessonForm.title_en,
        title_ar: lessonForm.title_ar,
        video_url: lessonForm.video_url || null,
        content_html: lessonForm.content_html || null,
        order_index: lessonForm.order_index
      };

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);
        
        if (error) throw error;
        setToast({ message: 'Lesson updated successfully!', type: 'success' });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([lessonData]);
        
        if (error) throw error;
        setToast({ message: 'Lesson created successfully!', type: 'success' });
      }
      
      setShowLessonModal(false);
      await fetchLessons(selectedCourse);
    } catch (error) {
      console.error('Error saving lesson:', error);
      setToast({ message: 'Error saving lesson: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (id) => {
    setConfirmDialog({
      title: 'Delete Lesson',
      message: 'Are you sure you want to delete this lesson?',
      onConfirm: async () => {
        try {
          const lesson = lessons.find(l => l.id === id);
          
          const { error } = await supabase.from('lessons').delete().eq('id', id);
          if (error) throw error;

          if (lesson?.video_url && lesson.video_url.startsWith('lesson-videos/')) {
            try {
              const filePath = lesson.video_url.replace('lesson-videos/', '');
              await supabase.storage
                .from('lesson-videos')
                .remove([filePath]);
            } catch (storageError) {
              console.error('Error deleting video from storage:', storageError);
            }
          }

          setToast({ message: 'Lesson deleted successfully!', type: 'success' });
          await fetchLessons(selectedCourse);
        } catch (error) {
          console.error('Error deleting lesson:', error);
          setToast({ message: 'Error deleting lesson: ' + error.message, type: 'error' });
        }
        setConfirmDialog(null);
      }
    });
  };

  // ========== MINI-LESSON MANAGEMENT ==========
  const openMiniLessonModal = (miniLesson = null) => {
    if (miniLesson) {
      setEditingMiniLesson(miniLesson);
      setMiniLessonForm(miniLesson);
    } else {
      setEditingMiniLesson(null);
      setMiniLessonForm({
        title_en: '',
        title_ar: '',
        video_url: '',
        content_html: '',
        order_index: miniLessons.length
      });
    }
    setShowMiniLessonModal(true);
  };

  const saveMiniLesson = async () => {
    if (!miniLessonForm.title_en.trim() || !miniLessonForm.title_ar.trim()) {
      setToast({ message: 'Please fill in both English and Arabic titles', type: 'error' });
      return;
    }

    if (!selectedLesson) {
      setToast({ message: 'No lesson selected', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editingMiniLesson) {
        const { error } = await supabase
          .from('mini_lessons')
          .update({
            title_en: miniLessonForm.title_en,
            title_ar: miniLessonForm.title_ar,
            video_url: miniLessonForm.video_url,
            content_html: miniLessonForm.content_html,
            order_index: miniLessonForm.order_index
          })
          .eq('id', editingMiniLesson.id);
        
        if (error) throw error;
        setToast({ message: 'Mini-lesson updated successfully!', type: 'success' });
      } else {
        const { error } = await supabase
          .from('mini_lessons')
          .insert([{
            lesson_id: selectedLesson,
            title_en: miniLessonForm.title_en,
            title_ar: miniLessonForm.title_ar,
            video_url: miniLessonForm.video_url,
            content_html: miniLessonForm.content_html,
            order_index: miniLessonForm.order_index
          }]);
        
        if (error) throw error;
        setToast({ message: 'Mini-lesson created successfully!', type: 'success' });
      }
      
      setShowMiniLessonModal(false);
      await fetchMiniLessons(selectedLesson);
    } catch (error) {
      console.error('Error saving mini-lesson:', error);
      setToast({ message: 'Error saving mini-lesson: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteMiniLesson = async (id) => {
    setConfirmDialog({
      title: 'Delete Mini-Lesson',
      message: 'Are you sure you want to delete this mini-lesson?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('mini_lessons').delete().eq('id', id);
          if (error) throw error;
          setToast({ message: 'Mini-lesson deleted successfully!', type: 'success' });
          await fetchMiniLessons(selectedLesson);
        } catch (error) {
          console.error('Error deleting mini-lesson:', error);
          setToast({ message: 'Error deleting mini-lesson: ' + error.message, type: 'error' });
        }
        setConfirmDialog(null);
      }
    });
  };

  // Question Builder Functions
  const addAnswer = () => {
    setQuestionAnswers([...questionAnswers, { text: '', isCorrect: false }]);
  };

  const removeAnswer = (index) => {
    if (questionAnswers.length > 1) {
      setQuestionAnswers(questionAnswers.filter((_, i) => i !== index));
    }
  };

  const updateAnswer = (index, text) => {
    const updated = [...questionAnswers];
    updated[index].text = text;
    setQuestionAnswers(updated);
  };

  const setCorrectAnswer = (index) => {
    const updated = questionAnswers.map((answer, i) => ({
      ...answer,
      isCorrect: i === index
    }));
    setQuestionAnswers(updated);
  };

  const insertQuestion = () => {
    if (!questionText.trim()) {
      setToast({ message: t('pleaseEnterQuestion'), type: 'error' });
      return;
    }

    const validAnswers = questionAnswers.filter(a => a.text.trim());
    if (validAnswers.length < 2) {
      setToast({ message: t('pleaseAddTwoAnswers'), type: 'error' });
      return;
    }

    const hasCorrectAnswer = validAnswers.some(a => a.isCorrect);
    if (!hasCorrectAnswer) {
      setToast({ message: t('pleaseSelectCorrectAnswer'), type: 'error' });
      return;
    }

    // Create question object in JSON format
    const questionData = {
      type: 'question',
      question: questionText,
      answers: validAnswers
    };

    // Insert as a special formatted block
    const questionBlock = `\n\n[QUESTION]${JSON.stringify(questionData)}[/QUESTION]\n\n`;
    
    setMiniLessonForm({
      ...miniLessonForm,
      content_html: miniLessonForm.content_html + questionBlock
    });

    // Reset question builder
    setQuestionText('');
    setQuestionAnswers([{ text: '', isCorrect: false }]);
    setShowQuestionBuilder(false);
    setToast({ message: t('questionAddedSuccessfully'), type: 'success' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex relative overflow-hidden">
      {/* Grid Background Effect */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundColor: "#27272a",
          backgroundSize: "8px 8px",
          maskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 80% 80% at 0% 50%, #000 50%, transparent 90%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 80% 80% at 0% 50%, #000 50%, transparent 90%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      {/* Sidebar */}
      <div className="w-64 bg-zinc-950/80 backdrop-blur border-r border-zinc-800 flex flex-col fixed h-full z-10">
        {/* Logo/Header */}
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-sm text-zinc-500 mt-1">eyycourses</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
              activeTab === 'analytics' 
                ? 'bg-white text-black font-medium shadow-lg' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <FontAwesomeIcon icon={faChartBar} className="text-base" />
            <span>Analytics</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('sections');
              setSelectedSection(null);
              setSelectedCourse(null);
              setSelectedLesson(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
              activeTab === 'sections' 
                ? 'bg-white text-black font-medium shadow-lg' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <FontAwesomeIcon icon={faBook} className="text-base" />
            <span className="flex-1 text-left">Sections</span>
            <Badge variant="secondary" className={`text-xs ${activeTab === 'sections' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-100'}`}>
              {sections.length}
            </Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('courses')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
              activeTab === 'courses' 
                ? 'bg-white text-black font-medium shadow-lg' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <FontAwesomeIcon icon={faBook} className="text-base" />
            <span className="flex-1 text-left">All Courses</span>
            <Badge variant="secondary" className={`text-xs ${activeTab === 'courses' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-100'}`}>
              {courses.length}
            </Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
              activeTab === 'users' 
                ? 'bg-white text-black font-medium shadow-lg' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <FontAwesomeIcon icon={faUsers} className="text-base" />
            <span className="flex-1 text-left">Users</span>
            <Badge variant="secondary" className={`text-xs ${activeTab === 'users' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-100'}`}>
              {users.length}
            </Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('codes')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
              activeTab === 'codes' 
                ? 'bg-white text-black font-medium shadow-lg' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <FontAwesomeIcon icon={faKey} className="text-base" />
            <span className="flex-1 text-left">Access Codes</span>
            <Badge variant="secondary" className={`text-xs ${activeTab === 'codes' ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-100'}`}>
              {accessCodes.length}
            </Badge>
          </button>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-zinc-800">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Analytics />
          )}

          {/* Sections Tab - Main View */}
          {activeTab === 'sections' && !selectedSection && !selectedCourse && !selectedLesson && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Sections & Courses</h2>
              <Button onClick={() => openSectionModal()} className="text-white">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Section
              </Button>
            </div>

            {sections.map((section) => (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader className="bg-zinc-900/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {section.title_en} / {section.title_ar}
                      </CardTitle>
                      {section.description_en && (
                        <CardDescription className="mt-2">{section.description_en}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openCourseModal(null, section.id)}
                        title="Add course to this section"
                        className="text-white"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                        Course
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openSectionModal(section)}
                        className="text-white"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSection(section.id)}
                        className="text-white"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {courses.filter(c => c.section_id === section.id).length === 0 ? (
                    <p className="text-zinc-500 text-sm italic">No courses in this section yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {courses.filter(c => c.section_id === section.id).map((course) => (
                        <Card key={course.id} className="bg-zinc-900/30">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-base text-zinc-100">
                                  {course.title_en} / {course.title_ar}
                                </h4>
                                <div className="flex items-center gap-2 mt-3">
                                  <Badge variant={course.is_open ? "default" : "secondary"}>
                                    {course.is_open ? 'Open' : 'Soon'}
                                  </Badge>
                                  <button
                                    onClick={() => {
                                      setSelectedCourse(course.id);
                                      fetchLessons(course.id);
                                    }}
                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                                  >
                                    View Lessons →
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => openCourseModal(course)}
                                  className="text-white"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteCourse(course.id)}
                                  className="text-white"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Courses without sections */}
            {courses.filter(c => !c.section_id).length > 0 && (
              <Card>
                <CardHeader className="bg-zinc-900/50">
                  <CardTitle className="text-lg">Uncategorized Courses</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-3">
                    {courses.filter(c => !c.section_id).map((course) => (
                      <Card key={course.id} className="bg-zinc-900/30">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base text-zinc-100">
                                {course.title_en} / {course.title_ar}
                              </h4>
                              <button
                                onClick={() => {
                                  setSelectedCourse(course.id);
                                  fetchLessons(course.id);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-2 transition"
                              >
                                View Lessons →
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openCourseModal(course)}
                                className="text-white"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteCourse(course.id)}
                                className="text-white"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Lessons View (when course is selected from sections) */}
        {activeTab === 'sections' && selectedCourse && !selectedLesson && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-300 hover:text-white mb-2"
                >
                  ← Back to Sections
                </button>
                <h2 className="text-xl font-semibold">
                  Lessons - {courses.find(c => c.id === selectedCourse)?.title_en}
                </h2>
              </div>
              <button
                onClick={() => openLessonModal()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Lesson
              </button>
            </div>

            <div className="grid gap-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {lesson.title_en} / {lesson.title_ar}
                      </h3>
                      {lesson.video_url && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <FontAwesomeIcon icon={faVideo} />
                          <span>Has video</span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson.id);
                          fetchMiniLessons(lesson.id);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View Mini-Lessons →
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openLessonModal(lesson)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => deleteLesson(lesson.id)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mini-Lessons View (when lesson is selected) */}
        {activeTab === 'sections' && selectedLesson && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-gray-300 hover:text-white mb-2"
                >
                  ← Back to Lessons
                </button>
                <h2 className="text-xl font-semibold">
                  Mini-Lessons - {lessons.find(l => l.id === selectedLesson)?.title_en}
                </h2>
              </div>
              <button
                onClick={() => openMiniLessonModal()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Mini-Lesson
              </button>
            </div>

            <div className="grid gap-4">
              {miniLessons.map((miniLesson) => (
                <div key={miniLesson.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {miniLesson.title_en} / {miniLesson.title_ar}
                      </h3>
                      {miniLesson.video_url && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <FontAwesomeIcon icon={faVideo} />
                          <span>Has video</span>
                        </div>
                      )}
                      {miniLesson.content_html && (
                        <p className="text-sm text-gray-400">Has HTML content</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openMiniLessonModal(miniLesson)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => deleteMiniLesson(miniLesson.id)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && !selectedCourse && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Manage Courses</h2>
              <Button onClick={() => openCourseModal()} className="text-white">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Course
              </Button>
            </div>

            <div className="grid gap-4">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-zinc-100">
                            {course.title_en} / {course.title_ar}
                          </h3>
                          <Badge variant={course.is_open ? "default" : "secondary"}>
                            {course.is_open ? 'Open' : 'Soon'}
                          </Badge>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCourse(course.id);
                            fetchLessons(course.id);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                        >
                          View Lessons →
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openCourseModal(course)}
                          className="text-white"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCourse(course.id)}
                          className="text-white"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Lessons View */}
        {activeTab === 'courses' && selectedCourse && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-300 hover:text-white mb-2"
                >
                  ← Back to Courses
                </button>
                <h2 className="text-xl font-semibold">
                  Lessons - {courses.find(c => c.id === selectedCourse)?.title_en}
                </h2>
              </div>
              <button
                onClick={() => openLessonModal()}
                className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl transition font-medium border border-zinc-600"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Lesson
              </button>
            </div>

            <div className="grid gap-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {lesson.title_en} / {lesson.title_ar}
                      </h3>
                      {lesson.video_url && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <FontAwesomeIcon icon={faVideo} />
                          <span>{lesson.video_url}</span>
                        </div>
                      )}
                      {lesson.content_html && (
                        <p className="text-sm text-gray-400">Has HTML content</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openLessonModal(lesson)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => deleteLesson(lesson.id)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Registered Users</h2>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-sm">Show:</span>
                  <div className="flex gap-1">
                    {[10, 20, 50, 100].map((count) => (
                      <Button
                        key={count}
                        variant={usersPerPage === count ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUsersPerPage(count);
                          setCurrentPage(1);
                        }}
                        className="text-white"
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <Input
                type="text"
                placeholder="Search by #, email, or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to page 1 when searching
                }}
                className="w-80"
              />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-center">Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Filter users based on search query
                      const filteredUsers = users.filter((user) => {
                        if (!searchQuery) return true;
                        const query = searchQuery.toLowerCase();
                        return (
                          user.userNumber.toString().includes(query) ||
                          user.email.toLowerCase().includes(query) ||
                          (user.full_name && user.full_name.toLowerCase().includes(query))
                        );
                      });

                      // Calculate pagination
                      const indexOfLastUser = currentPage * usersPerPage;
                      const indexOfFirstUser = indexOfLastUser - usersPerPage;
                      const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

                      return currentUsers.map((user) => (
                      <TableRow key={user.id} className={user.is_banned ? 'bg-red-950/20' : ''}>
                        <TableCell className="font-mono text-zinc-400">#{user.userNumber}</TableCell>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || '-'}</TableCell>
                        <TableCell className="text-zinc-400">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-center">
                          {user.code_validated ? (
                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                          ) : (
                            <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_banned ? "destructive" : "default"}>
                            {user.is_banned ? 'Banned' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => banUser(user.id, user.email, user.is_banned)}
                              title={user.is_banned ? 'Unban user' : 'Ban user'}
                              className="text-white"
                            >
                              <FontAwesomeIcon 
                                icon={faBan} 
                                className={user.is_banned ? 'text-green-500' : 'text-zinc-400'}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteUser(user.id, user.email)}
                              title="Delete user"
                              className="text-white"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {(() => {
              const filteredUsers = users.filter((user) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  user.userNumber.toString().includes(query) ||
                  user.email.toLowerCase().includes(query) ||
                  (user.full_name && user.full_name.toLowerCase().includes(query))
                );
              });
              const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
              
              if (totalPages <= 1) return null;

              return (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="text-white"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="text-white w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="text-white"
                  >
                    Next
                  </Button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Access Codes Tab */}
        {activeTab === 'codes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Access Codes</h2>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => generateNewCodes(10)}
                  className="text-white"
                >
                  Generate 10 Codes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => generateNewCodes(50)}
                  className="text-white"
                >
                  Generate 50 Codes
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessCodes.map((code) => {
                      const usedByUser = users.find(u => u.id === code.used_by);
                      return (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono">{code.code}</TableCell>
                          <TableCell>
                            <Badge variant={code.used ? "destructive" : "default"}>
                              {code.used ? 'Used' : 'Available'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {usedByUser ? (
                              <span className="text-blue-400 font-medium">User #{usedByUser.userNumber}</span>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-zinc-400">{new Date(code.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
        </div>

        {/* Modals */}      {/* Section Modal */}
      <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
            <DialogDescription>
              {editingSection ? 'Update section information' : 'Create a new section for organizing courses'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-title-en">Title (English)</Label>
              <Input
                id="section-title-en"
                value={sectionForm.title_en}
                onChange={(e) => setSectionForm({...sectionForm, title_en: e.target.value})}
                placeholder="e.g., Programming Courses"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-title-ar">Title (Arabic)</Label>
              <Input
                id="section-title-ar"
                value={sectionForm.title_ar}
                onChange={(e) => setSectionForm({...sectionForm, title_ar: e.target.value})}
                placeholder="دورات البرمجة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-desc-en">Description (English)</Label>
              <Input
                id="section-desc-en"
                value={sectionForm.description_en}
                onChange={(e) => setSectionForm({...sectionForm, description_en: e.target.value})}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-desc-ar">Description (Arabic)</Label>
              <Input
                id="section-desc-ar"
                value={sectionForm.description_ar}
                onChange={(e) => setSectionForm({...sectionForm, description_ar: e.target.value})}
                placeholder="وصف اختياري"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-order">Order Index</Label>
              <Input
                id="section-order"
                type="number"
                value={sectionForm.order_index}
                onChange={(e) => setSectionForm({...sectionForm, order_index: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSectionModal(false)}
              disabled={saving}
              className="text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSection}
              disabled={saving}
              className="text-white"
            >
              {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Modal */}
      <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Update course information' : 'Create a new course'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course-section">Section</Label>
              <select
                id="course-section"
                value={courseForm.section_id || ''}
                onChange={(e) => setCourseForm({...courseForm, section_id: e.target.value})}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700"
              >
                <option value="">No Section (Uncategorized)</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.title_en}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-title-en">Title (English)</Label>
              <Input
                id="course-title-en"
                value={courseForm.title_en}
                onChange={(e) => setCourseForm({...courseForm, title_en: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-title-ar">Title (Arabic)</Label>
              <Input
                id="course-title-ar"
                value={courseForm.title_ar}
                onChange={(e) => setCourseForm({...courseForm, title_ar: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-order">Order Index</Label>
              <Input
                id="course-order"
                type="number"
                value={courseForm.order_index}
                onChange={(e) => setCourseForm({...courseForm, order_index: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="course-open"
                checked={courseForm.is_open}
                onChange={(e) => setCourseForm({...courseForm, is_open: e.target.checked})}
                className="w-4 h-4 rounded border-zinc-800 bg-zinc-900"
              />
              <Label htmlFor="course-open" className="font-normal cursor-pointer">Course is Open (not Soon)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCourseModal(false)}
              disabled={saving}
              className="text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={saveCourse}
              disabled={saving}
              className="text-white"
            >
              {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Modal */}
      <Dialog open={showLessonModal} onOpenChange={setShowLessonModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Update lesson information and content' : 'Create a new lesson with video and content'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title-en">Title (English)</Label>
              <Input
                id="lesson-title-en"
                value={lessonForm.title_en}
                onChange={(e) => setLessonForm({...lessonForm, title_en: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-title-ar">Title (Arabic)</Label>
              <Input
                id="lesson-title-ar"
                value={lessonForm.title_ar}
                onChange={(e) => setLessonForm({...lessonForm, title_ar: e.target.value})}
              />
            </div>
            
            {/* Video Upload Section */}
            <div className="space-y-3">
              <Label className="text-base">Video</Label>
              
              {!ffmpegLoaded && (
                <Card className="bg-yellow-950/20 border-yellow-800/30">
                  <CardContent className="pt-3">
                    <p className="text-yellow-500/90 text-xs flex items-center gap-2">
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Video converter loading... Please wait for full compatibility.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {ffmpegLoaded && (
                <Card className="bg-green-950/20 border-green-800/30">
                  <CardContent className="pt-3">
                    <p className="text-green-500/90 text-xs flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      ✓ Auto-converter ready! Videos work on all devices (Mac, Windows, mobile).
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Upload from Computer */}
              <Card className="bg-zinc-900/50">
                <CardContent className="pt-4 space-y-3">
                  <Label htmlFor="video-upload" className="text-sm text-zinc-400">
                    <FontAwesomeIcon icon={faVideo} className="mr-2" />
                    Upload Video (Any format - automatically converts for universal compatibility)
                  </Label>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={uploadingVideo}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-white file:text-zinc-900 hover:file:bg-zinc-100 file:cursor-pointer"
                  />
                  {uploadingVideo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Processing... {uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500">
                    ✅ Supports all formats: MP4, MOV, AVI, WebM, etc. - Will work on all devices!
                  </p>
                </CardContent>
              </Card>

              {/* OR Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-zinc-800"></div>
                <span className="text-xs text-zinc-500">OR</span>
                <div className="flex-1 border-t border-zinc-800"></div>
              </div>

              {/* External URL */}
              <Card className="bg-zinc-900/50">
                <CardContent className="pt-4 space-y-2">
                  <Label htmlFor="video-url" className="text-sm text-zinc-400">External Video URL</Label>
                  <Input
                    id="video-url"
                    type="text"
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm({...lessonForm, video_url: e.target.value})}
                    placeholder="https://www.youtube.com/embed/... or direct link"
                    className="text-sm"
                  />
                  <p className="text-xs text-zinc-500">
                    YouTube embed URLs or direct video links
                  </p>
                </CardContent>
              </Card>

              {/* Video Preview */}
              {lessonForm.video_url && (
                <Card className="bg-zinc-900/50">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-zinc-400">Current Video:</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLessonForm({...lessonForm, video_url: ''});
                          setPreviewVideoUrl(null);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 h-auto p-1"
                      >
                        <FontAwesomeIcon icon={faTimes} className="mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="bg-zinc-900 rounded-md overflow-hidden">
                      {previewVideoUrl ? (
                        <video 
                          controls 
                          className="w-full max-h-48"
                          playsInline
                          preload="metadata"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        >
                          <source src={previewVideoUrl} type="video/mp4" />
                          <source src={previewVideoUrl} type="video/webm" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="p-3 text-center">
                          <FontAwesomeIcon icon={faSpinner} spin className="text-zinc-500" />
                          <p className="text-xs text-zinc-500 mt-2">Loading preview...</p>
                        </div>
                      )}
                      <div className="p-3 text-xs text-zinc-400 break-all" style={{ display: 'none' }}>
                        {lessonForm.video_url}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-content">Content (HTML)</Label>
              <Textarea
                id="lesson-content"
                value={lessonForm.content_html}
                onChange={(e) => setLessonForm({...lessonForm, content_html: e.target.value})}
                rows={8}
                placeholder="<h2>Lesson content here...</h2>"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-order">Order Index</Label>
              <Input
                id="lesson-order"
                type="number"
                value={lessonForm.order_index}
                onChange={(e) => setLessonForm({...lessonForm, order_index: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLessonModal(false)}
              disabled={saving}
              className="text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={saveLesson}
              disabled={saving}
              className="text-white"
            >
              {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
        />
      )}

      {/* Mini-Lesson Modal */}
      <Dialog open={showMiniLessonModal} onOpenChange={setShowMiniLessonModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMiniLesson ? 'Edit Mini-Lesson' : 'Add Mini-Lesson'}</DialogTitle>
            <DialogDescription>
              {editingMiniLesson ? 'Update mini-lesson information' : 'Create a new mini-lesson with optional video'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mini-title-en">Title (English)</Label>
              <Input
                id="mini-title-en"
                value={miniLessonForm.title_en}
                onChange={(e) => setMiniLessonForm({...miniLessonForm, title_en: e.target.value})}
                placeholder="e.g., What are functions?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mini-title-ar">Title (Arabic)</Label>
              <Input
                id="mini-title-ar"
                value={miniLessonForm.title_ar}
                onChange={(e) => setMiniLessonForm({...miniLessonForm, title_ar: e.target.value})}
                placeholder="ما هي الدوال؟"
              />
            </div>
            
            {/* Video Upload Section */}
            <div className="space-y-3">
              <Label className="text-base">Video (Optional)</Label>
              
              <Card className="bg-zinc-900/50">
                <CardContent className="pt-4 space-y-3">
                  <Label htmlFor="mini-video-upload" className="text-sm text-zinc-400">
                    <FontAwesomeIcon icon={faVideo} className="mr-2" />
                    Upload Video (Any format - automatically converts for universal compatibility)
                  </Label>
                  <input
                    id="mini-video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={uploadingVideo}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-100 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-white file:text-zinc-900 hover:file:bg-zinc-100 file:cursor-pointer"
                  />
                  {uploadingVideo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Processing... {uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-zinc-800"></div>
                <span className="text-xs text-zinc-500">OR</span>
                <div className="flex-1 border-t border-zinc-800"></div>
              </div>

              <Card className="bg-zinc-900/50">
                <CardContent className="pt-4 space-y-2">
                  <Label htmlFor="mini-video-url" className="text-sm text-zinc-400">External Video URL</Label>
                  <Input
                    id="mini-video-url"
                    type="text"
                    value={miniLessonForm.video_url}
                    onChange={(e) => setMiniLessonForm({...miniLessonForm, video_url: e.target.value})}
                    placeholder="https://www.youtube.com/embed/..."
                    className="text-sm"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Question Builder Section */}
            <div className="space-y-3 border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t('questionBuilder')}</Label>
                {!showQuestionBuilder && (
                  <Button 
                    type="button" 
                    onClick={() => setShowQuestionBuilder(true)}
                    size="sm"
                    className="text-white"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    {t('addQuestion')}
                  </Button>
                )}
              </div>

              {showQuestionBuilder && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-text">{t('question')}</Label>
                      <Input
                        id="question-text"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder={t('enterQuestionHere')}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{t('answers')}</Label>
                        <Button 
                          type="button" 
                          onClick={addAnswer}
                          size="sm"
                          variant="outline"
                          className="text-white"
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-2" />
                          {t('addAnswer')}
                        </Button>
                      </div>

                      {questionAnswers.map((answer, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct-answer"
                            checked={answer.isCorrect}
                            onChange={() => setCorrectAnswer(index)}
                            className="w-4 h-4 cursor-pointer accent-green-500"
                          />
                          <Input
                            value={answer.text}
                            onChange={(e) => updateAnswer(index, e.target.value)}
                            placeholder={`${t('answer')} ${index + 1}`}
                            className="flex-1 text-sm"
                          />
                          {questionAnswers.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeAnswer(index)}
                              size="sm"
                              variant="destructive"
                              className="text-white"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={insertQuestion}
                        className="flex-1 text-white"
                      >
                        {t('insertQuestion')}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowQuestionBuilder(false);
                          setQuestionText('');
                          setQuestionAnswers([{ text: '', isCorrect: false }]);
                        }}
                        variant="outline"
                        className="text-white"
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mini-content">Add Content</Label>
              <Textarea
                id="mini-content"
                value={miniLessonForm.content_html}
                onChange={(e) => {
                  // Preserve spaces up to 5 consecutive spaces
                  let value = e.target.value;
                  // Replace more than 5 consecutive spaces with exactly 5 spaces
                  value = value.replace(/ {6,}/g, '     ');
                  // Replace more than 5 consecutive newlines with exactly 5 newlines
                  value = value.replace(/\n{6,}/g, '\n\n\n\n\n');
                  setMiniLessonForm({...miniLessonForm, content_html: value});
                }}
                rows={6}
                placeholder="Add your content here... (Spaces and line breaks preserved up to 5)"
                className="font-mono text-sm whitespace-pre-wrap"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mini-order">Order Index</Label>
              <Input
                id="mini-order"
                type="number"
                value={miniLessonForm.order_index}
                onChange={(e) => setMiniLessonForm({...miniLessonForm, order_index: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMiniLessonModal(false)}
              disabled={saving}
              className="text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={saveMiniLesson}
              disabled={saving}
              className="text-white"
            >
              {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;