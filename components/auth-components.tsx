import { signIn, signOut } from "@/auth"

interface LoginButtonProps {
    provider: "github" | "google" | "credentials";
    credentials?: Record<string, string>;
}

export function SignIn({ provider, credentials }: LoginButtonProps) {
    return (
        <form
            action={async () => {
                "use server"; // This turns the function into a Server Action
                await signIn(provider, {
                    ...credentials,
                    callbackUrl: "/logged",
                });
            }}
        >
            <button
                type="submit" // onClick={handleLogin} // () => login(creditential)
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5
                        transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]">
                Login
            </button>
        </form>
    )
}

export function SignOut() {
    const handleLogin = async () => {
        await signOut();
    };

    return (
        <form
            action={async () => {
                "use server"; // This turns the function into a Server Action
                await signOut();
            }}
        >
            <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5
                        transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]">
            Logout
        </button>
        </form>
    )
}