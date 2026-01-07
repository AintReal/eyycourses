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

const AdminDashboard = () => {
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
  const navigate = useNavigate();
  
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

      // Convert to compatible format if needed
      let uploadFile = file;
      const isMP4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
      
      if (!isMP4 && ffmpegLoaded) {
        setToast({ message: 'Converting video to universal MP4 format... This may take a few minutes.', type: 'info' });
        try {
          uploadFile = await convertVideoToMP4(file);
          setToast({ message: 'Video converted successfully! Uploading...', type: 'success' });
        } catch (conversionError) {
          console.warn('Conversion failed, uploading original:', conversionError);
          setToast({ message: 'Note: Uploading original format. May not work on all devices.', type: 'warning' });
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="bg-zinc-800/50 backdrop-blur border-b border-zinc-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl transition border border-zinc-600"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-zinc-800/30 border-b border-zinc-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'analytics' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faChartBar} />
              Analytics
            </button>
            <button
              onClick={() => {
                setActiveTab('sections');
                setSelectedSection(null);
                setSelectedCourse(null);
                setSelectedLesson(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'sections' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faBook} />
              Sections ({sections.length})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'courses' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faBook} />
              All Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'users' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} />
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('codes')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'codes' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faKey} />
              Access Codes ({accessCodes.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Analytics />
        )}

        {/* Sections Tab - Main View */}
        {activeTab === 'sections' && !selectedSection && !selectedCourse && !selectedLesson && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Sections & Courses</h2>
              <button
                onClick={() => openSectionModal()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Section
              </button>
            </div>

            {sections.map((section) => (
              <div key={section.id} className="mb-8">
                {/* Section Header */}
                <div className="bg-zinc-800/50 rounded-t-lg p-4 border border-zinc-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      {section.title_en} / {section.title_ar}
                    </h3>
                    {section.description_en && (
                      <p className="text-xs text-gray-500 mt-1">{section.description_en}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCourseModal(null, section.id)}
                      className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition text-sm"
                      title="Add course to this section"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-1" />
                      Course
                    </button>
                    <button
                      onClick={() => openSectionModal(section)}
                      className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                {/* Courses under this section */}
                <div className="bg-zinc-800/30 rounded-b-lg border-l border-r border-b border-zinc-700 p-4">
                  {courses.filter(c => c.section_id === section.id).length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No courses in this section yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {courses.filter(c => c.section_id === section.id).map((course) => (
                        <div key={course.id} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">
                                {course.title_en} / {course.title_ar}
                              </h4>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => toggleCourseStatus(course)}
                                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    course.is_open
                                      ? 'bg-green-600/20 text-green-400'
                                      : 'bg-gray-600/20 text-gray-400'
                                  }`}
                                >
                                  {course.is_open ? 'Open' : 'Soon'}
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedCourse(course.id);
                                  fetchLessons(course.id);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                              >
                                View Lessons →
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openCourseModal(course)}
                                className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => deleteCourse(course.id)}
                                className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Courses without sections */}
            {courses.filter(c => !c.section_id).length > 0 && (
              <div className="mb-8">
                <div className="bg-zinc-800/50 rounded-t-lg p-4 border border-zinc-700">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Uncategorized Courses
                  </h3>
                </div>
                <div className="bg-zinc-800/30 rounded-b-lg border-l border-r border-b border-zinc-700 p-4">
                  <div className="grid gap-3">
                    {courses.filter(c => !c.section_id).map((course) => (
                      <div key={course.id} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {course.title_en} / {course.title_ar}
                            </h4>
                            <button
                              onClick={() => {
                                setSelectedCourse(course.id);
                                fetchLessons(course.id);
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                            >
                              View Lessons →
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openCourseModal(course)}
                              className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => deleteCourse(course.id)}
                              className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Courses</h2>
              <button
                onClick={() => openCourseModal()}
                className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl transition font-medium border border-zinc-600"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Course
              </button>
            </div>

            <div className="grid gap-4">
              {courses.map((course) => (
                <div key={course.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{course.title_en} / {course.title_ar}</h3>
                        <button
                          onClick={() => toggleCourseStatus(course)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            course.is_open
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-gray-600/20 text-gray-400'
                          }`}
                        >
                          {course.is_open ? 'Open' : 'Soon'}
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCourse(course.id);
                          fetchLessons(course.id);
                        }}
                        className="text-gray-300 hover:text-white text-sm"
                      >
                        View Lessons →
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCourseModal(course)}
                        className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition border border-zinc-600"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => deleteCourse(course.id)}
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Registered Users</h2>
              <input
                type="text"
                placeholder="Search by #, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-600 w-80"
              />
            </div>
            <div className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
              <table className="w-full">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Code Validated</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((user) => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        user.userNumber.toString().includes(query) ||
                        user.email.toLowerCase().includes(query) ||
                        (user.full_name && user.full_name.toLowerCase().includes(query))
                      );
                    })
                    .map((user) => (
                    <tr key={user.id} className={`border-t border-zinc-700 ${user.is_banned ? 'bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 font-mono">#{user.userNumber}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.full_name || '-'}</td>
                      <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {user.code_validated ? (
                          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                        ) : (
                          <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_banned ? (
                          <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800">Banned</span>
                        ) : (
                          <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs border border-green-800">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => banUser(user.id, user.email, user.is_banned)}
                            className={`${user.is_banned ? 'text-green-500 hover:text-green-400' : 'text-zinc-400 hover:text-zinc-300'} transition`}
                            title={user.is_banned ? 'Unban user' : 'Ban user'}
                          >
                            <FontAwesomeIcon icon={faBan} />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.email)}
                            className="text-zinc-400 hover:text-zinc-300 transition"
                            title="Delete user"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Access Codes Tab */}
        {activeTab === 'codes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Access Codes</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => generateNewCodes(10)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl transition font-medium border border-zinc-600"
                >
                  Generate 10 Codes
                </button>
                <button
                  onClick={() => generateNewCodes(50)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-xl transition font-medium border border-zinc-600"
                >
                  Generate 50 Codes
                </button>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700">
              <table className="w-full">
                <thead className="bg-zinc-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Code</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Used By</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {accessCodes.map((code) => {
                    const usedByUser = users.find(u => u.id === code.used_by);
                    return (
                      <tr key={code.id} className="border-t border-zinc-700">
                        <td className="px-4 py-3 font-mono">{code.code}</td>
                        <td className="px-4 py-3">
                          {code.used ? (
                            <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800">Used</span>
                          ) : (
                            <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs border border-green-800">Available</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {usedByUser ? (
                            <span className="text-blue-400">User #{usedByUser.userNumber}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{new Date(code.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingSection ? 'Edit Section' : 'Add Section'}</h3>
              <button onClick={() => setShowSectionModal(false)} className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Title (English)</label>
                <input
                  type="text"
                  value={sectionForm.title_en}
                  onChange={(e) => setSectionForm({...sectionForm, title_en: e.target.value})}
                  placeholder="e.g., Programming Courses"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Title (Arabic)</label>
                <input
                  type="text"
                  value={sectionForm.title_ar}
                  onChange={(e) => setSectionForm({...sectionForm, title_ar: e.target.value})}
                  placeholder="دورات البرمجة"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description (English)</label>
                <input
                  type="text"
                  value={sectionForm.description_en}
                  onChange={(e) => setSectionForm({...sectionForm, description_en: e.target.value})}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description (Arabic)</label>
                <input
                  type="text"
                  value={sectionForm.description_ar}
                  onChange={(e) => setSectionForm({...sectionForm, description_ar: e.target.value})}
                  placeholder="وصف اختياري"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Order Index</label>
                <input
                  type="number"
                  value={sectionForm.order_index}
                  onChange={(e) => setSectionForm({...sectionForm, order_index: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveSection}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowSectionModal(false)}
                  disabled={saving}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Section</label>
                <select
                  value={courseForm.section_id || ''}
                  onChange={(e) => setCourseForm({...courseForm, section_id: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                >
                  <option value="">No Section (Uncategorized)</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.title_en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Title (English)</label>
                <input
                  type="text"
                  value={courseForm.title_en}
                  onChange={(e) => setCourseForm({...courseForm, title_en: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Title (Arabic)</label>
                <input
                  type="text"
                  value={courseForm.title_ar}
                  onChange={(e) => setCourseForm({...courseForm, title_ar: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Order Index</label>
                <input
                  type="number"
                  value={courseForm.order_index}
                  onChange={(e) => setCourseForm({...courseForm, order_index: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={courseForm.is_open}
                  onChange={(e) => setCourseForm({...courseForm, is_open: e.target.checked})}
                  className="w-4 h-4"
                />
                <label className="text-sm">Course is Open (not Soon)</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveCourse}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowCourseModal(false)}
                  disabled={saving}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h3>
              <button onClick={() => setShowLessonModal(false)} className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Title (English)</label>
                <input
                  type="text"
                  value={lessonForm.title_en}
                  onChange={(e) => setLessonForm({...lessonForm, title_en: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Title (Arabic)</label>
                <input
                  type="text"
                  value={lessonForm.title_ar}
                  onChange={(e) => setLessonForm({...lessonForm, title_ar: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              
              {/* Video Upload Section */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold mb-2">Video</label>
                
                {!ffmpegLoaded && (
                  <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-2">
                    <p className="text-yellow-400 text-xs">
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Video converter loading... Non-MP4 videos will be uploaded as-is.
                    </p>
                  </div>
                )}
                
                {/* Upload from Computer */}
                <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
                  <label className="block text-sm text-zinc-400 mb-2">
                    <FontAwesomeIcon icon={faVideo} className="mr-2" />
                    Upload from Computer (Any format - auto-converts to MP4)
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={uploadingVideo}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  />
                  {uploadingVideo && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Processing... {uploadProgress}%</span>
                      </div>
                      <div className="mt-1 w-full bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500 mt-2">
                    ✅ Supports all formats: MP4, MOV, AVI, WebM, etc. - Will work on all devices!
                  </p>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-zinc-700"></div>
                  <span className="text-xs text-zinc-500">OR</span>
                  <div className="flex-1 border-t border-zinc-700"></div>
                </div>

                {/* External URL */}
                <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
                  <label className="block text-sm text-zinc-400 mb-2">External Video URL</label>
                  <input
                    type="text"
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm({...lessonForm, video_url: e.target.value})}
                    placeholder="https://www.youtube.com/embed/... or direct link"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    YouTube embed URLs or direct video links
                  </p>
                </div>

                {/* Video Preview */}
                {lessonForm.video_url && (
                  <div className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">Current Video:</span>
                      <button
                        onClick={() => {
                          setLessonForm({...lessonForm, video_url: ''});
                          setPreviewVideoUrl(null);
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        <FontAwesomeIcon icon={faTimes} className="mr-1" />
                        Remove
                      </button>
                    </div>
                    <div className="bg-zinc-800 rounded overflow-hidden">
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
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Content (HTML)</label>
                <textarea
                  value={lessonForm.content_html}
                  onChange={(e) => setLessonForm({...lessonForm, content_html: e.target.value})}
                  rows="8"
                  placeholder="<h2>Lesson content here...</h2>"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Order Index</label>
                <input
                  type="number"
                  value={lessonForm.order_index}
                  onChange={(e) => setLessonForm({...lessonForm, order_index: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveLesson}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowLessonModal(false)}
                  disabled={saving}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
      {showMiniLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-4xl animate-slideUp my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingMiniLesson ? 'Edit Mini-Lesson' : 'Add Mini-Lesson'}</h3>
              <button onClick={() => setShowMiniLessonModal(false)} className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Title (English)</label>
                <input
                  type="text"
                  value={miniLessonForm.title_en}
                  onChange={(e) => setMiniLessonForm({...miniLessonForm, title_en: e.target.value})}
                  placeholder="e.g., What are functions?"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Title (Arabic)</label>
                <input
                  type="text"
                  value={miniLessonForm.title_ar}
                  onChange={(e) => setMiniLessonForm({...miniLessonForm, title_ar: e.target.value})}
                  placeholder="ما هي الدوال؟"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              
              {/* Video Upload Section (same as lesson modal) */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold mb-2">Video (Optional)</label>
                
                <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
                  <label className="block text-sm text-zinc-400 mb-2">
                    <FontAwesomeIcon icon={faVideo} className="mr-2" />
                    Upload from Computer (Auto-converts to MP4)
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={uploadingVideo}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  />
                  {uploadingVideo && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Processing... {uploadProgress}%</span>
                      </div>
                      <div className="mt-1 w-full bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-zinc-700"></div>
                  <span className="text-xs text-zinc-500">OR</span>
                  <div className="flex-1 border-t border-zinc-700"></div>
                </div>

                <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
                  <label className="block text-sm text-zinc-400 mb-2">External Video URL</label>
                  <input
                    type="text"
                    value={miniLessonForm.video_url}
                    onChange={(e) => setMiniLessonForm({...miniLessonForm, video_url: e.target.value})}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Content (HTML)</label>
                <textarea
                  value={miniLessonForm.content_html}
                  onChange={(e) => setMiniLessonForm({...miniLessonForm, content_html: e.target.value})}
                  rows="6"
                  placeholder="<p>Enter HTML content here...</p>"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Order Index</label>
                <input
                  type="number"
                  value={miniLessonForm.order_index}
                  onChange={(e) => setMiniLessonForm({...miniLessonForm, order_index: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={saveMiniLesson}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowMiniLessonModal(false)}
                  disabled={saving}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
  );
};

export default AdminDashboard;