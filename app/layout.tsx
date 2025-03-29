import { ReactNode } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import {Providers} from "./providers";
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>
            <Navbar />
            <main className="container mx-auto p-4">{children}</main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
