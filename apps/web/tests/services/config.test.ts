import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getAuthTokenKey } from '../../app/services/config'

describe('Config Service', () => {
    describe('getAuthTokenKey', () => {
        beforeEach(() => {
            vi.unstubAllGlobals()
        })

        test('should return dev key for localhost', () => {
            vi.stubGlobal('window', {
                location: { hostname: 'localhost' }
            })

            expect(getAuthTokenKey()).toBe('auth_token_dev')
        })

        test('should return prod key for production hostname', () => {
            vi.stubGlobal('window', {
                location: { hostname: 'lemon.app' }
            })

            expect(getAuthTokenKey()).toBe('auth_token_prod')
        })

        test('should return prod key when window is undefined (SSR)', () => {
            vi.stubGlobal('window', undefined)

            expect(getAuthTokenKey()).toBe('auth_token_prod')
        })
    })
})
