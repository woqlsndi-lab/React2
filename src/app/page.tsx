import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1>Root Page</h1>
      <Link href="/blog">Go to Blog</Link>
    </div>
  );
}
