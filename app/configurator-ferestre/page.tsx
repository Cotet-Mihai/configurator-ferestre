import { MOCK_PRODUCT } from '@/lib/configurator/mock-product';
import { ConfiguratorShell } from '@/components/configurator/ConfiguratorShell';

export default function ConfiguratorPage() {
  return <ConfiguratorShell product={MOCK_PRODUCT} />;
}
