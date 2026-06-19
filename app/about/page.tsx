import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import HomePage from '../components/HomePage';

export const metadata: Metadata = {
  title: 'About · Chris Harper',
  description: 'Chris Harper — engineering team leader focused on AI-assisted development, custom models, and cloud/full-stack engineering.',
  alternates: { canonical: 'https://cloudcodetree.com/about/' },
  openGraph: {
    title: 'About · Chris Harper',
    description: 'Engineering team leader focused on AI-assisted development, custom models, and cloud/full-stack engineering.',
    url: 'https://cloudcodetree.com/about/',
    siteName: 'CloudCodeTree',
    type: 'profile',
  },
};

export default function About() {
  return (
    <ClientLayout>
      <HomePage />
    </ClientLayout>
  );
}
