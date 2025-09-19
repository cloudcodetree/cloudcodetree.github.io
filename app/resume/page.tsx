import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import ResumePage from '../components/ResumePage';

export const metadata: Metadata = {
  title: 'Resume | Chris Harper',
  description: 'Professional resume of Chris Harper - Principal Software Engineering Manager with extensive experience in cloud architecture and team leadership.',
};

export default function Resume() {
  return (
    <ClientLayout>
      <ResumePage />
    </ClientLayout>
  );
}