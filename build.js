/**
 * config.js 자동 생성 + card_game_supabase 출력 폴더 구성
 * - 환경 변수(SUPABASE_URL, SUPABASE_ANON_KEY)가 있으면 → config.js 생성
 * - 없으면 → config.example.js를 config.js로 복사 (로컬 개발용)
 * - Vercel: card_game_supabase 폴더에 배포용 파일 출력
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const OUTPUT_DIR = 'card_game_supabase';
const outputPath = path.join(__dirname, OUTPUT_DIR);

// card_game_supabase 폴더 생성
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// config.js 내용 생성
let configContent;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  configContent = `/**
 * Supabase 설정 (빌드 시 자동 생성)
 */
window.SUPABASE_URL = '${SUPABASE_URL}';
window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
`;
  console.log('✓ config.js created from environment variables');
} else {
  const examplePath = path.join(__dirname, 'config.example.js');
  if (fs.existsSync(examplePath)) {
    configContent = fs.readFileSync(examplePath, 'utf8');
    console.log('✓ config.js from config.example.js (환경 변수 미설정)');
  } else {
    configContent = `window.SUPABASE_URL = '';
window.SUPABASE_ANON_KEY = '';
`;
    console.log('✓ config.js created (placeholder)');
  }
}

// card_game_supabase에 config.js 저장
fs.writeFileSync(path.join(outputPath, 'config.js'), configContent);

// 정적 파일 복사 (index.html, game.js, style.css)
const staticFiles = ['index.html', 'game.js', 'style.css'];
staticFiles.forEach(file => {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outputPath, file));
    console.log(`  → ${file} copied`);
  }
});

console.log(`✓ Build complete → ${OUTPUT_DIR}/`);
