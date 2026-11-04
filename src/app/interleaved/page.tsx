// interleaved/page.tsx  (Server Component)

import ClientLayout from '@/components/ClientLayout';
import ServerContent from '@/components/ServerContent';

export default function Page() {
  return (
    <ClientLayout>
      <ServerContent />
    </ClientLayout>
  );
}
