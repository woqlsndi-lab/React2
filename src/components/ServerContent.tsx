// @/components/ServerContent.tsx  (Server Component)

export default async function ServerContent() {
  const data = await fetch('https://jsonplaceholder.typicode.com/posts/').then(r => r.json());
  return (
    <p>서버에서 가져온 제목: {data[0].title}</p>
  );
}
