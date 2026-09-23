import { posts } from "../posts"

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
  )
}
