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
  showCompleteCancel?: boolean;
  disabled?: boolean;
  actionLoading?: "complete" | "cancel" | null;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const StandardHeader3Buttons: React.FC<FormHeaderProps> = ({
  withButton = false,
  buttonName,
  title,
  description,
  loading,
  showCompleteCancel = false,
  disabled = false,
  actionLoading = null,
  onComplete,
  onCancel,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-300 ">
      {/* <div className="flex flex-row items-center justify-between mb-2"> */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <StandardFormTitle
          title={title}
          description={description}
        />
        {withButton ?
          (
            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
              {showCompleteCancel && (
                <>
                  <Button
                    variant="standard_3buttons"
                    type="button"
                    disabled={loading || disabled}
                    onClick={onComplete}
                    className="h-10 min-w-0 bg-teal-500 px-3 py-2 text-sm text-white hover:bg-teal-600"
                  >
                    {actionLoading === "complete" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete"}
                  </Button>
                  <Button
                    variant="standard_3buttons"
                    type="button"
                    disabled={loading || disabled}
                    onClick={onCancel}
                    className="h-10 min-w-0 bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                  >
                    {actionLoading === "cancel" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cancel Order"}
                  </Button>
                </>
              )}
              <Button
                variant="standard_3buttons"
                type="submit"
                disabled={loading || disabled}
                className="h-10 min-w-0 bg-orange-200 px-3 py-2 text-sm text-orange-900 hover:bg-orange-300"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : buttonName}
              </Button>
            </div>
          ) : null
        }
      </div>
    </div>
  );
};

export default StandardHeader3Buttons;
