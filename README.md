# 💐 정찬혁 & 이선우 모바일 청첩장 (Wedding Announcement)

결혼식 참석을 알리고 방명록을 통해 축하 메시지를 남길 수 있는 모바일 최적화 웹 애플리케이션입니다.
다크 그린 톤의 잔디밭 배경과 미니멀한 UI, 입체적인 카드 디자인을 특징으로 합니다.

## 🚀 개발 스택 (Tech Stack)
* **프론트엔드**: HTML5, Vanilla JavaScript, CSS3
* **백엔드/DB**: [Supabase](https://supabase.com/) (방명록 데이터베이스 및 실시간 연동)
* **번들러/서버**: Vite

## 🌟 주요 기능 (Features)
* **스크롤 애니메이션**: 내용이 스크롤될 때마다 자연스럽게 떠오르는 `Fade Up` 애니메이션
* **아코디언 기반 계좌번호**: 신랑/신부측 축의금 계좌 아코디언 UI 및 복사 기능
* **실시간 방명록 (Guestbook)**: 
  * Supabase를 활용한 실시간 데이터 동기화
  * 5개 단위 페이지네이션 (Pagination)
  * 공개/비밀글 토글
  * 비밀번호를 통한 방명록 수정 및 삭제 기능

## 🛠️ 실행 방법 (How to run locally)

이 프로젝트는 Vite를 사용하여 구동됩니다.

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev
```

서버가 실행되면 브라우저에서 `http://localhost:5173` 으로 접속할 수 있습니다.

## 🔐 보안 개선 과제 (TODOs)
- **방명록 API 개선 예정**: 현재 방명록의 비밀번호 검증과 비밀글 숨김 처리를 클라이언트(브라우저)에서 수행하고 있습니다. 향후 Supabase의 RLS(Row Level Security) 규칙 등을 도입하여 데이터베이스 단에서 보안을 강화할 예정입니다.
- **이미지 최적화 예정**: 고용량 사진을 WebP 규격으로 압축(Resize & format conversion)하여 로딩 속도를 향상시킬 예정입니다.
