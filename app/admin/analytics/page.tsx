import type { Metadata } from 'next';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'Demo analytics · CloudCodeTree',
  robots: { index: false, follow: false },
};

// Prerendered shell; every number is fetched client-side as the signed-in
// owner through owner_analytics(), which refuses anyone else at the database.
export default function AdminAnalyticsPage() {
  return <AnalyticsDashboard />;
}
