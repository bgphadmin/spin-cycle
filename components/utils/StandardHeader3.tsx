'use client'

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
  onBack?: () => void;
}

export const StandardHeader3Buttons: React.FC<FormHeaderProps> = ({
  withButton = false,
  buttonName,
  title,
  description,
  loading,
  onBack,
}) => {

  return (
    <div className="flex flex-col gap-4 ">
      {/* <div className="flex flex-row items-center justify-between mb-2"> */}
      <div>
        {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"> */}
        <div className="min-w-0">
          <StandardFormTitle
            title={title}
            description={description}
          />
        </div>
        <div>
          {withButton ?
            (
              <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
                <Button
                  variant="standard_3buttons"
                  type="button"
                  onClick={onBack}
                  disabled={loading}
                  className="h-10 min-w-0 bg-gray-400 px-3 py-2 text-sm text-white hover:bg-gray-500"
                >
                  Back
                </Button>
                <Button
                  variant="standard_3buttons"
                  type="submit"
                  disabled={loading}
                  className="h-10 min-w-0 bg-orange-200 px-3 py-2 text-sm text-orange-900 hover:bg-orange-300"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : buttonName}
                </Button>
              </div>
            ) : null
          }
        </div>
      </div>
    </div>
  );
};

export default StandardHeader3Buttons;
