import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faBars, faTimes, faPlay, faLock, faSignOutAlt, faCog, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import LanguageSwitcher from './LanguageSwitcher';
import LoadingLogo from './LoadingLogo';
import ProfileModal from './ProfileModal';
import ComponentErrorBoundary from './ComponentErrorBoundary';
import { useTranslation } from '../../node_modules/react-i18next';
import { supabase } from '../supabaseClient';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trackLessonView, markLessonComplete } from '../utils/progressTracking';

const parseContent = (contentHtml) => {
  if (!contentHtml) return { content: '', questions: [] };
  
  const questionRegex = /\[QUESTION\](.*?)\[\/QUESTION\]/gs;
  const matches = [];
  let match;
  
  while ((match = questionRegex.exec(contentHtml)) !== null) {
    try {
      const questionData = JSON.parse(match[1]);
      matches.push({
        fullMatch: match[0],
        data: questionData,
        index: match.index
      });
    } catch (e) {
    }
  }
  
  let cleanContent = contentHtml;
  matches.forEach(m => {
    cleanContent = cleanContent.replace(m.fullMatch, '');
  });
  
  return {
    content: cleanContent,
    questions: matches.map(m => m.data)
  };
};

// Question Display Component
const QuestionDisplay = ({ questions, t }) => {
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [validation, setValidation] = useState({});
  
  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: answerIndex
    });
  };
  
  const handleSubmitAnswers = () => {
    const newValidation = {};
    questions.forEach((question, qIndex) => {
      const userAnswerIndex = userAnswers[qIndex];
      if (userAnswerIndex !== undefined) {
        const isCorrect = question.answers[userAnswerIndex]?.isCorrect;
        newValidation[qIndex] = isCorrect;
      }
    });
    setValidation(newValidation);
    setSubmitted(true);
  };
  
  const handleResubmit = () => {
    setSubmitted(false);
    setValidation({});
  };
  
  if (!questions || questions.length === 0) return null;
  
  return (
    <Card className="bg-zinc-950 border-zinc-800 mt-6">
      <CardHeader>
        <CardTitle className="text-zinc-100">{t('quizQuestions')}</CardTitle>
        <CardDescription className="text-zinc-400">
          {t('selectAnswersAndSubmit')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, qIndex) => (
          <div key={qIndex} className="space-y-3 pb-6 border-b border-zinc-800 last:border-b-0 last:pb-0">
            <h4 className="text-zinc-100 font-medium">
              {qIndex + 1}. {question.question}
            </h4>
            <div className="space-y-2">
              {question.answers.map((answer, aIndex) => {
                const isSelected = userAnswers[qIndex] === aIndex;
                const isSubmitted = submitted;
                const isCorrectAnswer = answer.isCorrect;
                const showValidation = isSubmitted && isSelected;
                
                let borderClass = 'border-zinc-800';
                if (showValidation) {
                  borderClass = validation[qIndex] 
                    ? 'border-green-500 border-2' 
                    : 'border-red-500 border-2';
                }
                
                return (
                  <label
                    key={aIndex}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${borderClass} bg-zinc-900/30 cursor-pointer hover:bg-zinc-900/50 transition-colors`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      checked={isSelected}
                      onChange={() => handleAnswerSelect(qIndex, aIndex)}
                      disabled={submitted}
                      className="w-4 h-4 cursor-pointer accent-[#c96f49]"
                    />
                    <span className="text-zinc-300 flex-1">{answer.text}</span>
                    {showValidation && (
                      <Badge variant={validation[qIndex] ? 'default' : 'destructive'}>
                        {validation[qIndex] ? `✓ ${t('correct')}` : `✗ ${t('wrong')}`}
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="flex gap-3 pt-4">
          {!submitted ? (
            <Button 
              onClick={handleSubmitAnswers}
              disabled={Object.keys(userAnswers).length !== questions.length}
              className="flex-1 text-white"
            >
              {t('submitAllAnswers')}
            </Button>
          ) : (
            <Button 
              onClick={handleResubmit}
              variant="outline"
              className="flex-1 text-white"
            >
              {t('resubmitAnswers')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


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
      
      setVideoUrl(null);
      
      if (!currentContent?.video_url) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      if (currentContent.video_url.startsWith('lesson-videos/')) {
        try {
          const originalPath = currentContent.video_url.replace('lesson-videos/', '');
          const originalName = originalPath.split('/').pop();

          const convertedPath = originalName ? `converted/${originalName}` : null;

          if (convertedPath) {
            const convertedRes = await supabase.storage
              .from('lesson-videos')
              .createSignedUrl(convertedPath, 3600);

            if (!convertedRes.error && convertedRes.data?.signedUrl) {
              setVideoUrl(convertedRes.data.signedUrl);
              return;
            }
          }

          const { data, error } = await supabase.storage
            .from('lesson-videos')
            .createSignedUrl(originalPath, 3600);

          if (error) throw error;
          setVideoUrl(data.signedUrl);
        } catch (error) {
          setVideoUrl(null);
        }
      } else {
        setVideoUrl(currentContent.video_url);
      }
    };

    generateVideoUrl();
    
    return () => {
      setVideoUrl(null);
    };
  }, [selectedLesson, selectedMiniLesson]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (sectionsData) {
      setSections(sectionsData);
    }
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) {
      setCourses(data);
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
      
      for (const lesson of data) {
        await fetchMiniLessons(lesson.id);
      }
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
      setExpandedLesson(null);
    } else {
      setExpandedCourse(course.id);
      if (!courseLessons[course.id]) {
        await fetchLessons(course.id);
      }
    }
  };

  const toggleLesson = async (lesson) => {
    const miniLessons = lessonMiniLessons[lesson.id] || [];
    
    if (miniLessons.length === 0) {
      selectLesson(lesson);
      setIsMobileMenuOpen(false);
      return;
    }
    
    if (expandedLesson === lesson.id) {
      setExpandedLesson(null);
    } else {
      setExpandedLesson(lesson.id);
    }
  };

  const selectLesson = async (lesson) => {
    setSelectedLesson(lesson);
    setSelectedMiniLesson(null);
    
    if (session?.user && lesson.course_id) {
      await trackLessonView(session.user.id, lesson.course_id, lesson.id, null);
    }
  };

  const selectMiniLesson = async (miniLesson) => {
    setSelectedMiniLesson(miniLesson);
    setSelectedLesson(null);
    
    if (session?.user && selectedLesson) {
      await trackLessonView(session.user.id, selectedLesson.course_id, miniLesson.lesson_id, miniLesson.id);
    }
  };

  const handleVideoPlay = async () => {
    if (!session?.user) return;
    
    if (selectedMiniLesson) {
      const parentLesson = Object.values(courseLessons)
        .flat()
        .find(l => l.id === selectedMiniLesson.lesson_id);
      
      if (parentLesson) {
        await trackLessonView(
          session.user.id, 
          parentLesson.course_id, 
          selectedMiniLesson.lesson_id, 
          selectedMiniLesson.id
        );
      }
    } else if (selectedLesson) {
      await trackLessonView(
        session.user.id, 
        selectedLesson.course_id, 
        selectedLesson.id, 
        null
      );
    }
  };

  const handleVideoTimeUpdate = async (e) => {
    if (!session?.user) return;
    
    const video = e.target;
    const percentWatched = (video.currentTime / video.duration) * 100;
    
    if (percentWatched >= 80) {
      if (selectedMiniLesson) {
        const parentLesson = Object.values(courseLessons)
          .flat()
          .find(l => l.id === selectedMiniLesson.lesson_id);
        
        if (parentLesson) {
          await markLessonComplete(
            session.user.id, 
            parentLesson.course_id, 
            selectedMiniLesson.lesson_id, 
            selectedMiniLesson.id
          );
        }
      } else if (selectedLesson) {
        await markLessonComplete(
          session.user.id, 
          selectedLesson.course_id, 
          selectedLesson.id, 
          null
        );
      }
      
      video.removeEventListener('timeupdate', handleVideoTimeUpdate);
    }
  };

  const handleVideoEnded = async () => {
    if (!session?.user) return;
    
    if (selectedMiniLesson) {
      const parentLesson = Object.values(courseLessons)
        .flat()
        .find(l => l.id === selectedMiniLesson.lesson_id);
      
      if (parentLesson) {
        await markLessonComplete(
          session.user.id, 
          parentLesson.course_id, 
          selectedMiniLesson.lesson_id, 
          selectedMiniLesson.id
        );
      }
    } else if (selectedLesson) {
      await markLessonComplete(
        session.user.id, 
        selectedLesson.course_id, 
        selectedLesson.id, 
        null
      );
    }
  };

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/');
    } catch (err) {
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setFeedbackSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: session?.user?.id,
            user_email: session?.user?.email,
            message: feedback.trim(),
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setFeedback('');
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingLogo size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
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
            radial-gradient(ellipse 80% 80% at 50% 0%, #000 50%, transparent 90%)
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
            radial-gradient(ellipse 80% 80% at 50% 0%, #000 50%, transparent 90%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 ltr:left-4 rtl:right-4 z-50 bg-zinc-950 text-white p-3 rounded-lg border border-zinc-800 shadow-lg"
      >
        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
      </button>

      <div className="fixed top-4 ltr:right-4 rtl:left-4 z-50 flex items-center gap-3">
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="bg-zinc-950 text-white p-3 rounded-lg border border-zinc-800 shadow-lg hover:bg-zinc-900 transition-colors"
          title={t('profileSettings') || 'Profile Settings'}
        >
          <FontAwesomeIcon icon={faCog} />
        </button>
        <LanguageSwitcher />
      </div>
      
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`
        w-80 md:w-[320px]
        md:bg-zinc-950 md:border-r md:border-zinc-800
        fixed md:sticky
        h-screen
        overflow-y-auto
        top-0 bottom-0
        z-50
        transition-transform duration-300 md:transition-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-white text-2xl font-bold mb-2"> <img className="h-12 w-auto" src="/croppedlogo.png" alt="logo" /> eyycourses</h2>
            <p className="text-zinc-500 text-sm truncate">{session?.user?.email}</p>
          </div>

          <nav className="space-y-6 mb-6">
          {sections.map(section => {
            const sectionCourses = courses.filter(c => c.section_id === section.id);
            if (sectionCourses.length === 0) return null;
            
            return (
              <div key={section.id} className="space-y-3">

                <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-1">
                  {i18n.language === 'ar' ? section.title_ar : section.title_en}
                </div>
                

                <div className="space-y-2">
                  {sectionCourses.map(course => (
                    <div key={course.id}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (course.is_open) {
                            toggleCourse(course);
                          }
                        }}
                        disabled={!course.is_open}
                        className={`w-full p-4 flex items-center justify-between transition-colors rounded-lg border ${
                          course.is_open 
                            ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 cursor-pointer' 
                            : 'bg-zinc-900/30 border-zinc-800/50 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 pointer-events-none">
                          {course.is_open ? (
                            <FontAwesomeIcon icon={faPlay} className="text-[#c96f49] text-sm" />
                          ) : (
                            <FontAwesomeIcon icon={faLock} className="text-zinc-600 text-sm" />
                          )}
                          <span className="text-zinc-100 font-medium text-sm">{getCourseTitle(course)}</span>
                        </div>
                        <div className="flex items-center gap-2 pointer-events-none">
                          {!course.is_open && (
                            <Badge variant="secondary" className="text-xs">
                              {t('comingSoon')}
                            </Badge>
                          )}
                          {course.is_open && (
                            <FontAwesomeIcon 
                              icon={expandedCourse === course.id ? faChevronDown : faChevronRight} 
                              className="text-zinc-500 text-sm"
                            />
                          )}
                        </div>
                      </button>

                      {/* Lessons List */}
                      {expandedCourse === course.id && courseLessons[course.id] && (
                        <div className="mt-2 px-3 pb-3 space-y-1 bg-zinc-950/50 rounded-b-lg border-t border-zinc-800/50">
                          {courseLessons[course.id].map(lesson => {
                            const miniLessons = lessonMiniLessons[lesson.id] || [];
                            const hasMiniLessons = miniLessons.length > 0;
                            
                            return (
                              <div key={lesson.id} className="space-y-1">
                                {/* Lesson Button */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleLesson(lesson);
                                  }}
                                  className={`w-full text-left px-3 py-2.5 rounded-md transition-all text-sm flex items-center justify-between ${
                                    selectedLesson?.id === lesson.id && !selectedMiniLesson
                                      ? 'bg-[#c96f49] text-white shadow-lg shadow-[#c96f49]/20'
                                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                  }`}
                                >
                                  <span className="font-medium pointer-events-none">{getLessonTitle(lesson)}</span>
                                  {hasMiniLessons && (
                                    <FontAwesomeIcon 
                                      icon={expandedLesson === lesson.id ? faChevronDown : faChevronRight} 
                                      className="text-xs pointer-events-none"
                                    />
                                  )}
                                </button>
                                
                                {/* Mini-Lessons Dropdown */}
                                {expandedLesson === lesson.id && hasMiniLessons && (
                                  <div className="ltr:ml-4 rtl:mr-4 space-y-1 ltr:pl-3 rtl:pr-3 ltr:border-l-2 rtl:border-r-2 border-zinc-800">
                                    {miniLessons.map(miniLesson => (
                                      <button
                                        key={miniLesson.id}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          selectMiniLesson(miniLesson);
                                          setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-md transition-all text-sm ${
                                          selectedMiniLesson?.id === miniLesson.id
                                            ? 'bg-[#c96f49] text-white shadow-lg shadow-[#c96f49]/20'
                                            : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                                        }`}
                                      >
                                        <span className="pointer-events-none">
                                          {i18n.language === 'ar' ? miniLesson.title_ar : miniLesson.title_en}
                                        </span>
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
              </div>
            );
          })}
          
          {/* Uncategorized Courses */}
          {courses.filter(c => !c.section_id).length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-1">
                {t('uncategorized') || 'Uncategorized'}
              </div>
              
              <div className="space-y-2">
                {courses.filter(c => !c.section_id).map(course => (
                  <div key={course.id}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (course.is_open) {
                          toggleCourse(course);
                        }
                      }}
                      disabled={!course.is_open}
                      className={`w-full p-4 flex items-center justify-between transition-colors rounded-lg border ${
                        course.is_open 
                          ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 cursor-pointer' 
                          : 'bg-zinc-900/30 border-zinc-800/50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 pointer-events-none">
                        {course.is_open ? (
                          <FontAwesomeIcon icon={faPlay} className="text-[#c96f49] text-sm" />
                        ) : (
                          <FontAwesomeIcon icon={faLock} className="text-zinc-600 text-sm" />
                        )}
                        <span className="text-zinc-100 font-medium text-sm">{getCourseTitle(course)}</span>
                      </div>
                      <div className="flex items-center gap-2 pointer-events-none">
                        {!course.is_open && (
                          <Badge variant="secondary" className="text-xs">
                            {t('comingSoon')}
                          </Badge>
                        )}
                        {course.is_open && (
                          <FontAwesomeIcon 
                            icon={expandedCourse === course.id ? faChevronDown : faChevronRight} 
                            className="text-zinc-500 text-sm"
                          />
                        )}
                      </div>
                    </button>

                    {/* Lessons List */}
                    {expandedCourse === course.id && courseLessons[course.id] && (
                      <div className="px-3 pb-3 space-y-1 bg-zinc-950/50 rounded-b-lg">
                        {courseLessons[course.id].map(lesson => {
                          const miniLessons = lessonMiniLessons[lesson.id] || [];
                          const hasMiniLessons = miniLessons.length > 0;
                          
                          return (
                            <div key={lesson.id} className="space-y-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleLesson(lesson);
                                  if (!hasMiniLessons && !lessonMiniLessons[lesson.id]) {
                                    setIsMobileMenuOpen(false);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-md transition-all text-sm flex items-center justify-between ${
                                  selectedLesson?.id === lesson.id && !selectedMiniLesson
                                    ? 'bg-[#c96f49] text-white shadow-lg shadow-[#c96f49]/20'
                                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                }`}
                              >
                                <span className="font-medium pointer-events-none">{getLessonTitle(lesson)}</span>
                                {hasMiniLessons && (
                                  <FontAwesomeIcon 
                                    icon={expandedLesson === lesson.id ? faChevronDown : faChevronRight} 
                                    className="text-xs pointer-events-none"
                                  />
                                )}
                              </button>
                              
                              {/* Mini-Lessons Dropdown */}
                              {expandedLesson === lesson.id && hasMiniLessons && (
                                <div className="ltr:ml-4 rtl:mr-4 space-y-1 ltr:pl-3 rtl:pr-3 ltr:border-l-2 rtl:border-r-2 border-zinc-800">
                                  {miniLessons.map(miniLesson => (
                                    <button
                                      key={miniLesson.id}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        selectMiniLesson(miniLesson);
                                        setIsMobileMenuOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md transition-all text-sm ${
                                        selectedMiniLesson?.id === miniLesson.id
                                          ? 'bg-[#c96f49] text-white shadow-lg shadow-[#c96f49]/20'
                                          : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                                      }`}
                                    >
                                      <span className="pointer-events-none">
                                        {i18n.language === 'ar' ? miniLesson.title_ar : miniLesson.title_en}
                                      </span>
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
            </div>
          )}
        </nav>
        </div>

        <div className="sticky bottom-0 bg-zinc-950 border-t border-zinc-800 p-6 space-y-5">
          {/* Feedback Form */}
          <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-800">
            <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
              {t('feedbackPrompt')}
            </p>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('feedbackPlaceholder')}
                className="w-full bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-md p-3 text-sm 
                         placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 
                         resize-none min-h-20"
                disabled={feedbackSubmitting}
              />
              <button
                type="submit"
                disabled={feedbackSubmitting || !feedback.trim()}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2.5 px-4 
                         rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {feedbackSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingLogo size="sm" />
                    {t('sending')}
                  </span>
                ) : feedbackSuccess ? (
                  t('feedbackSent')
                ) : (
                  t('sendFeedback')
                )}
              </button>
            </form>
          </div>

          {/* Copyright Notice */}
          <div className="text-center">
            <p className="text-zinc-500 text-xs">
              © 2026 eyycourses · {t('allRightsReserved')}
            </p>
          </div>

          {/* Sign Out Button */}
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-full"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            {t('signout')}
          </Button>
        </div>
      </div>


      <div className="flex-1 p-4 md:p-8 pt-16 md:pt-8 relative z-0">
        <div className="max-w-5xl mx-auto">
          {(selectedLesson || selectedMiniLesson) ? (
            <div 
              key={`content-${selectedMiniLesson?.id || selectedLesson?.id}`}
              className="space-y-6"
            >
              {/* Title */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {selectedMiniLesson 
                    ? (i18n.language === 'ar' ? selectedMiniLesson.title_ar : selectedMiniLesson.title_en)
                    : getLessonTitle(selectedLesson)
                  }
                </h1>
              </div>
              
              {/* Video Player Card */}
              {videoUrl && (
                <Card 
                  key={`video-${selectedMiniLesson?.id || selectedLesson?.id}-${videoUrl}`}
                  className="overflow-hidden bg-zinc-950 border-zinc-800 isolate"
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <CardContent className="p-0" style={{ position: 'relative', zIndex: 1 }}>
                    {/* Check if it's a YouTube embed or direct video file */}
                    {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('embed') ? (
                      <div style={{ position: 'relative', paddingBottom: '56.25%', zIndex: 1 }}>
                        <iframe
                          key={`iframe-${selectedMiniLesson?.id || selectedLesson?.id}`}
                          src={videoUrl}
                          className="absolute top-0 left-0 w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ zIndex: 1 }}
                        ></iframe>
                      </div>
                    ) : (
                      <video
                        key={`video-${selectedMiniLesson?.id || selectedLesson?.id}`}
                        controls
                        controlsList="nodownload"
                        className="w-full bg-black"
                        style={{ maxHeight: '600px', position: 'relative', zIndex: 1 }}
                        playsInline
                        preload="metadata"
                        onPlay={handleVideoPlay}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onEnded={handleVideoEnded}
                      >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </CardContent>
                </Card>
              )}
              {(selectedMiniLesson?.content_html || selectedLesson?.content_html) && (() => {
                const rawContent = selectedMiniLesson?.content_html || selectedLesson.content_html;
                const { content, questions } = parseContent(rawContent);
                


                const hasRealContent = content && content.trim().length > 0;
                
                return (
                  <>
                    {hasRealContent && (
                      <Card className="bg-zinc-950 border-zinc-800">
                        <CardContent className="pt-6">
                          <div 
                            className="text-zinc-300 text-base prose prose-invert prose-zinc max-w-none whitespace-pre-wrap
                              prose-headings:text-zinc-100 prose-headings:font-bold
                              prose-p:text-zinc-300 prose-p:leading-relaxed
                              prose-a:text-[#c96f49] prose-a:no-underline hover:prose-a:underline
                              prose-strong:text-zinc-100 prose-strong:font-semibold
                              prose-code:text-[#c96f49] prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                              prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
                              prose-ul:text-zinc-300 prose-ol:text-zinc-300
                              prose-li:text-zinc-300 prose-li:marker:text-zinc-500
                              prose-blockquote:border-l-[#c96f49] prose-blockquote:text-zinc-400"
                            dangerouslySetInnerHTML={{ 
                              __html: DOMPurify.sanitize(
                                content, 
                                {
                                  ADD_TAGS: ['iframe'],
                                  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
                                }
                              )
                            }}
                          />
                        </CardContent>
                      </Card>
                    )}
                    {questions.length > 0 && <QuestionDisplay questions={questions} t={t} />}
                  </>
                );
              })()}

              {/* Default message if no content */}
              {!videoUrl && !(selectedMiniLesson?.content_html || selectedLesson?.content_html) && (
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="py-12">
                    <p className="text-zinc-500 text-center text-lg">
                      {t('noContentYet') || 'Content coming soon...'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="bg-zinc-950 border-zinc-800 max-w-md w-full">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl mb-2">{t('welcome')}</CardTitle>
                  <CardDescription className="text-lg">
                    {t('selectLesson')}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <ComponentErrorBoundary fallbackTitle="Profile Error" fallbackMessage="Unable to load profile settings.">
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      </ComponentErrorBoundary>
    </div>
  );
};

export default Dashboard;