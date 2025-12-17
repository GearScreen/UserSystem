export interface CreateUserInput {
    email: string
    name?: string
    role?: 'USER' | 'ADMIN' | 'MODERATOR'
}

export interface UpdateUserInput {
    name?: string
    role?: 'USER' | 'ADMIN' | 'MODERATOR'
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export interface UserResponse {
    id: number
    email: string
    name: string | null
    role: string
    status: string
    createdAt: Date
    updatedAt: Date
}

export interface PaginationParams {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}