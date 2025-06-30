
import DocumentGrid from './DocumentGrid';

interface DealDocumentsProps {
  dealId: string;
}

const DealDocuments = ({ dealId }: DealDocumentsProps) => {
  return <DocumentGrid dealId={dealId} />;
};

export default DealDocuments;
