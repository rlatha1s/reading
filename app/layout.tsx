import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '함께 읽는 말씀 | 성경통독', description: '매일의 성경통독 인증과 함께하는 출석부' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="ko"><body>{children}</body></html>; }
