'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl font-bold mb-8 mt-48 text-white dark:text-white">
        Welcome to FlyNext
      </h1>
      <button
        className="bg-white text-black hover:bg-gray-300 dark:bg-white dark:text-black dark:hover:bg-gray-500 rounded-full px-6 py-3 text-lg font-semibold transition-colors"
        onClick={() => router.push("/search")}
      >
        Start planning your next trip!
      </button>
    </div>
  );
}