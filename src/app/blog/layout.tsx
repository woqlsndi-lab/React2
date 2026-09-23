import Link from "next/link"

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header>--- Blog Layout Header ---</header>
        <nav>
          <Link href="/blog/nextjs">nextjs</Link> | <Link href="/blog/dynamic-routes">dynamic-routes</Link>
        </nav>
        <main>{children}</main>
        <footer>--- Blog Layout Footer ---</footer>
      </body>
    </html>
  )
}
