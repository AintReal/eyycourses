import { supabase } from '../supabaseClient';

export const trackLessonView = async (userId, courseId, lessonId, miniLessonId = null) => {
  try {
    await enrollUserInCourse(userId, courseId);

    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .eq('mini_lesson_id', miniLessonId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('lesson_progress')
        .update({ 
          last_watched_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('lesson_progress')
        .insert([{
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          mini_lesson_id: miniLessonId,
          completed: false,
          last_watched_at: new Date().toISOString()
        }])
        .select();
    }
  } catch (error) {
  }
};

export const markLessonComplete = async (userId, courseId, lessonId, miniLessonId = null) => {
  try {
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .eq('mini_lesson_id', miniLessonId)
      .maybeSingle();

    if (existing) {
      if (!existing.completed) {
        await supabase
          .from('lesson_progress')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString(),
            last_watched_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      }
    } else {
      await supabase
        .from('lesson_progress')
        .insert([{
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          mini_lesson_id: miniLessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString()
        }]);
    }

    await checkCourseCompletion(userId, courseId);
  } catch (error) {
  }
};

export const enrollUserInCourse = async (userId, courseId) => {
  try {
    const { data: existing } = await supabase
      .from('course_enrollment')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!existing) {
      await supabase
        .from('course_enrollment')
        .insert([{
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString()
        }])
        .select();
    }
  } catch (error) {
  }
};

export const checkCourseCompletion = async (userId, courseId) => {
  try {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    if (!lessons || lessons.length === 0) return;

    const { data: miniLessons } = await supabase
      .from('mini_lessons')
      .select('id, lesson_id')
      .in('lesson_id', lessons.map(l => l.id));

    let totalItems;
    let completedItems;

    if (miniLessons && miniLessons.length > 0) {
      totalItems = miniLessons.length;
      
      const { data: completed } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true)
        .not('mini_lesson_id', 'is', null);
      
      completedItems = completed?.length || 0;
    } else {
      totalItems = lessons.length;
      
      const { data: completed } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true)
        .is('mini_lesson_id', null);
      
      completedItems = completed?.length || 0;
    }

    if (completedItems >= totalItems && totalItems > 0) {
      await supabase
        .from('course_enrollment')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('course_id', courseId);
    }
  } catch (error) {
  }
};

export const recordQuizAttempt = async (userId, questionId, selectedAnswerId, isCorrect) => {
  try {
    const { data: previousAttempts } = await supabase
      .from('user_quiz_attempts')
      .select('attempt_number')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const attemptNumber = previousAttempts && previousAttempts.length > 0
      ? previousAttempts[0].attempt_number + 1
      : 1;

    await supabase
      .from('user_quiz_attempts')
      .insert([{
        user_id: userId,
        question_id: questionId,
        selected_answer_id: selectedAnswerId,
        is_correct: isCorrect,
        attempt_number: attemptNumber,
        answered_at: new Date().toISOString()
      }]);
  } catch (error) {
  }
};

export const getUserQuestionAttempt = async (userId, questionId) => {
  try {
    const { data } = await supabase
      .from('user_quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .order('attempt_number', { ascending: true });

    if (!data || data.length === 0) return null;

    const firstCorrect = data.find(a => a.is_correct);
    return firstCorrect || data[data.length - 1];
  } catch (error) {
    return null;
  }
};
