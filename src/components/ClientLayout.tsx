// @/components/ClientLayout.tsx  (Client Component)
'use client';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <h1>클라이언트 레이아웃</h1>
      <div className="content">
        {children} {/* <-- 이 부분이 "slot" */}
      </div>
    </div>
  );
}
