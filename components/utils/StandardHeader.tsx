import React from 'react';
import { Button } from '@/components/ui/button'; // Adjust paths based on your project
import { StandardFormTitle } from '../ui/custom/StandardTitle';
import { Loader2 } from 'lucide-react';


interface FormHeaderProps {
  withButton: boolean;
  buttonName: string;
  title: string;
  description: string;
  loading: boolean;
}

export const StandardHeader: React.FC<FormHeaderProps> = ({ withButton = false, buttonName, title, description, loading }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-300 pb-5 mb-6">
      {/* <div className="flex flex-row items-center justify-between mb-2"> */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <StandardFormTitle
          title={title}
          description={description}
        />
        {withButton ?
          (
            <Button variant="standard" type='submit'>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : buttonName}
            </Button>
          ) : null
        }
      </div>
    </div>
  );
};

export default StandardHeader;
