# 202430134 천우성

Next.js(App Router) 수업 정리 및 실습 저장소

## 실행 방법

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

## 실습 파일

| 주소 | 내용 | 파일 위치 |
| --- | --- | --- |
| `/` | 루트 페이지 | `src/app/page.tsx` |
| `/about` | 라우트 그룹 | `src/app/(marketing)/` |
| `/blog` | 게시글 목록 | `src/app/blog/page.tsx` |
| `/blog/[slug]` | 동적 라우트 | `src/app/blog/[slug]/page.tsx` |
| - | 더미 데이터 | `src/app/posts.tsx` |

---

## 3주차 (2026-09-16)

### 라우트 그룹 `(folder)`
- 폴더 이름을 소괄호로 감싸면 **URL 경로에서 빠진다**
- URL은 그대로 두고 파일만 성격별로 묶어 둘 때 사용
  - `app/(marketing)/about/page.tsx` → `/about`
- 그룹마다 별도의 `layout.tsx`를 둘 수 있어서, 같은 레벨에서 서로 다른 레이아웃을 적용할 수 있다

### 비공개 폴더 `_folder`
- 앞에 `_`를 붙이면 그 폴더와 하위 폴더 전체가 **라우팅 대상에서 제외**된다
  - `app/blog/_components/PostCard.tsx` → 주소로 접근 불가
- 쓰는 이유
  - UI 로직과 라우팅 로직을 분리
  - 내부 파일을 일관된 방식으로 정리
  - 에디터에서 정렬/그룹화가 편함
  - Next.js 예약 파일명과의 이름 충돌 방지

### 병렬 라우팅 `@slot`
- `@이름` 폴더 = 이름 있는 슬롯
- 슬롯은 부모 `layout`의 props로 들어오고, URL에는 영향이 없다
- 예) 사이드바 + 메인 콘텐츠를 한 화면에 동시에 렌더링
- 현재 주소와 맞는 페이지가 슬롯에 없으면 `default.tsx`가 대신 보여진다 (없으면 새로고침 시 404)

```tsx
export default function DashboardLayout({ children, sidebar }: LayoutProps<"/dashboard">) {
  return (
    <>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </>
  );
}
```

### 가로채기 라우팅
- 다른 경로의 페이지를 **현재 레이아웃 안에서** 보여주는 방법 (모달에 많이 사용)
- 링크로 이동하면 모달, 새로고침·직접 접속하면 원래 페이지가 뜬다

| 표기 | 의미 |
| --- | --- |
| `(.)folder` | 같은 레벨 |
| `(..)folder` | 한 레벨 위 |
| `(..)(..)folder` | 두 레벨 위 |
| `(...)folder` | app 루트 기준 |

- 기준은 파일 시스템이 아니라 **라우트 세그먼트** → `@slot` 폴더는 레벨로 세지 않는다

### 메타데이터 파일 / Open Graph
- 파비콘·앱 아이콘, OG 이미지, `sitemap`, `robots` 등을 정해진 파일명으로 만들면 자동 적용
- Open Graph: 링크를 SNS·메신저에 공유할 때 보이는 **미리보기**를 정의하는 규칙
  - 페이스북이 만든 규칙이라 플랫폼마다 조금씩 다르게 보일 수 있다
  - HTML `<meta>` 태그에 선언

### 컴포넌트 계층 구조
라우트 세그먼트 안의 특수 파일은 아래 순서로 감싸진다.

```
layout
 └ template
    └ error        (에러 경계)
       └ loading   (Suspense 경계)
          └ not-found
             └ page
```

### layout vs template
| | layout | template |
| --- | --- | --- |
| 페이지 이동 시 | 다시 마운트되지 않음 | 매번 새로 마운트 |
| 상태(state) | 유지 | 초기화 |

### 코로케이션
- `app` 안의 폴더 구조 = URL 구조
- 하지만 `page.tsx`나 `route.ts`가 있어야 실제로 공개된다
- 그래서 컴포넌트, 유틸 파일을 라우트 폴더 안에 같이 둬도 안전하다
- 공용 파일은 보통 `src/components`, `src/lib`처럼 `app` 바깥에 둔다

### layout
- 여러 페이지가 공유하는 UI, 이동해도 리렌더링되지 않는다
- `children`을 props로 받아야 한다
- `app` 바로 아래의 layout = **루트 레이아웃**, `<html>`과 `<body>`가 반드시 있어야 한다
- 파일명은 `layout.tsx`로 고정, 안의 함수 이름은 자유 (예: `MarketingLayout`)

---

## 2주차 (2026-09-09)

### 프로젝트를 직접 만들기
```bash
pnpm i next@latest react@latest react-dom@latest
pnpm add -D @types/react @types/react-dom typescript
```
- `-D` → `devDependencies`에 들어간다 (개발할 때만 필요)
- pnpm은 전체 설치는 `install`, 패키지 하나 추가는 `add` / npm은 둘 다 `install`

`package.json`에 스크립트 추가

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

### 경로 별칭
```json
"compilerOptions": {
  "paths": {
    "@/*": ["./src/*"]
  }
}
```
- 예전에는 `baseUrl`을 같이 썼지만 이제 사용 중단 예정이라 `paths`만 쓴다

### 기본 디렉토리
- `app` : App Router. `layout.tsx`, `page.tsx`가 들어감 (루트 page는 필수)
- `public` : 이미지 등 정적 파일. `/public/logo.png` → `/logo.png`로 참조
- `src` : 소스 코드를 루트 설정 파일들과 분리 (사용 권장)
- 설정 파일: `tsconfig.json`, `eslint.config.mjs`(최신 ESLint 설정 방식), `next.config.ts` 등

### 라우팅 파일
`layout`, `page`, `loading`, `not-found`, `error`, `global-error`, `route`, `template`, `default`

### 중첩 라우팅
- 폴더 하나 = URL 세그먼트 하나
- 폴더를 중첩하면 세그먼트도 중첩, 상위 레이아웃이 하위를 감싼다

### 동적 라우팅
| 형태 | 예시 URL | params | 세그먼트 없을 때 |
| --- | --- | --- | --- |
| `[id]` | `/posts/1` | `{ id: "1" }` | 404 |
| `[...slug]` | `/docs/a/b` | `{ slug: ["a", "b"] }` | 404 |
| `[[...slug]]` | `/shop` | `{ slug: undefined }` | 매칭됨 |

- 이 버전에서는 `params`가 Promise라서 `await` 해서 꺼낸다

```tsx
export default async function Page({ params }: PageProps<"/docs/[...slug]">) {
  const { slug } = await params;
}
```

### 업그레이드
```bash
pnpm next upgrade
```

---

## 1주차 (2026-09-02)

### Next.js
- React 기반 프레임워크
- 라우터 종류: Pages Router(기존 방식), App Router(최신, 이 저장소에서 사용)
- 기본 포트 `3000`

### pnpm
- npm, yarn과 같은 패키지 매니저
- 패키지를 전역 저장소에 한 번만 받아 두고, 프로젝트의 `node_modules`에는 **하드 링크**만 만든다
  - 디스크 공간 절약
  - 이미 받은 패키지는 재사용 → 설치·업데이트가 빠름

### 하드 링크
파일은 세 부분으로 나뉜다.
1. Directory Entry — 파일 이름 ↔ inode 번호
2. inode — 데이터 외의 메타데이터
3. Data Block — 실제 내용

- 하드 링크를 만들면 Directory Entry에 같은 inode를 가리키는 이름이 하나 더 생긴다
- 원본/사본 개념이 아니라 **완전히 같은 파일**
- 하나를 지워도 이름만 사라지고, 남은 링크가 있으면 데이터는 유지된다

### 프로젝트 생성
```bash
pnpm create next-app@latest my-app --yes   # 기본 설정
pnpm create next-app                       # 옵션 직접 선택
```
- 선택 옵션: TypeScript, Tailwind CSS, `src` 디렉토리(기본값 No), App Router, `@/*` 별칭, AGENTS.md 등
