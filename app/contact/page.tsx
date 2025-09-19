import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import { DynamicContactPage } from '../components/DynamicComponents';

export const metadata: Metadata = {
  title: 'Contact | Chris Harper',
  description: 'Get in touch with Chris Harper for consulting opportunities, technical leadership roles, or collaboration on enterprise cloud solutions.',
};

export default function Contact() {
  return (
    <ClientLayout>
      <DynamicContactPage />
    </ClientLayout>
  );
}