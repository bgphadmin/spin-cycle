import { syncStaffToTenant } from "@/features/pos/actions";

const PosPage = async () => {
  await syncStaffToTenant(); // ensures staff is saved in Supabase
  return (
    <div>
      <h1>POS Page</h1>
    </div>
  )
}

export default PosPage
