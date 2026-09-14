export type Service = {
  id: string;
  type: "WASH" | "DRY" | "OTHERS";
  name: string;
  price: number;
  duration: number | null;
};
