import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>=== Root Layout Header ===</header>
        <nav>
          <Link href="/">Home</Link> |&nbsp;
          {/* Prefetched when the link is hovered or enters the viewport */}
          <Link href="/blog">Blog</Link> |&nbsp;
          <Link href="/blog2">Blog2</Link> |&nbsp;
          <Link href="/blog3">Blog3</Link> |&nbsp;
          {/* No prefetching */}
          <a href="/contact">Contact</a>
        </nav>
        <main>{children}</main>
        <footer>--- Root Layout Footer ---</footer>
      </body>
    </html>
  );
}
