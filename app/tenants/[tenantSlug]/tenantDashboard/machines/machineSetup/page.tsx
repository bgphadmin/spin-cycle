import NotAllowed from '@/app/not-allowed'
import MachineSetupForm from '@/features/machines/components/MachineSetupForm'
import { getAuthContext } from "@/lib/auth";

const pages = async () => {
    const { orgRole } = await getAuthContext()
    if (orgRole !== "org:admin") {
        return (
            <NotAllowed />
        )
    }

    return (
        <main className="mx-auto w-full max-w-3xl px-6 pb-0 mb-24">
            <MachineSetupForm />
        </main>
    )
}

export default pages
