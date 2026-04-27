import { auth } from "@/auth"
import { SignIn, SignOut } from "./auth-components"

import Image from "next/image";
import Link from 'next/link';

export default async function UserButton() {
    const session = await auth()
    if (session?.user) return <SignOut/>
    return (
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <Link className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors
            hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                href="/register">
                <Image
                    className="dark:invert"
                    src="/vercel.svg"
                    alt="Vercel logomark"
                    width={16}
                    height={16}
                />
                Register
            </Link>
            <Link className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors
            hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                href="/login">
                Login
            </Link>
        </div>
    )
}