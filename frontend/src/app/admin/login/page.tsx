import type { Metadata } from 'next';

import { LoginForm } from './LoginForm';


export const metadata: Metadata = {
  title: 'Вход в админку — Rahat Home',
  robots: { index: false, follow: false },
};


export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; reason?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm returnTo={params.returnTo} reason={params.reason} />;
}
