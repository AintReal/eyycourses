import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../../node_modules/react-i18next';
import { supabase } from '../supabaseClient';
import DOMPurify from 'dompurify';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseLessons, setCourseLessons] = useState({});
  const [lessonMiniLessons, setLessonMiniLessons] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedMiniLesson, setSelectedMiniLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkBanStatus();
    fetchCourses();
  }, []);

  const checkBanStatus = async () => {
    if (session?.user?.id) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', session.user.id)
        .single();
      
      if (userData?.is_banned) {
        await signOut();
        navigate('/signin', { 
          state: { 
            error: 'You have been banned from this platform. Please contact support.' 
          } 
        });
      }
    }
  };

  useEffect(() => {
    const generateVideoUrl = async () => {
      const currentContent = selectedMiniLesson || selectedLesson;
      
      if (!currentContent?.video_url) {
        setVideoUrl(null);
        return;
      }

      // Generate signed URL for private videos
      if (currentContent.video_url.startsWith('lesson-videos/')) {
        try {
          const filePath = currentContent.video_url.replace('lesson-videos/', '');
          
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
        setVideoUrl(currentContent.video_url);
      }
    };

    generateVideoUrl();
  }, [selectedLesson, selectedMiniLesson]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    
    // Fetch sections
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (sectionsData) {
      setSections(sectionsData);
    }
    
    // Fetch courses
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
        await fetchLessons(firstOpenCourse.id);
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

  const fetchMiniLessons = async (lessonId) => {
    const { data, error } = await supabase
      .from('mini_lessons')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true });
    
    if (data) {
      setLessonMiniLessons(prev => ({ ...prev, [lessonId]: data }));
    }
    return data || [];
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

  const toggleLesson = async (lesson) => {
    if (expandedLesson === lesson.id) {
      setExpandedLesson(null);
    } else {
      setExpandedLesson(lesson.id);
      if (!lessonMiniLessons[lesson.id]) {
        const miniLessons = await fetchMiniLessons(lesson.id);
        
        // If no mini-lessons, select the lesson itself
        if (!miniLessons || miniLessons.length === 0) {
          selectLesson(lesson);
        }
      }
    }
  };

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setSelectedMiniLesson(null);
  };

  const selectMiniLesson = (miniLesson) => {
    setSelectedMiniLesson(miniLesson);
    setSelectedLesson(null);
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
      {/* Hamburger Button - Only on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 ltr:left-4 rtl:right-4 z-50 bg-zinc-800 text-white p-3 rounded-lg border border-zinc-700"
      >
        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
      </button>

      {/* Language Switcher - Top Right */}
      <div className="fixed top-4 ltr:right-4 rtl:left-4 z-50">
        <LanguageSwitcher />
      </div>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - Always visible on desktop (md+), sliding on mobile */}
      <div className={`
        w-70 md:w-[20%]
        bg-zinc-800 border-r border-zinc-700 p-4
        fixed md:relative
        h-screen md:h-auto
        overflow-y-auto
        top-0 bottom-0
        z-40
        transition-transform duration-300 md:transition-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-8">
          <h2 className="text-white text-xl font-bold mb-1">eyycourses</h2>
          <p className="text-zinc-400 text-sm">{session?.user?.email}</p>
        </div>

        {/* Course Navigation */}
        <nav className="space-y-4 mb-4">
          {/* Render sections with courses */}
          {sections.map(section => {
            const sectionCourses = courses.filter(c => c.section_id === section.id);
            if (sectionCourses.length === 0) return null;
            
            return (
              <div key={section.id} className="space-y-2">
                {/* Section Header - Gray Text */}
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                  {i18n.language === 'ar' ? section.title_ar : section.title_en}
                </div>
                
                {/* Courses in this section */}
                {sectionCourses.map(course => (
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
                        {courseLessons[course.id].map(lesson => {
                          const miniLessons = lessonMiniLessons[lesson.id] || [];
                          const hasMiniLessons = miniLessons.length > 0;
                          
                          return (
                            <div key={lesson.id}>
                              {/* Lesson Button */}
                              <button
                                onClick={() => {
                                  toggleLesson(lesson);
                                  if (!hasMiniLessons && !lessonMiniLessons[lesson.id]) {
                                    setIsMobileMenuOpen(false);
                                  }
                                }}
                                className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center justify-between ${
                                  selectedLesson?.id === lesson.id && !selectedMiniLesson
                                    ? 'bg-blue-600 text-white'
                                    : 'text-zinc-300 hover:bg-zinc-800'
                                }`}
                              >
                                <span>{getLessonTitle(lesson)}</span>
                                {hasMiniLessons && (
                                  <FontAwesomeIcon 
                                    icon={expandedLesson === lesson.id ? faChevronDown : faChevronRight} 
                                    className="text-xs"
                                  />
                                )}
                              </button>
                              
                              {/* Mini-Lessons Dropdown */}
                              {expandedLesson === lesson.id && hasMiniLessons && (
                                <div className="ml-4 mt-1 space-y-1">
                                  {miniLessons.map(miniLesson => (
                                    <button
                                      key={miniLesson.id}
                                      onClick={() => {
                                        selectMiniLesson(miniLesson);
                                        setIsMobileMenuOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-2 rounded transition-colors text-sm ${
                                        selectedMiniLesson?.id === miniLesson.id
                                          ? 'bg-blue-600 text-white'
                                          : 'text-zinc-400 hover:bg-zinc-800'
                                      }`}
                                    >
                                      {i18n.language === 'ar' ? miniLesson.title_ar : miniLesson.title_en}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
          
          {/* Uncategorized Courses */}
          {courses.filter(c => !c.section_id).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                {t('uncategorized') || 'Uncategorized'}
              </div>
              
              {courses.filter(c => !c.section_id).map(course => (
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
                      {courseLessons[course.id].map(lesson => {
                        const miniLessons = lessonMiniLessons[lesson.id] || [];
                        const hasMiniLessons = miniLessons.length > 0;
                        
                        return (
                          <div key={lesson.id}>
                            <button
                              onClick={() => {
                                toggleLesson(lesson);
                                if (!hasMiniLessons && !lessonMiniLessons[lesson.id]) {
                                  setIsMobileMenuOpen(false);
                                }
                              }}
                              className={`w-full text-left px-4 py-2 rounded transition-colors flex items-center justify-between ${
                                selectedLesson?.id === lesson.id && !selectedMiniLesson
                                  ? 'bg-blue-600 text-white'
                                  : 'text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <span>{getLessonTitle(lesson)}</span>
                              {hasMiniLessons && (
                                <FontAwesomeIcon 
                                  icon={expandedLesson === lesson.id ? faChevronDown : faChevronRight} 
                                  className="text-xs"
                                />
                              )}
                            </button>
                            
                            {expandedLesson === lesson.id && hasMiniLessons && (
                              <div className="ml-4 mt-1 space-y-1">
                                {miniLessons.map(miniLesson => (
                                  <button
                                    key={miniLesson.id}
                                    onClick={() => {
                                      selectMiniLesson(miniLesson);
                                      setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 rounded transition-colors text-sm ${
                                      selectedMiniLesson?.id === miniLesson.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-zinc-400 hover:bg-zinc-800'
                                    }`}
                                  >
                                    {i18n.language === 'ar' ? miniLesson.title_ar : miniLesson.title_en}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Sign Out Button - Sticky at bottom on mobile */}
        <div className="sticky bottom-0 bg-zinc-800 pt-4 pb-2 -mx-4 px-4">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {t('signout')}
          </button>
        </div>
      </div>


      <div className="flex-1 md:w-[80%] p-4 md:p-8 pt-16 md:pt-8">
        <div className="max-w-4xl mx-auto">
          {(selectedLesson || selectedMiniLesson) ? (
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
                {selectedMiniLesson 
                  ? (i18n.language === 'ar' ? selectedMiniLesson.title_ar : selectedMiniLesson.title_en)
                  : getLessonTitle(selectedLesson)
                }
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
                    // Direct video file
                    <video
                      controls
                      controlsList="nodownload"
                      className="w-full"
                      style={{ maxHeight: '500px' }}
                      playsInline
                      preload="metadata"
                    >
                      <source src={videoUrl} type="video/mp4" />
                      <source src={videoUrl} type="video/webm" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}

              {/* Lesson/Mini-Lesson Content */}
              {(selectedMiniLesson?.content_html || selectedLesson?.content_html) && (
                <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                  <div 
                    className="text-zinc-300 text-lg prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(
                        selectedMiniLesson?.content_html || selectedLesson.content_html, 
                        {
                          ADD_TAGS: ['iframe'],
                          ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
                        }
                      )
                    }}
                  />
                </div>
              )}

              {/* Default message if no content */}
              {!videoUrl && !(selectedMiniLesson?.content_html || selectedLesson?.content_html) && (
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