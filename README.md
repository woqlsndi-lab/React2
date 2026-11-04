# 202430134 천우성

Next.js(App Router) 수업 정리 및 실습 저장소

## 목차
- [실행 방법](#실행-방법)
- [실습 파일](#실습-파일)
- [9주차 (2026-11-04)](#9주차-2026-11-04) — Server → Client 데이터 전달·직렬화, Interleaving(ClientLayout + ServerContent), Context / Context provider(테마 토글)
- [8주차 (2026-10-28)](#8주차-2026-10-28) — src 디렉토리 관리, Server → Client props 전달, LikeButton 낙관적 업데이트, JS 번들 크기 줄이기
- [7주차 (2026-10-14)](#7주차-2026-10-14) — Server / Client Components, RSC Payload, Hydration, Falsy, 낙관적·비관적 업데이트
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
src/
├ components/
│ ├ Counter.tsx           // 'use client' 카운터 컴포넌트
│ ├ ClientLayout.tsx      // 'use client' children 슬롯을 가진 레이아웃 (interleaving)
│ ├ ServerContent.tsx     // Server Component, jsonplaceholder에서 데이터 fetch
│ ├ ThemeProvider.tsx     // 'use client' ThemeContext + theme 상태/toggle 제공
│ └ ThemeStatus.tsx       // 'use client' useContext로 테마 토글 버튼
├ lib/
│ └ data.tsx              // posts 더미 데이터 (id, likes, title, content)
├ ui/
│ └ LikeButton.tsx        // 'use client' 좋아요 버튼 (낙관적 업데이트)
└ app/

src/app/
├ layout.tsx              // 루트 레이아웃 (ThemeProvider로 감쌈, ThemeStatus 버튼, 메뉴 + Interleaved 링크)
├ globals.css             // html[data-theme='light'|'dark'] 테마 스타일
├ page.tsx                // /
├ [id]/page.tsx           // /nextjs  post 제목 + LikeButton
├ counter/page.tsx        // /counter  Counter 컴포넌트 호출
├ interleaved/page.tsx    // /interleaved  <ClientLayout><ServerContent /></ClientLayout>
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

## 9주차 (2026-11-04)

### 1. Server → Client로 데이터 전달 (props)
- props를 사용해 Server Component에서 Client Component로 데이터를 전달한다 (8주차 `<LikeButton likes={post.likes} />`)
- 다른 방법으로 **`use` Hook**을 쓰면 Server → Client로 데이터를 스트리밍할 수도 있다 (Fetching Data 단원에서 다룸)
- Client Component에 넘기는 props는 React로 **직렬화(serialization)** 가능해야 한다
  - 직렬화: 메모리의 복잡한 데이터(객체·배열 등)를 바이트의 연속 형태로 바꾸는 과정 → 파일 저장·네트워크 전송이 쉬워진다
  - React/Next.js는 컴포넌트 트리를 서버에서 직렬화해 클라이언트로 보내고, 클라이언트에서 역직렬화한다

### 2. Server / Client Component 인터리빙 (Interleaving)
- 인터리빙은 원래 데이터를 섞어서 전송해 버스트 오류의 영향을 줄이는 통신 기술이고, 문서에서는 Server·Client Component가 **섞여서 동작하는 패턴**을 말한다
- Server 안에 Client를 넣을 수는 있지만, **Client 안에서 Server Component를 직접 import하는 것은 불가능**하다
- 그래서 Client Component가 **껍데기 역할**을 하고, `children` 슬롯에 Server Component를 **끼워 넣는다** (문서 예: `<Modal>` 안에 `<Cart>`)

```tsx
// src/app/interleaved/page.tsx (Server Component)
export default function Page() {
  return (
    <ClientLayout>       {/* 'use client', {children} 자리가 slot */}
      <ServerContent />  {/* async, 서버에서 fetch */}
    </ClientLayout>
  );
}
```

- 동작 과정
  1. `ServerContent`를 서버에서 렌더링 → HTML로 변환
  2. 이 HTML을 `ClientLayout`의 `{children}` 자리에 끼워 넣음
  3. 클라이언트에서는 `ClientLayout`만 hydration(JS 연결)
  4. 서버 데이터는 이미 들어와 있고, 버튼·이벤트는 Client Component가 처리한다
- `ServerContent`는 [JSONPlaceholder](https://jsonplaceholder.typicode.com)(테스트용 가짜 REST API)의 `/posts/`를 가져와 `data[0].title`을 출력한다
  - 리소스: `/posts`, `/comments`, `/albums`, `/photos`, `/todos`, `/users` / `GET`·`POST`·`PUT`·`PATCH`·`DELETE` 모두 지원

### 3. Context란?
- React의 **Context API**로 컴포넌트 사이에 데이터를 공유하는 방법이다
  - **전역 상태 관리**: 사용자 정보, 테마 설정처럼 앱 전체에서 쓰는 데이터를 한곳에서 관리한다
  - **props drilling 해결**: 트리가 깊어져도 props를 계속 넘기지 않고 필요한 컴포넌트에서 바로 꺼내 쓴다
  - React 기능이라 React 공식 문서에 더 자세한 설명이 있다
- `createContext()`로 Context를 만들고, `<MyContext.Provider value=...>`로 값을 제공하고, `useContext(MyContext)`로 꺼내 쓴다

### 4. Context provider
- **Server Component에서는 React Context를 쓸 수 없다**
- 그래서 `children`을 받는 Client Component(Provider)를 만들고, Server Component인 `layout`에서 감싼다
- 문서 예제(`value="dark"` 고정)는 변화가 눈에 안 보여서, theme 상태와 toggle 버튼을 추가해 실습했다
  - `ThemeProvider`: theme state·`toggleTheme`을 제공하고 `document`에 `data-theme`을 설정한다
  - `ThemeStatus`: `useContext(ThemeContext)`로 꺼내 토글 버튼을 보여준다
  - `layout.tsx`: `<body>` 안 전체를 `<ThemeProvider>`로 감싸고 header에 `<ThemeStatus />`를 넣는다
  - `globals.css`: `html[data-theme='light'|'dark']`에 따라 배경색·글자색을 바꾼다

```tsx
export const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  toggleTheme: () => void
}>({
  theme: 'light',
  toggleTheme: () => { },
})
```

- `<{...}>`는 타입 부분이다 → theme은 `'light' | 'dark'`, toggleTheme은 인자·반환값이 없는 함수
- 초기값은 **Provider가 없을 때 쓰는 fallback 값**이다. `createContext()`에는 기본값이 반드시 있어야 해서 보통 빈 함수(`() => {}`)를 넣고, 실제 동작은 `ThemeProvider`에서 설정한다
- 슬라이드는 `'./theme-provider'`로 import하지만 파일명이 `ThemeProvider.tsx`라 `'./ThemeProvider'`로 맞춰야 에러가 나지 않는다

---

## 8주차 (2026-10-28)

### 1. src 디렉토리 관리
- 공식 문서는 `/app/ui/counter.tsx`에 작성했지만, `src` 디렉토리를 쓰는 경우 다음과 같이 관리하는 것이 일반적이다
  - `src/app/` 아래에는 **라우팅 페이지**만 작성한다
  - 그 외 사용자 정의 component나 library는 `src/` 아래(`src/components`, `src/lib`, `src/ui`)에 작성한다
- `@/*` → `./src/*` 경로 별칭 덕분에 `@/components/Counter`처럼 import한다
- `page.tsx`는 Server Component지만 `<Counter />` 같은 Client Component를 그대로 렌더링할 수 있다 (`/counter`)

### 2. Server → Client로 데이터 전달 (like button)
- Server Component(`[id]/page.tsx`)가 데이터를 찾고, `likes`를 **props**로 Client Component(`<LikeButton>`)에 넘긴다
- 클라이언트 상호작용(클릭)은 `LikeButton`만 담당한다
- 공식 문서는 `getPost(id)`를 쓰지만, 실습에서는 직접 만든 더미 데이터(`src/lib/data.tsx`)에서 찾는다

```tsx
// src/lib/data.tsx
// dummy data

export const posts = [
  { id: "nextjs", likes: 5, title: "Next.js 소개", content: "Next.js는 React 기반의 풀스택 프레임워크입니다." },
  { id: "routing", likes: 3, title: "App Router 알아보기", content: "Next.js 13부터는 App Router가 도입되었습니다." },
  { id: "ssr-ssg", likes: 0, title: "SSR vs SSG", content: "서버사이드 렌더링과 정적 사이트 생성의 차이를 알아봅니다." },
  { id: "dynamic routes", likes: 0, title: "동적 라우팅", content: "Next.js에서 [slug]를 활용한 라우팅 방식입니다." },
];
```

```tsx
// src/app/[id]/page.tsx
import LikeButton from '@/ui/LikeButton'
import { posts } from '@/lib/data'
import { notFound } from 'next/navigation'

export default async function PostPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  // getPost 대신 직접 posts 배열에서 찾는다
  const post = posts.find((p) => p.id === id);

  if (!post) {
    notFound();   // 없는 id → 404 페이지
  }

  return (
    <>
      <main>
        <h1>{post.title}</h1>
        <LikeButton likes={post.likes} />
      </main>
    </>
  )
}
```
- 감싸는 `<div>` 대신 Fragment(`<>...</>`)를 써서 불필요한 DOM을 줄인다

### 3. LikeButton — 낙관적 업데이트 (`src/ui/LikeButton.tsx`)
- 서버 응답을 기다리지 않고 `setCount`로 UI를 먼저 바꾼다 (7주차 낙관적 업데이트)
- `likes ?? 0` → props가 `null`/`undefined`이면 0으로 시작 (NULL 병합 연산자)
- `isLiking` 동안 버튼을 `disabled`로 막아 중복 클릭을 방지한다. 실습에서는 3초(`3000`)로 늘려 눈으로 확인했다

```tsx
'use client'

import { useState } from 'react'

export default function LikeButton({ likes }: { likes: number }) {
  // Optimistic Updates(낙관적 업데이트)
  const [count, setCount] = useState<number>(likes ?? 0)
  const [isLiking, setIsLiking] = useState(false)

  const handleClick = async () => {
    // 낙관적 업데이트
    setIsLiking(true)
    setCount((c) => c + 1)

    // 실제 저장 로직(API 호출 등)이 있다면 이곳에서 호출한다
    // 예: await fetch('/api/like', { method: 'POST', body: JSON.stringify({ id }) })

    // 예제에서는 짧은 시연 후 버튼 상태만 해제한다
    setTimeout(() => setIsLiking(false), 3000)
  }

  return (
    <button onClick={handleClick} disabled={isLiking} aria-pressed={false}>
      👍 {count}
    </button>
  )
}
```

| 파일 | 종류 | 역할 |
| --- | --- | --- |
| `app/[id]/page.tsx` | Server Component | id로 post 찾기, `notFound()`, likes를 props로 전달 |
| `lib/data.tsx` | 데이터 | 더미 posts 배열 |
| `ui/LikeButton.tsx` | Client Component | 클릭 시 좋아요 수 즉시 증가 |

### 4. JS 번들 크기 줄이기
- 클라이언트 JS 번들을 줄이려면 UI의 큰 부분을 Client Component로 만들지 말고, **대화형 컴포넌트에만** `'use client'`를 붙인다
- `'use client'` 파일이 import하고 렌더링하는 컴포넌트는 모두 클라이언트 번들에 포함된다. 단, children·props로 전달된 Server Component는 서버에서 렌더링된다
- 예: `<Layout>`은 로고·탐색 링크 같은 정적 요소가 대부분이고 검색창만 대화형이다
  - `<Search />`는 사용자와 바로 상호작용하므로 Client Component
  - `<Logo />`는 상대적으로 덜 중요하고 이미지 등 용량이 크므로 Server Component
  - **나머지 layout은 Server Component로 유지한다**

```tsx
// app/layout.tsx
// Client Component
import Search from './search'
// Server Component
import Logo from './logo'

// Layout is a Server Component by default
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav>
        <Logo />
        <Search />
      </nav>
      <main>{children}</main>
    </>
  )
}
```

```tsx
// app/ui/search.tsx
'use client'

export default function Search() {
  // ...
}
```

---

## 7주차 (2026-10-14)

### 1. Client Component 사용
- 파일 맨 위, import 문 위에 `"use client"` 지시문을 추가하면 Client Component가 된다
- `"use client"`는 Server와 Client 모듈 트리 사이의 **경계**를 선언한다 → 그 파일에서 import하는 모듈도 클라이언트 번들에 포함된다

```tsx
"use client";

import { useState } from "react";

export default function LikeButton({ like }: { like?: number }) {
  const [count, setCount] = useState<number>(like ?? 0);
  return <button onClick={() => setCount(count + 1)}>♥ {count}</button>;
}
```

### 2. Server / Client Component는 어떻게 동작하나
**Server Component의 작동**
- Next.js는 서버에서 React의 API를 사용해 렌더링을 조율한다
- 렌더링 작업은 개별 라우트 세그먼트별 묶음으로 나뉜다
- Server Component는 **RSC Payload**(React Server Component Payload)라는 특수한 데이터 형식으로 렌더링된다
- Client Component와 RSC Payload를 사용해 HTML을 미리 렌더링한다

**Client Component의 작동 (첫 로드)**
- **HTML**: 경로의 비대화형 미리보기를 즉시 보여준다
- **RSC Payload**: Client와 Server Component 트리를 조정(reconcile)한다
- **JS**: Client Component를 하이드레이션해서 애플리케이션을 대화형으로 만든다

**Hydration**
- 이벤트 핸들러를 DOM에 연결해 정적 HTML을 인터랙티브하게 만드는 React의 프로세스

| | JSON | Binary (RSC) |
| --- | --- | --- |
| 크기 | 크다 | 작다 |
| 파싱 속도 | 느리다 | 빠르다 |
| 구조 표현력 | 문자열, 숫자, 불리언, 객체, 배열, null | 이미지·오디오·비디오, 구조화된 컴파일 데이터 등 제한 없음 |

### 3. Server / Client Component를 사용하는 시기
- **Client Component**
  - state와 이벤트 핸들러 (`onClick`, `onChange`)
  - 생명주기 로직 (`useEffect`)
  - 브라우저 전용 API (`localStorage`, `window`, `Navigator.geolocation` 등)
  - 사용자 정의 Hook
- **Server Component**
  - 서버의 DB나 API에서 데이터를 가져올 때
  - API key, token 같은 보안 데이터를 클라이언트에 노출하지 않고 쓸 때
  - 브라우저로 전송되는 JS 양을 줄이고 싶을 때
  - FCP(First Contentful Paint)를 개선하고 콘텐츠를 클라이언트에 점진적으로 스트리밍할 때

### 4. Falsy
- Boolean이 필요한 맥락(조건문, 논리 연산 등)에서 `false`로 평가되는 값
- `false` 하나만이 아니라 false에 해당하는 여러 값을 포괄하는 개념

| 값 | 설명 |
| --- | --- |
| `false` | 불리언 false 값 자체 |
| `0` | 숫자 0 |
| `""` | 빈 문자열 |
| `null` | 값이 없음을 의도적으로 명시 (개발자가 할당) |
| `undefined` | 값이 할당되지 않음 (시스템이 자동 부여) |
| `NaN` | Not-a-Number, 숫자가 아님 |

### 5. NULL 병합 연산자 `??`
- 왼쪽 피연산자가 `null` 또는 `undefined`이면 오른쪽 값을, 아니면 왼쪽 값을 반환한다
- `||`와 달리 `0`, `""`는 그대로 유지된다 → `like`가 `0`이어도 `0`으로 시작

```tsx
const [count, setCount] = useState<number>(like ?? 0);
```

### 6. 비관적 업데이트 (Pessimistic Update)
- 이벤트가 발생하면 먼저 서버에 요청을 보내고, 성공 응답을 받은 후에 UI를 업데이트한다 (일반적인 방식)
- 장점: 서버 응답을 기반으로 하므로 데이터 일관성이 보장되고, 잘못된 정보가 표시될 염려가 없다
- 단점: 서버 응답을 기다려야 해서 응답이 늦거나 네트워크가 지연되면 체감 속도가 느려진다

### 7. 낙관적 업데이트 (Optimistic Update)
- 이벤트(예: 좋아요 버튼 클릭)가 발생하면 서버 응답을 기다리지 않고 UI를 즉시 변경한 후 서버에 요청을 보낸다
- 요청이 성공한다고 **낙관**해서 먼저 화면에 변화를 보여주고, 실패하면 원래 상태로 **롤백**한다
- 목적: 네트워크 지연 동안에도 앱이 빠르게 반응하는 것처럼 느끼게 한다
- 장점: 서버 응답 속도와 관계없이 즉각적인 피드백 → 네트워크가 느려도 체감 속도가 빠르다
- 단점: 오류가 나면 잠시 잘못된 정보가 보일 수 있고, 복구(롤백) 로직이 필요하다

| | 비관적 업데이트 | 낙관적 업데이트 |
| --- | --- | --- |
| UI 변경 시점 | 서버 응답 후 | 요청 즉시 |
| 데이터 일관성 | 보장 | 잠시 어긋날 수 있음 |
| 체감 속도 | 느림 | 빠름 |
| 오류 처리 | 단순 | 롤백 로직 필요 |

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
