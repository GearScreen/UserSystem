export interface CreateUserInput {
    email: string
    passwordHash: string
    username?: string
    role?: 'USER' | 'ADMIN' | 'MODERATOR'
}

export interface UpdateUserInput {
    username?: string
    passwordHash?: string
    role?: 'USER' | 'ADMIN' | 'MODERATOR'
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export interface UserResponse {
    id: number
    email: string
    username: string | null
    role: string
    status: string
    createdAt: Date
    updatedAt: Date
}