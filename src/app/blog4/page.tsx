import Posts from '@/components/posts'
import { Suspense } from 'react'
import getPosts from '@/lib/getPosts'

export default function Page() {
  // Don't await the data fetching function
  const posts = getPosts('https://jsonplaceholder.typicode.com/posts')

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Posts posts={posts} />
    </Suspense>
  )
}
