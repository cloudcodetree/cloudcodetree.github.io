import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import { DynamicSchedulePage } from '../components/DynamicComponents';

export const metadata: Metadata = {
  title: 'Schedule | Chris Harper',
  description: 'Schedule a consultation with Chris Harper to discuss your enterprise technology needs, cloud architecture, or team leadership challenges.',
};

export default function Schedule() {
  return (
    <ClientLayout>
      <DynamicSchedulePage />
    </ClientLayout>
  );
}