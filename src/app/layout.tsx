import Link from "next/link";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeStatus from "@/components/ThemeStatus";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
        <header>
          <p>=== Root Layout Header ===</p>
          <ThemeStatus />
        </header>
        <nav>
          <Link href="/">Home</Link> |&nbsp;
          {/* Prefetched when the link is hovered or enters the viewport */}
          <Link href="/blog">Blog</Link> |&nbsp;
          <Link href="/blog2">Blog2</Link> |&nbsp;
          <Link href="/blog3">Blog3</Link> |&nbsp;
          {/* No prefetching */}
          <a href="/contact">Contact</a> |&nbsp;
          <Link href="/counter">Counter</Link>
          <br />
          <Link href="/interleaved">Interleaved</Link> |
          <br />
          <br />
          Slug Page Menu :&nbsp;
          <Link href="/nextjs">nextjs</Link>&nbsp;|&nbsp;
          <Link href="/routing">routing</Link>&nbsp;|&nbsp;
          <Link href="/ssr-ssg">ssr-sge</Link>&nbsp;|&nbsp;
          <Link href="/dynamic routes">dynamic routes</Link>
          <br />
        </nav>
        <br />
        <br />
        <main>{children}</main>
        <footer>--- Root Layout Footer ---</footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
