export type TenantUser = {
  clerkId: string;
  name: string;
  email: string;
  role: "org:admin" | "org:member";
};
