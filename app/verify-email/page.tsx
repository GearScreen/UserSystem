'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('No verification token provided');
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const response = await fetch(`/api/auth/verify-email?token=${token}`);
            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message);

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Verification failed');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An error occurred during verification');
        }
    };

    return (
        <div className= "min-h-screen flex items-center justify-center bg-gray-50" >
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8" >
            { status === 'verifying' && (
                <div className="text-center" >
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" > </div>
                        < h2 className = "text-2xl font-bold text-gray-900 mb-2" >
                            Verifying Your Email
                                </h2>
                                < p className = "text-gray-600" > Please wait...</p>
                                    </div>
        )
}

{
    status === 'success' && (
        <div className="text-center" >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" >
                <svg className="w-6 h-6 text-green-600" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24" >
                    <path strokeLinecap="round" strokeLinejoin = "round" strokeWidth = "2" d = "M5 13l4 4L19 7" > </path>
                        </svg>
                        </div>
                        < h2 className = "text-2xl font-bold text-gray-900 mb-2" >
                            Email Verified!
                                </h2>
                                < p className = "text-gray-600 mb-4" > { message } </p>
                                    < p className = "text-sm text-gray-500" >
                                        Redirecting to login page...
    </p>
        </div>
        )
}

{
    status === 'error' && (
        <div className="text-center" >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4" >
                <svg className="w-6 h-6 text-red-600" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24" >
                    <path strokeLinecap="round" strokeLinejoin = "round" strokeWidth = "2" d = "M6 18L18 6M6 6l12 12" > </path>
                        </svg>
                        </div>
                        < h2 className = "text-2xl font-bold text-gray-900 mb-2" >
                            Verification Failed
                                </h2>
                                < p className = "text-gray-600 mb-6" > { message } </p>
                                    < Link
    href = "/resend-verification"
    className = "inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
        Resend Verification Link
            </Link>
            </div>
        )
}
</div>
    </div>
  );
}