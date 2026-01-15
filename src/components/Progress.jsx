import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserAuth } from '../context/AuthContext';
import { useTranslation } from '../../node_modules/react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faChartBar, faArrowLeft, faTrophy } from '@fortawesome/free-solid-svg-icons';
import LoadingLogo from './LoadingLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Simple Progress Bar Component
const ProgressBar = ({ value, className = '' }) => (
  <div className={`w-full bg-zinc-800 rounded-full h-2 overflow-hidden ${className}`}>
    <div 
      className="h-full bg-[#c96f49] rounded-full transition-all duration-500"
      style={{ width: `${value}%` }}
    />
  </div>
);

const Progress = () => {
  const { t, i18n } = useTranslation();
  const { session } = UserAuth();
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [quizStats, setQuizStats] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserProgress();
    }
  }, [session]);

  const fetchUserProgress = async () => {
    try {
      setLoading(true);
      
      
      // Fetch enrolled courses with progress
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollment')
        .select(`
          *,
          courses (
            id,
            title_en,
            title_ar
          )
        `)
        .eq('user_id', session.user.id)
        .order('enrolled_at', { ascending: false });

      if (enrollError) {
        throw enrollError;
      }
      

      if (!enrollments || enrollments.length === 0) {
        setEnrolledCourses([]);
        setLoading(false);
        return;
      }

      // For each course, calculate progress
      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const courseId = enrollment.course_id;
          
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', courseId);

          // Get mini lessons for these lessons
          const lessonIds = lessons?.map(l => l.id) || [];
          let miniLessons = [];
          
          if (lessonIds.length > 0) {
            const { data: miniLessonsData } = await supabase
              .from('mini_lessons')
              .select('id, lesson_id')
              .in('lesson_id', lessonIds);
            
            miniLessons = miniLessonsData || [];
          }

          // Determine if we count mini lessons or regular lessons
          const totalLessons = miniLessons.length > 0 
            ? miniLessons.length 
            : lessons?.length || 0;

          // Count completed lessons/mini-lessons
          const { data: progress } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('course_id', courseId)
            .eq('completed', true);

          const completedCount = progress?.length || 0;
          const progressPercentage = totalLessons > 0 
            ? Math.round((completedCount / totalLessons) * 100) 
            : 0;

          return {
            ...enrollment,
            course: enrollment.courses,
            totalLessons,
            completedLessons: completedCount,
            progressPercentage
          };
        })
      );

      setEnrolledCourses(coursesWithProgress);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizStats = async (courseId) => {
    try {
      // Fetch all questions in this course
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id')
        .eq('course_id', courseId);

      if (!questions || questions.length === 0) {
        setQuizStats({
          totalQuestions: 0,
          correctFirstTry: 0,
          correctSecondTry: 0,
          correctThirdPlusTry: 0,
          incorrectAnswers: 0
        });
        return;
      }

      const questionIds = questions.map(q => q.id);

      // Fetch user's attempts for these questions
      const { data: attempts } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', session.user.id)
        .in('question_id', questionIds);

      const questionStats = {};
      
      (attempts || []).forEach(attempt => {
        if (!questionStats[attempt.question_id]) {
          questionStats[attempt.question_id] = {
            attempts: [],
            firstCorrect: null
          };
        }
        questionStats[attempt.question_id].attempts.push(attempt);
        
        if (attempt.is_correct && !questionStats[attempt.question_id].firstCorrect) {
          questionStats[attempt.question_id].firstCorrect = attempt.attempt_number;
        }
      });

      let correctFirstTry = 0;
      let correctSecondTry = 0;
      let correctThirdPlusTry = 0;
      let incorrectAnswers = 0;

      Object.values(questionStats).forEach(stat => {
        if (stat.firstCorrect === 1) correctFirstTry++;
        else if (stat.firstCorrect === 2) correctSecondTry++;
        else if (stat.firstCorrect >= 3) correctThirdPlusTry++;
        else incorrectAnswers++;
      });

      setQuizStats({
        totalQuestions: questions.length,
        correctFirstTry,
        correctSecondTry,
        correctThirdPlusTry,
        incorrectAnswers
      });
    } catch (error) {
    }
  };

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    fetchQuizStats(course.course_id);
  };

  const handleBackToProgress = () => {
    setSelectedCourse(null);
    setQuizStats(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingLogo size="lg" />
      </div>
    );
  }

  // Detail view for a specific course
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={handleBackToProgress}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>{t('backToProgress')}</span>
        </button>

        {/* Course Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {i18n.language === 'ar' ? selectedCourse.course.title_ar : selectedCourse.course.title_en}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              {t('enrolledOn')}: {new Date(selectedCourse.enrolled_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
          {selectedCourse.completed && (
            <Badge className="bg-green-600 text-white">
              <FontAwesomeIcon icon={faTrophy} className="ltr:mr-2 rtl:ml-2" />
              {t('completed')}
            </Badge>
          )}
        </div>

        {/* Progress Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FontAwesomeIcon icon={faChartBar} className="text-[#c96f49]" />
              {t('courseProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">{t('completionRate')}</span>
                <span className="text-white font-semibold">{selectedCourse.progressPercentage}%</span>
              </div>
              <ProgressBar value={selectedCourse.progressPercentage} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="text-2xl font-bold text-[#c96f49]">{selectedCourse.completedLessons}</div>
                <div className="text-xs text-zinc-400 mt-1">{t('lessonsCompleted')}</div>
              </div>
              <div className="text-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="text-2xl font-bold text-zinc-300">{selectedCourse.totalLessons}</div>
                <div className="text-xs text-zinc-400 mt-1">{t('totalQuestions')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Performance Card */}
        {quizStats && quizStats.totalQuestions > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
                {t('quizPerformance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-300">{t('totalQuestions')}</span>
                  <Badge variant="secondary">{quizStats.totalQuestions}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-950/30 rounded-lg border border-green-800/30">
                  <span className="text-zinc-300">{t('correctFirstTry')}</span>
                  <Badge className="bg-green-600 text-white">{quizStats.correctFirstTry}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#2a1510]/30 rounded-lg border border-[#8b4d2f]/30">
                  <span className="text-zinc-300">{t('correctSecondTry')}</span>
                  <Badge className="bg-[#c96f49] text-white">{quizStats.correctSecondTry}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-950/30 rounded-lg border border-yellow-800/30">
                  <span className="text-zinc-300">{t('correctThirdTry')}</span>
                  <Badge className="bg-yellow-600 text-white">{quizStats.correctThirdPlusTry}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-950/30 rounded-lg border border-red-800/30">
                  <span className="text-zinc-300">{t('incorrectAnswers')}</span>
                  <Badge className="bg-red-600 text-white">{quizStats.incorrectAnswers}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {quizStats && quizStats.totalQuestions === 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <p className="text-center text-zinc-400">{t('noContentYet')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Main progress overview
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faChartBar} className="text-[#c96f49] text-xl" />
        <h3 className="text-2xl font-bold text-white">{t('myProgress')}</h3>
      </div>

      {enrolledCourses.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-12 pb-12 text-center">
            <FontAwesomeIcon icon={faChartBar} className="text-zinc-700 text-5xl mb-4" />
            <h4 className="text-xl font-semibold text-zinc-300 mb-2">{t('noCoursesYet')}</h4>
            <p className="text-zinc-500">{t('startLearning')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrolledCourses.map((enrollment) => (
            <Card 
              key={enrollment.id} 
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
              onClick={() => handleViewDetails(enrollment)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {i18n.language === 'ar' ? enrollment.course.title_ar : enrollment.course.title_en}
                    </h4>
                    <p className="text-sm text-zinc-400">
                      {enrollment.completedLessons} / {enrollment.totalLessons} {t('lessonsCompleted')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {enrollment.completed ? (
                      <Badge className="bg-green-600 text-white">
                        <FontAwesomeIcon icon={faCheckCircle} className="ltr:mr-1 rtl:ml-1" />
                        {t('completed')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{t('inProgress')}</Badge>
                    )}
                    <span className="text-sm font-semibold text-[#c96f49]">
                      {enrollment.progressPercentage}%
                    </span>
                  </div>
                </div>
                <ProgressBar value={enrollment.progressPercentage} className="h-2" />
                <button className="mt-3 text-sm text-[#c96f49] hover:text-[#d98963] transition-colors">
                  {t('viewDetails')} →
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Progress;
