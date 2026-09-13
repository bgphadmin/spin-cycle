import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Adjust paths based on your project
import { StandardFormTitle } from '../ui/custom/StandardTitle';

interface FormHeaderProps {
  href?: string;
  withButton: boolean;
  buttonName?: string;
  title: string | "";
  description?: string;
}

export const StandardHeaderHref: React.FC<FormHeaderProps> = ({ href, withButton = false, buttonName, title, description }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-300 pb-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <StandardFormTitle
          title={title}
          description={description}
        />
        {withButton && href ?
          (<Link href={href} passHref>
            <Button variant="standard" type="submit">
              {buttonName}
            </Button>
          </Link>) : null
        }
      </div>
    </div>
  );
};

export default StandardHeaderHref;
