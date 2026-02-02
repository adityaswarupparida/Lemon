import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getChats, createNewChat, searchChats } from '../../app/services/chat'

describe('Chat Service', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('getChats', () => {
        test('should fetch chats with auth token', async () => {
            const mockChats = [
                { id: '1', title: 'Chat 1' },
                { id: '2', title: 'Chat 2' }
            ]

            vi.mocked(global.fetch).mockResolvedValueOnce({
                json: () => Promise.resolve({ chats: mockChats })
            } as Response)

            const result = await getChats('test-token')

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/chat'),
                expect.objectContaining({
                    method: 'GET',
                    headers: { Authorization: 'Bearer test-token' }
                })
            )
            expect(result).toEqual(mockChats)
        })
    })

    describe('createNewChat', () => {
        test('should create a new chat', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                json: () => Promise.resolve({ chat: 'new-chat-id' })
            } as Response)

            const result = await createNewChat('test-token')

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/chat'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-token'
                    }),
                    body: JSON.stringify({ title: 'Untitled' })
                })
            )
            expect(result).toBe('new-chat-id')
        })
    })

    describe('searchChats', () => {
        test('should search chats with query', async () => {
            const mockResults = [
                { chatId: '1', title: 'Chat 1', snippet: 'matching text' }
            ]

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ results: mockResults })
            } as Response)

            const result = await searchChats('test query', 'test-token')

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/chat/search?q=test%20query'),
                expect.objectContaining({
                    method: 'GET',
                    headers: { Authorization: 'Bearer test-token' }
                })
            )
            expect(result).toEqual(mockResults)
        })

        test('should return empty array on error', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false
            } as Response)

            const result = await searchChats('test', 'test-token')

            expect(result).toEqual([])
        })
    })
})
