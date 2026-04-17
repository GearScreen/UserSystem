'use client'

import Image from "next/image";
import Link from 'next/link';
import { useState, useEffect } from 'react'

export default function Register() {
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        username: ''
    })

    const tryRegister = async () => {
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newUser.email,
                    password: newUser.password,
                    username: newUser.username || undefined
                })
            })

            const data = await response.json()
            if (data.success) {
                alert('Account created successfully, please check your email to verify your account.')
                setNewUser({ email: '', password: '', username: '' })
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (error) {
            console.error('Error creating user:', error)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                {/* TITLE BLOCK */}
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                        Register Page
                    </h1>
                    <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium text-zinc-950 dark:text-zinc-50">Register your account</span><br></br>
                        {/* Using : Email, Password, Username */}
                    </p>
                    {/* FORM INPUTS */}
                    {/* Email */}
                    <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md" />
                    {/* Password */}
                    <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md" />
                    {/* Username */}
                    <input type="text" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md" />
                </div>
                {/* NAVIGATION */}
                <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
                    <Link className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background
                    transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                        href="/">
                        <Image
                            className="dark:invert"
                            src="/vercel.svg"
                            alt="Vercel logomark"
                            width={16}
                            height={16}
                        />
                        Main Page
                    </Link>
                    <Link className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background
                    transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                        href="/login">
                        Login
                    </Link>
                    <button
                        onClick={tryRegister}
                        disabled={!newUser.email}
                        className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors
                        hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]">
                        Register
                    </button>
                </div>
            </main>
        </div>
    );
}
