import Image from "next/image";
import { auth } from "@/auth"
import UserButton from "@/components/user-button"

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        {/* TITLE BLOCK */}
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Thedas User System
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Features : <br></br>
            -Register <br></br>
            -Login + Session <br></br>
            -Account Settings + Logout <br></br>
            -Security : hash, salt, 2FA, IP Lockout <br></br>
          </p>
        </div>
        {/* SESSION */}
        <div className="flex flex-col rounded-md bg-gray-100">
          <div className="rounded-t-md bg-gray-200 p-4 font-bold text-black">
            Current Session
          </div>
          <pre className="whitespace-pre-wrap break-all px-4 py-6 text-black">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
        {/* NAVIGATION */}
        <UserButton></UserButton>
      </main>
    </div>
  );
}
