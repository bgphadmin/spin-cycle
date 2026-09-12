import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type DeleteButtonProps = Omit<ButtonProps, "children" | "type" | "variant"> & {
  loading?: boolean;
};

export function DeleteButton({
  loading = false,
  disabled,
  className,
  ...props
}: DeleteButtonProps) {
  return (
    <Button
      {...props}
      type="button"
      disabled={loading || disabled}
      variant="standard"
      className={`bg-orange-200 hover:bg-orange-300 ${className ?? ""}`}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
    </Button>
  );
}
