import type { Metadata } from 'next';
import ClientLayout from '../../components/ClientLayout';
import { DynamicSchedulePage } from '../../components/DynamicComponents';

export const metadata: Metadata = {
  title: 'Schedule · Chris Harper',
  description: 'Grab a time to chat with Chris Harper about AI-assisted development and engineering.',
  alternates: { canonical: 'https://cloudcodetree.com/about/schedule/' },
};

export default function Schedule() {
  return (
    <ClientLayout>
      <DynamicSchedulePage />
    </ClientLayout>
  );
}
