'use client';
import { FiLoader } from 'react-icons/fi';

interface LoadingMessageProps {
  message: string;
}

export default function LoadingMessage({ message }: LoadingMessageProps) {
  return (
    <div className="loading-container">
      <FiLoader className="animate-spin w-6 h-6 text-[var(--deep-purple)] dark:text-[var(--lavender)] mr-2" />
      <p className="loading-text">{message}</p>
    </div>
  );
}