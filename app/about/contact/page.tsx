import type { Metadata } from 'next';
import ClientLayout from '../../components/ClientLayout';
import { DynamicContactPage } from '../../components/DynamicComponents';

export const metadata: Metadata = {
  title: 'Contact · Chris Harper',
  description: 'Get in touch with Chris Harper about AI-assisted development, cloud, or full-stack engineering.',
  alternates: { canonical: 'https://cloudcodetree.com/about/contact/' },
};

export default function Contact() {
  return (
    <ClientLayout>
      <DynamicContactPage />
    </ClientLayout>
  );
}
