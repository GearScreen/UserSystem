'use client'

import { useSession } from "next-auth/react"
import { useState, useEffect } from 'react'
import Image from "next/image";
import Link from 'next/link';

export default function Home() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<any>(null)
    const [err, setErr] = useState<any>(null)

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/users/stats')
            const data = await response.json()
            // console.log('Stats data:', data)

            if (data.success) {
                setStats(data)
            } else {
                setErr(data.error)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    // Start
    useEffect(() => {
        fetchStats()
    }, []);

    useEffect(() => {
        console.log('Stats updated:', stats)
        console.log('data:', stats?.data)
        console.log('summary:', stats?.activeUsers)
    }, [stats])

    return (
        <>
            {session?.user ? (
                <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
                    <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-32 px-16 bg-white dark:bg-black sm:items-start">
                        {/* TITLE BLOCK */}
                        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                                Logged in Page
                            </h1>
                            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                                Do Stuff as a logged in user
                            </p>
                        </div>

                        {/* GLOBAL STATS DISPLAY */}
                        <h2 style={{ paddingTop: '10%' }}>Global Stats :</h2>
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-black" style={{ paddingTop: '5%' }}>
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <div className="text-sm text-gray-500">Total Users</div>
                                    <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <div className="text-sm text-gray-500">Active Users</div>
                                    <div className="text-2xl font-bold text-green-600">{stats.activeUsers || 0}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <div className="text-sm text-gray-500">Admins</div>
                                    <div className="text-2xl font-bold text-blue-600">{stats.admins || 0}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <div className="text-sm text-gray-500">Active %</div>
                                    <div className="text-2xl font-bold">{stats.summary?.activePercentage || 0}%</div>
                                </div>
                            </div>
                        )}
                        {err && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" style={{ paddingTop: '5%' }}>
                                {err}
                            </div>)}

                        {/* ACCOUNT SETTINGS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" style={{ paddingTop: '5%' }}>
                            <h2 style={{ paddingTop: '10%' }}>Account Settings</h2>
                            <h2>Change Password</h2>
                        </div>

                        {/* NAVIGATION */}
                        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row" style={{ paddingTop: '10%' }}>
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
                            <Link className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08]
                    px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                                href="/login">
                                Logout
                            </Link>
                        </div>

                    </main>
                </div>
            ) : (
                <Link className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08]
                    px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                    href="/login">
                    Login before accessing this page
                </Link>
            )}
        </>
    );
}