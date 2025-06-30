
import { ActivityTimeline } from './ActivityTimeline';

interface DealActivitiesProps {
  dealId: string;
}

const DealActivities = ({ dealId }: DealActivitiesProps) => {
  return <ActivityTimeline dealId={dealId} />;
};

export default DealActivities;
