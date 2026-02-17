# 카드 뒤집기 게임

## 로컬 실행

```bash
# config.js 생성 (최초 1회)
cp config.example.js config.js
# config.js에 Supabase URL, Anon Key 입력

# 서버 실행
npx serve -p 3000
```

## Vercel 배포

1. GitHub 저장소 연결
2. **Settings** → **Environment Variables**에서 추가:
   - `SUPABASE_URL`: `https://YOUR_PROJECT_REF.supabase.co`
   - `SUPABASE_ANON_KEY`: Supabase anon key
3. **Redeploy** 실행
