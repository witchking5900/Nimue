import { supabase } from '../supabaseClient';

export const saveMistake = async (userId, questionId, gameType, questionSnapshot = {}) => {
  if (!userId) return;

  try {
    const { data: existing } = await supabase
      .from('user_mistakes')
      .select('id, mistake_count')
      .match({ user_id: userId, question_id: questionId, game_type: gameType })
      .single();

    if (existing) {
      await supabase
        .from('user_mistakes')
        .update({ 
          mistake_count: existing.mistake_count + 1,
          created_at: new Date(),
          question_snapshot: questionSnapshot // 🔥 UPDATE SNAPSHOT ON REPEAT FAILURE
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_mistakes')
        .insert({
          user_id: userId,
          question_id: questionId,
          game_type: gameType,
          question_snapshot: questionSnapshot
        });
    }
  } catch (error) {
    console.error("Failed to save mistake:", error);
  }
};