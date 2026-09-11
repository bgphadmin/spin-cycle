import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Adjust paths based on your project
import { StandardFormTitle } from '../ui/custom/StandardTitle';


interface FormHeaderProps {
  href: string;
}

export const StandardHeader: React.FC<FormHeaderProps> = ({ href }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-300 pb-5 mb-1">
      <div className="flex flex-row items-center justify-between">
        <StandardFormTitle
          title="Machines"
          description="View and manage all registered washers and dryers."
        />

        <Link href={href} passHref>
          <Button variant="standard">
            Add Machine
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default StandardHeader;
