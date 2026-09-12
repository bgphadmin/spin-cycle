import NotAllowed from '@/app/not-allowed'
import MachineSetupForm from '@/features/machines/components/MachineSetupForm'
import { getServerAuthClaims } from '@/utils/hooks/useAuthClaims'

const pages = async () => {
    const { orgRole } = await getServerAuthClaims()
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
