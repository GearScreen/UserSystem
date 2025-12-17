'use client'

import { useState } from 'react'

export default function TestDBPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const testConnection = async () => {
        setStatus('loading')
        try {
            const response = await fetch('/api/db/test')
            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage(data.message)
            } else {
                setStatus('error')
                setMessage(data.error)
            }
        } catch (error) {
            setStatus('error')
            setMessage('Connection failed')
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 text-black">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
                <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>

                <div className="space-y-4">
                    <button
                        onClick={testConnection}
                        disabled={status === 'loading'}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Testing...' : 'Test Connection'}
                    </button>

                    {status === 'success' && (
                        <div className="p-4 bg-green-100 text-green-800 rounded">
                            ✅ {message}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 bg-red-100 text-red-800 rounded">
                            ❌ {message}
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-gray-50 rounded">
                        <h2 className="font-semibold mb-2">Connection Details:</h2>
                        <pre className="text-sm">
                            Host: localhost:3306<br />
                            User: root<br />
                            Database: user_system-db
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}