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
  onCancel: () => void
}

export const StandardHeader2: React.FC<FormHeaderProps> = ({ withButton = false, buttonName, title, description, loading, onCancel }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-300 pb-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <StandardFormTitle
          title={title}
          description={description}
        />
        {withButton ?
          (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className='bg-orange-200 hover:bg-orange-300' variant="standard" type="button" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button variant="standard" type='submit' >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : buttonName}
              </Button>
            </div>
          ) : null
        }
      </div>
    </div>
  );
};

export default StandardHeader2;
