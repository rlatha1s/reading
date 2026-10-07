# 복음충신교회 성경통독 — Vercel + Supabase

기존 화면, 36명 명단, 마지막 제출 반영, 공개 통독 현황과 묵상 조회를 유지한 Next.js 프로젝트입니다.
추석 9/24·25는 제외되며 일정은 12/8까지입니다.

## 1. Supabase 설정

프로젝트: `reading`, URL: `https://wnqkrwfaewseiddjahuo.supabase.co`

Supabase의 SQL Editor에서 `supabase/setup.sql` 내용을 실행합니다.
이 SQL은 attendance 테이블과 인덱스를 만들고 RLS를 켭니다.
브라우저의 익명 키로 직접 테이블에 접근하는 권한은 없으며 Vercel 서버만 접근합니다.
Project Settings → API Keys에서 서버용 Secret key (`sb_secret_…`)를 확인합니다.
비밀키는 GitHub나 채팅에 올리지 마세요.

## 2. 로컬 실행

Node.js 22.13 이상과 pnpm을 사용합니다.

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
```

`.env.local`의 `SUPABASE_SECRET_KEY=` 뒤에 Secret key를 넣습니다.

```sh
pnpm dev
```

http://localhost:3000 에서 확인합니다. 실제 Supabase에 저장하므로 테스트 기록은 실제 명단으로 임의 제출하지 마세요.

## 3. VS Code에서 GitHub에 올리기

이 폴더만 VS Code에서 엽니다. 기존 Sites 프로젝트 폴더와 별개입니다.
이 폴더는 로컬 Git 저장소로 초기화되어 있습니다. 소스 제어 → GitHub에 게시를 선택하세요.
새 비공개 저장소를 권장합니다. `.env.local`, `backups/`, `node_modules/`는 자동 제외됩니다.
명령어를 사용할 경우:

```sh
git init -b main
git add .
git commit -m "Prepare Bible reading app for Vercel"
```

GitHub에서 새 빈 저장소를 만든 후 표시되는 remote add / push 명령을 실행합니다.
GitHub에 `.env.local`이나 `backups/`가 포함되지 않았는지 확인합니다.

## 4. Vercel 연결

Vercel → Add New → Project → GitHub 저장소 Import.
Framework: Next.js, Root Directory: 저장소 루트. 패키지 관리자: pnpm.
Environment Variables에 아래 두 값을 설정합니다.

| Name | Value |
| --- | --- |
| SUPABASE_URL | https://wnqkrwfaewseiddjahuo.supabase.co |
| SUPABASE_SECRET_KEY | Supabase의 서버용 Secret key |

키에 NEXT_PUBLIC_ 접두사를 붙이지 마세요. Production에 설정하고 Preview가 필요하면 별도 테스트 DB를 쓰세요.
Deploy를 누릅니다. 기본 주소는 Vercel에서 정한 프로젝트 이름에 따라 생성됩니다.
이후 main에 push하면 새 버전이 자동 배포됩니다.

## 5. 기존 기록 이전 및 전환

```sh
pnpm backup
```

기존 사이트의 공개 출석 기록과 36명 묵상을 조회하여 `backups/<시간>/records.json`과 `import.sql`을 만듭니다.
백업 도중 기록이 바뀌면 중단하므로 다시 실행하세요. 백업은 개인 자료이므로 Git에 포함하지 않습니다.
Supabase SQL Editor에서 `import.sql`을 실행합니다. 이미 더 최신인 기록은 덮어쓰지 않습니다.
날짜는 원래 분량의 고정 식별자로 저장됩니다. 화면에서 추석 이동을 적용하므로 SQL 날짜를 다시 미루면 안 됩니다.

새 사이트의 전체 출석 수, 9/28·29로 이동된 기록, 이름별 묵상을 비교합니다.
실제 전환 직전에 기존 사이트의 제출을 잠시 멈추도록 참여자에게 알린 뒤 새 백업을 가져오고 새 주소를 공유하세요.
기존 사이트를 계속 사용하면 두 저장소가 자동 동기화되지 않습니다. 아직 기존 사이트는 변경되지 않았습니다.

## 검증

```sh
pnpm test
pnpm build
```

테스트는 외부 저장소를 변경하지 않습니다. 실제 Supabase 연결 및 데이터 이전 확인은 키 설정 후 별도로 필요합니다.
