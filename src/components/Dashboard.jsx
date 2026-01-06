import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../../node_modules/react-i18next';
import { supabase } from '../supabaseClient';
import DOMPurify from 'dompurify';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseLessons, setCourseLessons] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const generateVideoUrl = async () => {
      if (!selectedLesson?.video_url) {
        setVideoUrl(null);
        return;
      }

      // Generate signed URL for private videos
      if (selectedLesson.video_url.startsWith('lesson-videos/')) {
        try {
          const filePath = selectedLesson.video_url.replace('lesson-videos/', '');
          
          const { data, error } = await supabase.storage
            .from('lesson-videos')
            .createSignedUrl(filePath, 3600);

          if (error) throw error;
          setVideoUrl(data.signedUrl);
        } catch (error) {
          console.error('Error generating signed URL:', error);
          setVideoUrl(null);
        }
      } else {
        setVideoUrl(selectedLesson.video_url);
      }
    };

    generateVideoUrl();
  }, [selectedLesson]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) {
      setCourses(data);
      // Auto-expand first open course
      const firstOpenCourse = data.find(c => c.is_open);
      if (firstOpenCourse) {
        setExpandedCourse(firstOpenCourse.id);
        fetchLessons(firstOpenCourse.id);
      }
    }
    setLoading(false);
  };

  const fetchLessons = async (courseId) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (data) {
      setCourseLessons(prev => ({ ...prev, [courseId]: data }));
    }
  };

  const toggleCourse = async (course) => {
    if (!course.is_open) return;
    
    if (expandedCourse === course.id) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(course.id);
      if (!courseLessons[course.id]) {
        await fetchLessons(course.id);
      }
    }
  };

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.log('an error occured');
    }
  };

  const getCourseTitle = (course) => {
    return i18n.language === 'ar' ? course.title_ar : course.title_en;
  };

  const getLessonTitle = (lesson) => {
    return i18n.language === 'ar' ? lesson.title_ar : lesson.title_en;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white text-xl">{t('loading') || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex">
      {/* Language Switcher - Top Right */}
      <div className="fixed top-6 ltr:right-6 rtl:left-6 z-50">
        <LanguageSwitcher />
      </div>
      
      {/* Sidebar - 20% */}
      <div className="w-[20%] bg-zinc-800 border-r border-zinc-700 p-4">
        <div className="mb-8">
          <h2 className="text-white text-xl font-bold mb-1">eyycourses</h2>
          <p className="text-zinc-400 text-sm">{session?.user?.email}</p>
        </div>

        {/* Course Navigation */}
        <nav className="space-y-2">
          {courses.map(course => (
            <div key={course.id} className="bg-zinc-900/50 rounded-lg border border-zinc-700">
              <button
                onClick={() => toggleCourse(course)}
                className={`w-full p-4 flex items-center justify-between transition-colors rounded-lg ${
                  course.is_open ? 'hover:bg-zinc-800/50 cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className="text-white font-medium">{getCourseTitle(course)}</span>
                <div className="flex items-center gap-2">
                  {!course.is_open && (
                    <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">
                      {t('comingSoon')}
                    </span>
                  )}
                  {course.is_open && (
                    <FontAwesomeIcon 
                      icon={expandedCourse === course.id ? faChevronDown : faChevronRight} 
                      className="text-zinc-400 text-sm"
                    />
                  )}
                </div>
              </button>

              {/* Lessons List */}
              {expandedCourse === course.id && courseLessons[course.id] && (
                <div className="px-2 pb-2 space-y-1">
                  {courseLessons[course.id].map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => selectLesson(lesson)}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${
                        selectedLesson?.id === lesson.id
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {getLessonTitle(lesson)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          {t('signout')}
        </button>
      </div>

      {/* Main Content - 80% */}
      <div className="w-[80%] p-8">
        <div className="max-w-4xl mx-auto">
          {selectedLesson ? (
            <div>
              <h1 className="text-4xl font-bold text-white mb-6">
                {getLessonTitle(selectedLesson)}
              </h1>
              
              {/* Video Player */}
              {videoUrl && (
                <div className="mb-6 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                  {/* Check if it's a YouTube embed or direct video file */}
                  {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('embed') ? (
                    // YouTube or embed URL - use iframe
                    <div className="relative" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={videoUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    // Direct video file - use HTML5 video player with signed URL
                    <video
                      src={videoUrl}
                      controls
                      controlsList="nodownload"
                      className="w-full"
                      style={{ maxHeight: '500px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}

              {/* Lesson Content */}
              {selectedLesson.content_html && (
                <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                  <div 
                    className="text-zinc-300 text-lg prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(selectedLesson.content_html, {
                        ADD_TAGS: ['iframe'],
                        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
                      })
                    }}
                  />
                </div>
              )}

              {/* Default message if no content */}
              {!selectedLesson.video_url && !selectedLesson.content_html && (
                <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                  <p className="text-zinc-400 text-center">
                    {t('noContentYet') || 'Content coming soon...'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-white mb-4">{t('welcome')}</h1>
              <p className="text-zinc-400 text-lg">
                {t('selectLesson')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
