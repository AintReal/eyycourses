import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faUsers, faKey, faCheckCircle, faTimesCircle, faBook, faPlus, faEdit, faTrash, faVideo, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [accessCodes, setAccessCodes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const navigate = useNavigate();

  // Form states
  const [courseForm, setCourseForm] = useState({
    title_en: '',
    title_ar: '',
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

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);

  useEffect(() => {
    checkAdminAuth();
  }, [navigate]);

  // Generate signed URL for video preview
  useEffect(() => {
    const generatePreviewUrl = async () => {
      if (!lessonForm.video_url) {
        setPreviewVideoUrl(null);
        return;
      }

      // Check if it's a storage path
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
        // External URL - use as is
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
    
    // Fetch users
    const { data: usersData } = await supabase.auth.admin.listUsers();
    if (usersData) setUsers(usersData.users);

    // Fetch access codes
    const { data: codesData } = await supabase
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (codesData) setAccessCodes(codesData);

    // Fetch courses
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

  const toggleCourseStatus = async (course) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_open: !course.is_open })
      .eq('id', course.id);
    if (!error) fetchData();
  };

  const openCourseModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm(course);
    } else {
      setEditingCourse(null);
      setCourseForm({ title_en: '', title_ar: '', is_open: false, order_index: courses.length });
    }
    setShowCourseModal(true);
  };

  const saveCourse = async () => {
    // Validate form
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

  // Upload video to Supabase Storage
  const uploadVideoToStorage = async (file) => {
    try {
      setUploadingVideo(true);
      setUploadProgress(0);

      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload MP4, WebM, MOV, or AVI files.');
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 500MB.');
      }

      // Generate unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `lessons/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Store the file path (not public URL) for private bucket
      // We'll generate signed URLs when needed
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

  // Handle video file selection
  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedVideoFile(file);
    
    try {
      const videoUrl = await uploadVideoToStorage(file);
      setLessonForm({ ...lessonForm, video_url: videoUrl });
      setToast({ message: 'Video uploaded successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Upload failed: ' + error.message, type: 'error' });
      setSelectedVideoFile(null);
    }
  };

  const saveLesson = async () => {
    // Validate form
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
          // Get the lesson to check if it has an uploaded video
          const lesson = lessons.find(l => l.id === id);
          
          // Delete the lesson from database
          const { error } = await supabase.from('lessons').delete().eq('id', id);
          if (error) throw error;

          // If the lesson had a video from our storage, delete it
          if (lesson?.video_url && lesson.video_url.startsWith('lesson-videos/')) {
            try {
              // Extract file path (it's already in format: lesson-videos/lessons/filename.ext)
              const filePath = lesson.video_url.replace('lesson-videos/', '');
              await supabase.storage
                .from('lesson-videos')
                .remove([filePath]);
            } catch (storageError) {
              console.error('Error deleting video from storage:', storageError);
              // Don't throw - lesson is already deleted from DB
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
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'courses' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faBook} />
              Courses ({courses.length})
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
                          {course.is_open ? 'Open' : 'قريباً'}
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
            <h2 className="text-xl font-semibold mb-4">Registered Users</h2>
            <div className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
              <table className="w-full">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Code Validated</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-zinc-700">
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.user_metadata?.name || '-'}</td>
                      <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {user.user_metadata?.code_validated ? (
                          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                        ) : (
                          <FontAwesomeIcon icon={faTimesCircle} className="text-red-500" />
                        )}
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
                  {accessCodes.map((code) => (
                    <tr key={code.id} className="border-t border-zinc-700">
                      <td className="px-4 py-3 font-mono">{code.code}</td>
                      <td className="px-4 py-3">
                        {code.is_used ? (
                          <span className="bg-zinc-700 text-gray-300 px-2 py-1 rounded text-xs">Used</span>
                        ) : (
                          <span className="bg-zinc-700 text-white px-2 py-1 rounded text-xs">Available</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{code.used_by || '-'}</td>
                      <td className="px-4 py-3">{new Date(code.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="space-y-4">
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
                <label className="text-sm">Course is Open (not قريباً)</label>
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                
                {/* Upload from Computer */}
                <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
                  <label className="block text-sm text-zinc-400 mb-2">
                    <FontAwesomeIcon icon={faVideo} className="mr-2" />
                    Upload from Computer
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    onChange={handleVideoFileChange}
                    disabled={uploadingVideo}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  />
                  {uploadingVideo && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm text-blue-400">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Uploading... {uploadProgress}%</span>
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
                    Supported: MP4, WebM, MOV, AVI (Max 500MB)
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
                          src={previewVideoUrl} 
                          controls 
                          className="w-full max-h-48"
                          onError={(e) => {
                            // If video fails to load, show path instead
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
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
    </div>
  );
};

export default AdminDashboard;
