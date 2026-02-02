import { describe, test, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios')

// Import after mocking
import { signUp, signIn, getDetails } from '../../app/services/user'

describe('User Service', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('signUp', () => {
        test('should return token on successful signup', async () => {
            vi.mocked(axios.post).mockResolvedValueOnce({
                data: { token: 'new-token', user: 'user-id' }
            })

            const result = await signUp({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            })

            expect(result.token).toBe('new-token')
            expect(result.error).toBeUndefined()
        })

        test('should return error on failed signup', async () => {
            const mockError = {
                isAxiosError: true,
                response: { data: { message: 'Email already exists' } }
            }
            vi.mocked(axios.post).mockRejectedValueOnce(mockError)
            vi.mocked(axios.isAxiosError).mockReturnValueOnce(true)

            const result = await signUp({
                firstName: 'John',
                lastName: 'Doe',
                email: 'existing@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            })

            expect(result.error).toBe('Email already exists')
        })
    })

    describe('signIn', () => {
        test('should return token on successful signin', async () => {
            vi.mocked(axios.post).mockResolvedValueOnce({
                data: { token: 'auth-token' }
            })

            const result = await signIn({
                email: 'john@example.com',
                password: 'password123'
            })

            expect(result.token).toBe('auth-token')
            expect(result.error).toBeUndefined()
        })

        test('should return error on failed signin', async () => {
            const mockError = {
                isAxiosError: true,
                response: { data: { message: 'Invalid credentials' } }
            }
            vi.mocked(axios.post).mockRejectedValueOnce(mockError)
            vi.mocked(axios.isAxiosError).mockReturnValueOnce(true)

            const result = await signIn({
                email: 'john@example.com',
                password: 'wrongpassword'
            })

            expect(result.error).toBe('Invalid credentials')
        })
    })

    describe('getDetails', () => {
        test('should return user details on success', async () => {
            const mockUser = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
            }

            vi.mocked(axios.get).mockResolvedValueOnce({
                data: { user: mockUser }
            })

            const result = await getDetails('valid-token')

            expect(result.user).toEqual(mockUser)
        })

        test('should return error for invalid token', async () => {
            const mockError = {
                isAxiosError: true,
                response: { data: { message: 'Unauthorized' } }
            }
            vi.mocked(axios.get).mockRejectedValueOnce(mockError)
            vi.mocked(axios.isAxiosError).mockReturnValueOnce(true)

            const result = await getDetails('invalid-token')

            expect(result.error).toBe('Unauthorized')
        })
    })
})
