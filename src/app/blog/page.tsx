import Link from "next/link"
import { posts } from "./posts"

export default function Page() {

  return (
    <div>
      <h1>블로그 목록</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
