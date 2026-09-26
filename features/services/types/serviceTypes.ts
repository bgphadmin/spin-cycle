export type Service = {
  id: string;
  type: "WASH" | "DRY" | "OTHERS" | "FOLDS";
  name: string;
  price: number;
  duration: number | null;
};
