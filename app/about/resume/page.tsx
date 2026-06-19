import type { Metadata } from 'next';
import ClientLayout from '../../components/ClientLayout';
import ResumePage from '../../components/ResumePage';

export const metadata: Metadata = {
  title: 'Resume · Chris Harper',
  description: 'Resume of Chris Harper — engineering leadership, cloud architecture, and AI-assisted development.',
  alternates: { canonical: 'https://cloudcodetree.com/about/resume/' },
};

export default function Resume() {
  return (
    <ClientLayout>
      <ResumePage />
    </ClientLayout>
  );
}
