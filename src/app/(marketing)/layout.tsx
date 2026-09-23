export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>Marketing Layout Header</header>
      {children}
      <footer>Marketing Layout Footer</footer>
    </div>
  );
}
