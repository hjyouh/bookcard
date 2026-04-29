# 나의 독서 카드

모바일 홈 화면에 설치해서 앱처럼 사용할 수 있는 오프라인 우선 독서카드 PWA입니다. 현재 구현 범위는 Phase 1이며, 로컬 IndexedDB 기반 카드 생성/수정/삭제/검색과 기본 PWA 설치/오프라인 동작을 제공합니다.

## 구현 범위

- Next.js App Router + TypeScript + Tailwind CSS
- 모바일 중심 UI
- IndexedDB 로컬 저장
- 독서카드 생성 / 수정 / 삭제 / 검색 / 목록 조회
- 오프라인에서도 기본 화면과 저장된 카드 사용 가능
- PWA manifest + service worker + 홈 화면 설치 배너
- 설정 화면의 자동 동기화 토글/백업 가져오기/내보내기

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 됩니다.

## 폴더 구조

```text
app/
  cards/
  offline/
  search/
  settings/
components/
lib/
  db.ts
  repository.ts
  sample-data.ts
  types.ts
public/
  icons/
  manifest.webmanifest
  sw.js
```

## 데이터 구조

Phase 1에서도 이후 동기화를 고려해 카드에 아래 필드를 유지합니다.

- `id`
- `owner_id`
- `local_id`
- `title`
- `author`
- `book_title`
- `question`
- `keywords`
- `memo`
- `summary`
- `action_note`
- `visibility`
- `read_status`
- `created_at`
- `updated_at`
- `deleted_at`
- `sync_status`

`sync_status` 값:

- `synced`
- `pending_create`
- `pending_update`
- `pending_delete`
- `sync_error`

## 오프라인 동작 방식

- 카드 데이터는 브라우저의 IndexedDB에 저장됩니다.
- 앱 최초 로드 후에는 service worker가 앱 shell과 주요 정적 리소스를 캐시합니다.
- 네트워크가 끊겨도 저장된 카드의 조회/수정/삭제/검색이 가능합니다.
- 삭제는 soft delete 방식으로 처리되며, 향후 Supabase 동기화와 연결하기 쉽게 구성되어 있습니다.

## 백업 / 가져오기

- 설정 화면에서 로컬 데이터를 JSON 파일로 내보낼 수 있습니다.
- JSON 백업 파일을 다시 가져와 IndexedDB를 복원할 수 있습니다.

## 다음 단계

### Phase 2

- Supabase Auth 로그인/회원가입
- `profiles` 테이블
- 수동 동기화
- 내 카드 클라우드 저장

### Phase 3

- `alone` / `public` 공개 범위
- 전체 공개 카드 조회
- `card_reads` 기반 읽음 상태 분리

### Phase 4

- 친구 요청
- 친구 공유
- 그룹 공유

### Phase 5

- 자동 동기화
- 충돌 처리 개선
- UI polish

## Vercel 배포 안내

1. Git 저장소에 프로젝트를 올립니다.
2. Vercel에서 새 프로젝트를 생성합니다.
3. Framework Preset은 Next.js를 사용합니다.
4. Environment Variables에 `.env.example` 기준으로 추후 Supabase 값을 추가합니다.
5. 배포 후 모바일 브라우저에서 접속해 홈 화면에 추가합니다.

Phase 1은 Supabase 연동이 없으므로 환경 변수 없이도 실행 가능합니다.
