import React from 'react';
import { Table2, LayoutGrid } from 'lucide-react'; // Assuming you are using lucide-react
import { Button } from '@/components/ui/button'; // Adjust path to your UI button

// Define allowed view states
export type ViewType = 'table' | 'cards';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  return (
    <div className="flex justify-end mb-1">
      <div className="inline-flex rounded-lg bg-muted p-1"> {/* Optional: added small padding standard for toggles */}
        <Button
          variant={view === "table" ? "secondary" : "ghost"}
          size="lg"
          className="h-8 px-3 shadow-none hover:cursor-pointer"
          onClick={() => onViewChange("table")}
          aria-label="Table view"
        >
          <Table2 className="h-4 w-4" />
        </Button>
        <Button
          variant={view === "cards" ? "secondary" : "ghost"}
          size="lg"
          className="h-8 px-3 shadow-none hover:cursor-pointer"
          onClick={() => onViewChange("cards")}
          aria-label="Cards view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ViewToggle;
