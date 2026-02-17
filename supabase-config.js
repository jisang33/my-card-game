// Supabase 설정 - jisang33's Project / card_game_scores 테이블
const SUPABASE_URL = 'https://jgoewykmyisxauhzmlyv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb2V3eWtteWlzeGF1aHptbHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTA4NDIsImV4cCI6MjA4MzcyNjg0Mn0.3XtwwSNney_qx40mzbdyOeSpQVbyAlKONMKE1HCOqjM';

// UMD 빌드: window.supabase.createClient 또는 supabase.createClient
function initSupabase() {
  if (typeof window === 'undefined') return null;
  try {
    const lib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
    if (lib && typeof lib.createClient === 'function') {
      return lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.error('Supabase 초기화 실패:', e);
  }
  return null;
}
const supabase = initSupabase();
