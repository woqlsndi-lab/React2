# 202430134 천우성

Next.js(App Router) 수업 정리 및 실습 저장소

## 목차
- [실행 방법](#실행-방법)
- [실습 파일](#실습-파일)
- [6주차 (2026-10-07)](#6주차-2026-10-07) — generateStaticParams 실습, 느린 네트워크·프리페칭 비활성화, Bundle Analyzer, History API
- [5주차 (2026-09-30)](#5주차-2026-09-30) — Linking and Navigating, Prefetching, Core Web Vitals
- [4주차 (2026-09-23)](#4주차-2026-09-23) — 중첩 라우트, 동적 세그먼트, 중첩 레이아웃, searchParams
- [3주차 (2026-09-16)](#3주차-2026-09-16) — 라우트 그룹, 병렬·가로채기 라우팅, layout
- [2주차 (2026-09-09)](#2주차-2026-09-09) — 프로젝트 수동 생성, 폴더 구조, 동적 라우팅
- [1주차 (2026-09-02)](#1주차-2026-09-02) — Next.js, pnpm, 프로젝트 생성

## 실행 방법

```bash
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

## 실습 파일

```
src/app/
├ layout.tsx              // 루트 레이아웃 (Home | Blog | Blog2 | Blog3 | Contact 메뉴)
├ page.tsx                // /
├ (marketing)/
│ ├ layout.tsx
│ └ about/page.tsx        // /about
├ blog/
│ ├ layout.tsx            // 블로그 레이아웃
│ ├ page.tsx              // /blog         블로그 목록
│ ├ posts.tsx             // 더미 데이터
│ └ [slug]/page.tsx       // /blog/nextjs  블로그 상세
├ blog2/
│ ├ posts.tsx             // 더미 데이터
│ └ [slug]/page.tsx       // /blog2/nextjs  generateStaticParams 없이 런타임 처리
├ blog3/
│ ├ page.tsx              // /blog3         블로그 목록
│ ├ posts.tsx             // 더미 데이터
│ └ [slug]/page.tsx       // /blog3/nextjs  generateStaticParams로 빌드 시 정적 생성
├ contact/
│ └ page.tsx              // /contact  <a> 태그로 이동 (prefetch 없음)
└ products/
  └ page.tsx              // /products?id=123&name=foo
```

---

## 6주차 (2026-10-07)

### 1. generateStaticParams 실습 (`blog3`)
- 빌드할 때 Next.js가 `app/blog3/[slug]/page.tsx` 같은 동적 라우트를 찾으면 `generateStaticParams()`를 실행한다
- 반환값은 `[{ slug: "nextjs" }, { slug: "routing" }, ...]` 형태의 배열
- 각 params마다 `page.tsx`를 실행해서 정적 HTML을 만든다 → `/blog3/nextjs` 등

```tsx
import { notFound } from "next/navigation";
import { posts } from "../posts";

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();   // 없는 slug → 404 페이지
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

- `generateStaticParams()`는 slug 배열만 반환하고, 순회하며 HTML을 만드는 건 Next.js 빌드 과정이 한다
- `map`은 HTML을 만들 목록을 Next.js에 넘겨주는 역할
- `notFound()`를 호출하면 그 아래 코드는 실행되지 않아서, 이후 `post`는 undefined가 아닌 것으로 처리된다

| 항목 | generateStaticParams 없음 (`blog2`) | 있음 (`blog3`) |
| --- | --- | --- |
| 페이지 생성 시점 | 요청할 때 서버에서 생성 (SSR) | 빌드할 때 생성 (SSG) |
| 첫 로딩 속도 | 서버 렌더링이 필요해서 상대적으로 느림 | 정적 HTML이라 빠름 |
| SEO | 가능하지만 요청 시 생성 | 매우 유리 |
| 유연성 | slug 제한 없음 (DB 조회 등) | slug를 미리 알아야 함 |

### 2. await이 없어도 async를 붙이는 이유
1. **일관성**: 페이지마다 async 여부가 다르면 헷갈린다. 공식 문서 예시도 대부분 async function
2. **확장성**: 지금은 더미 데이터지만 나중에 `await fetch(...)`, DB 조회가 들어가도 수정할 필요가 없다
3. **Server Component 호환성**: Server Component는 Promise를 반환할 수 있고, async여도 오버헤드가 거의 없다

### 3. 전환이 느려지는 경우
- **느린 네트워크**: 클릭 전에 프리페치가 끝나지 않을 수 있다 → `useLinkStatus`로 로딩 표시

```tsx
'use client'
import { useLinkStatus } from 'next/link'

export default function LoadingIndicator() {
  const { pending } = useLinkStatus()
  return pending ? (
    <div role="status" aria-label="Loading" className="spinner" />
  ) : null
}
```

- 로딩 표시에 짧은 지연(예: 100ms)과 `opacity: 0` 시작을 주면 **디바운스** 효과 → 정말 오래 걸릴 때만 보인다
- **Hydration이 완료되지 않음**: `<Link>`는 클라이언트 컴포넌트라 하이드레이션이 끝나야 프리페치한다. 번들이 크면 늦어진다
  - Hydration: 서버가 만든 정적 HTML에 JavaScript(이벤트, 상태)를 연결해 상호작용 가능하게 만드는 과정

### 4. 프리페칭 비활성화
```tsx
<Link prefetch={false} href="/blog">Blog</Link>
```
- 무한 스크롤 테이블처럼 링크가 아주 많을 때 리소스 낭비를 막는다
- 단점: 정적 경로는 클릭할 때 가져오고, 동적 경로는 서버 렌더링을 기다려야 한다
- 절충안: 마우스를 올렸을 때만 프리페치

```tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'

function HoverPrefetchLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [active, setActive] = useState(false)
  return (
    <Link href={href} prefetch={active ? null : false} onMouseEnter={() => setActive(true)}>
      {children}
    </Link>
  )
}
```

### 5. Bundle Analyzer
```bash
pnpm add @next/bundle-analyzer
```

```ts
// next.config.ts
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
```
- `ANALYZE=true pnpm build`로 실행하면 번들 크기 리포트가 열린다 → 큰 의존성을 찾아 줄인다

### 6. 네이티브 History API
- `window.history.pushState`, `replaceState`로 새로고침 없이 주소 기록을 바꾼다 (`usePathname`, `useSearchParams`와 동기화됨)

| | pushState | replaceState |
| --- | --- | --- |
| 기록 스택 | 새 항목 추가 | 현재 항목 교체 |
| 뒤로 가기 | 가능 | 불가 |
| 예시 | 상품 목록 정렬 | 언어(Locale) 전환 |

### 7. Server / Client Components (다음 단원 시작)
- layout과 page는 기본적으로 **Server Component**
- **Client Component** (`'use client'`): state·이벤트 핸들러, `useEffect`, `localStorage`·`window` 같은 브라우저 API, 사용자 정의 Hook이 필요할 때
- **Server Component**: DB·API에서 데이터를 가져올 때, API key·token을 숨길 때, 브라우저로 보내는 JS를 줄이고 FCP를 개선할 때

---

## 5주차 (2026-09-30)

### 1. 네비게이션 작동 방식
- **Server Rendering**: 레이아웃과 페이지는 기본적으로 서버 컴포넌트로 렌더링된다
- **Prefetching**: `<Link>`로 연결된 경로는 화면에 보이거나 hover되면 미리 불러온다
  - 정적 경로는 전체, 동적 경로는 `loading.tsx`가 있을 때 일부만 prefetch
- **Streaming**: `loading.tsx`를 두면 페이지를 `<Suspense>`로 감싸 로딩 UI를 먼저 보여준다
- **Client-side transitions**: 전체 페이지를 다시 불러오지 않고 공유 레이아웃과 상태를 유지한 채 내용만 바꾼다

### 2. `<Link>` vs `<a>`
루트 레이아웃(`layout.tsx`) 메뉴에 Contact를 추가하면서, Blog는 `<Link>`, Contact는 일부러 `<a>`로 연결해 차이를 비교했다.

```tsx
<nav>
  <Link href="/">Home</Link> |&nbsp;
  {/* Prefetched when the link is hovered or enters the viewport */}
  <Link href="/blog">Blog</Link> |&nbsp;
  {/* No prefetching */}
  <a href="/contact">Contact</a>
</nav>
```

| | `<Link>` | `<a>` |
| --- | --- | --- |
| Prefetch | O (화면에 보이거나 hover 시) | X |
| 이동 방식 | 클라이언트 전환 (새로고침 없음) | 전체 페이지 새로고침 |
| 레이아웃·상태 | 유지 | 초기화 |

- 내부 페이지 이동은 `<a>` 대신 `<Link>`를 사용한다 (ESLint `no-html-link-for-pages` 경고)
- 외부 링크나 `target` 같은 속성이 필요할 때만 `<a>`를 쓴다
- `contact/page.tsx`는 `<a>`로 이동했을 때 확인용 페이지 (`Contact Page - No prefetching`)

### 3. Core Web Vitals
- 예전 지표: TTFB(첫 바이트), FCP(첫 콘텐츠 표시), TTI(상호작용 가능)
- 핵심 지표: **LCP**(가장 큰 요소 표시 시간), **FID**(첫 입력 지연), **CLS**(레이아웃 이동 정도)
  - 2024년부터 FID 대신 **INP**(상호작용 후 다음 화면이 그려지기까지의 시간)가 핵심 지표가 되었다
- 레이아웃 이동 원인: 크기 없는 이미지, 크기가 정해지지 않은 광고·iframe, 동적 콘텐츠
- Prefetch와 Streaming은 이동한 페이지의 FCP·LCP를 줄여 준다

### 4. devIndicators
- 개발 모드 화면의 N 아이콘. 현재 경로가 정적(○)인지 동적(ƒ)인지 등을 알려준다
- 위치는 `next.config.ts`의 `devIndicators.position`이나 아이콘의 Preferences에서 바꾼다 (기본값 `bottom-left`)
- Next.js 15.2부터 `position` 옵션이 생기고 `appIsrStatus`, `buildActivity` 등은 사용 중단

```ts
const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right", // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  },
  // devIndicators: false,   // 아이콘 숨기기 (오류 표시는 그대로 나온다)
};
```

### 5. generateStaticParams
- 쓰면 빌드 시점에 동적 경로를 정적 HTML로 미리 생성하고, 안 쓰면 요청할 때마다 서버에서 처리한다
- 자주 바뀌지 않는 페이지는 사용 권장, 사용자 입력·DB 조회가 필요하면 런타임 처리

```tsx
// 사용하면 → 빌드할 때 slug 목록만큼 페이지를 미리 생성
export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}
```

`blog2/[slug]/page.tsx` — `generateStaticParams` 없이 요청이 올 때 처리하는 예제

```tsx
import { posts } from "../posts";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return <h1>포스트를 찾을 수 없습니다.</h1>;
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

- 더미 데이터(`blog2/posts.tsx`): `nextjs`, `routing`, `ssr-ssg`, `dynamic-routes` 4개
- `/blog2/nextjs` → 해당 글 표시, 없는 slug → "포스트를 찾을 수 없습니다."
- 4주차 `blog`는 `PageProps<"/blog/[slug]">` 타입을 썼고, 여기서는 `params` 타입을 직접 `Promise<{ slug: string }>`로 적었다

---

## 4주차 (2026-09-23)

### 1. 중첩 라우트 (Nested Route)
- 폴더를 중첩하면 경로도 중첩된다
- 게시글별 경로가 필요하면 `blog` 안에 `[slug]` 폴더를 만들고 `page.tsx`를 추가
- `blog/page.tsx`는 목록, `blog/[slug]/page.tsx`는 상세 페이지 역할을 맡는 게 일반적이다

### 2. 동적 세그먼트 `[slug]`
- 폴더 이름을 대괄호로 감싸면 **동적 세그먼트**가 된다
- 하나의 `page.tsx`로 데이터 개수만큼 페이지를 만들 수 있다 (게시글, 상품 상세 등)
- URL 값은 `params`로 전달된다 → `/blog/nextjs`면 `slug`는 `"nextjs"`

더미 데이터 (`blog/posts.tsx`)

```tsx
export const posts = [
  { slug: "nextjs", title: "Next.js 소개", content: "..." },
  { slug: "routing", title: "App Router 알아보기", content: "..." },
];
```

목록 페이지 (`blog/page.tsx`) — `map`으로 링크 목록 출력

```tsx
<ul>
  {posts.map((post) => (
    <li key={post.slug}>
      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
    </li>
  ))}
</ul>
```

상세 페이지 (`blog/[slug]/page.tsx`)

```tsx
export default async function Posts({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;   // params 해제
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return <h1>게시글을 찾을 수 없습니다!</h1>;
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

- `params`는 **Promise** → `async` 함수 안에서 `await`로 꺼낸다
- `const { slug } = await params`는 아래와 같은 의미 (구조 분해 할당)
  ```tsx
  const resolved = await params;
  const slug = resolved.slug;
  ```
- 타입에 Promise를 명시해 두면 `await`를 빼먹었을 때 TypeScript가 잡아준다
- 데이터가 많아지면 `.find()`(O(n)) 대신 DB 쿼리로 바꿔야 한다

### 3. 중첩 레이아웃 (Nesting Layouts)
- `blog/layout.tsx`를 만들면 `/blog` 아래 모든 페이지에 적용된다
- 루트 레이아웃이 블로그 레이아웃을 감싸고, 블로그 레이아웃이 목록·상세 페이지를 감싼다

```
Root Layout Header
  Blog Layout Header
    page 내용
  Blog Layout Footer
Root Layout Footer
```

> `<html>`, `<body>`는 **루트 레이아웃에만** 쓴다. 중첩 레이아웃에 또 넣으면
> `<main> cannot contain a nested <html>` 오류가 난다 → 중첩 레이아웃은 `<div>` 등으로 감싸기

### 4. Link 컴포넌트
- `next/link`의 `<Link>`로 새로고침 없이 페이지 이동
- 레이아웃의 `<nav>`에 넣으면 하위 모든 페이지의 공통 메뉴가 된다

```tsx
<nav>
  <Link href="/">Home</Link> | <Link href="/blog">Blog</Link>
</nav>
```

### 5. searchParams (검색 매개변수)
- URL의 **쿼리 문자열**을 읽는 방법 → `/products?id=123&name=foo`
- 페이지 컴포넌트의 props로 전달되며, `params`처럼 **Promise**

```tsx
export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string; name?: string }>
}) {
  const { id = "non id", name = "non name" } = await searchParams;
  return (
    <div>
      <h1>Products Page</h1>
      <p>id : {id}</p>
      <p>name : {name}</p>
    </div>
  )
}
```

- `= "non id"`처럼 구조 분해할 때 **기본값**을 지정할 수 있다 (쿼리가 없을 때 사용)

| | params | searchParams |
| --- | --- | --- |
| 가져오는 곳 | 동적 세그먼트 `[slug]` | 쿼리 문자열 `?key=value` |
| 예시 | `/blog/nextjs` | `/products?id=123` |

- 클라이언트 컴포넌트에서는 `useSearchParams()` 훅을 사용

### 6. 정적 렌더링 vs 동적 렌더링
- `searchParams`는 요청이 와야 값을 알 수 있어서, 사용하는 순간 그 페이지는 **동적 렌더링**이 된다

| | 정적 (Static) | 동적 (Dynamic) |
| --- | --- | --- |
| 예시 | `/about`, `/blog` | `/products?page=2` |
| 생성 시점 | 빌드 시 미리 생성 | 요청 시 생성 |
| 특징 | 빠름, 캐시 가능 | 유연함, 요청마다 다른 응답 |

### 7. React vs Next.js 라우팅
| | React | Next.js |
| --- | --- | --- |
| 방식 | 코드에서 `<Route>`로 직접 정의 | 폴더·파일 구조로 자동 생성 |
| 도구 | `react-router-dom` 등 외부 라이브러리 | 내장 파일 기반 라우팅 |

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
