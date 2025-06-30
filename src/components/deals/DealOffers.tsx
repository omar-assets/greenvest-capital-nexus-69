
import { OffersTab } from './OffersTab';

interface DealOffersProps {
  dealId: string;
}

const DealOffers = ({ dealId }: DealOffersProps) => {
  return <OffersTab dealId={dealId} />;
};

export default DealOffers;
