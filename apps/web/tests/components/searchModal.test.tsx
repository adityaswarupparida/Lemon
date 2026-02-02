import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchModal } from '../../app/components/ui/searchModal'

describe('SearchModal Component', () => {
    const mockOnClose = vi.fn()
    const mockOnSelectChat = vi.fn()

    beforeEach(() => {
        vi.resetAllMocks()
        // Mock localStorage
        vi.mocked(window.localStorage.getItem).mockReturnValue('test-token')
    })

    test('should not render when isOpen is false', () => {
        render(
            <SearchModal
                isOpen={false}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        expect(screen.queryByPlaceholderText('Search chats...')).toBeNull()
    })

    test('should render when isOpen is true', () => {
        render(
            <SearchModal
                isOpen={true}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        expect(screen.getByPlaceholderText('Search chats...')).toBeTruthy()
    })

    test('should call onClose when backdrop is clicked', () => {
        render(
            <SearchModal
                isOpen={true}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        // Click the backdrop (first div with bg-black/50)
        const backdrop = document.querySelector('.bg-black\\/50')
        if (backdrop) {
            fireEvent.click(backdrop)
        }

        expect(mockOnClose).toHaveBeenCalled()
    })

    test('should call onClose when close button is clicked', () => {
        render(
            <SearchModal
                isOpen={true}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        const closeButton = screen.getByRole('button')
        fireEvent.click(closeButton)

        expect(mockOnClose).toHaveBeenCalled()
    })

    test('should show minimum character message for short query', async () => {
        render(
            <SearchModal
                isOpen={true}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        const input = screen.getByPlaceholderText('Search chats...')
        fireEvent.change(input, { target: { value: 'a' } })

        await waitFor(() => {
            expect(screen.getByText('Type at least 2 characters to search')).toBeTruthy()
        })
    })

    test('should trigger search for valid query', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ results: [] })
        } as Response)

        render(
            <SearchModal
                isOpen={true}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        const input = screen.getByPlaceholderText('Search chats...')
        fireEvent.change(input, { target: { value: 'test query' } })

        // Wait for debounce
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled()
        }, { timeout: 500 })
    })

    test('should display search results', async () => {
        const mockResults = [
            { chatId: '1', title: 'Test Chat', snippet: 'matching content here' }
        ]

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ results: mockResults })
        } as Response)

        render(
            <SearchModal
                isOpen={true}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        const input = screen.getByPlaceholderText('Search chats...')
        fireEvent.change(input, { target: { value: 'test' } })

        await waitFor(() => {
            expect(screen.getByText('Test Chat')).toBeTruthy()
            expect(screen.getByText('matching content here')).toBeTruthy()
        }, { timeout: 500 })
    })

    test('should call onSelectChat when result is clicked', async () => {
        const mockResults = [
            { chatId: '123', title: 'Test Chat', snippet: 'snippet' }
        ]

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ results: mockResults })
        } as Response)

        render(
            <SearchModal
                isOpen={true}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        const input = screen.getByPlaceholderText('Search chats...')
        fireEvent.change(input, { target: { value: 'test' } })

        await waitFor(() => {
            expect(screen.getByText('Test Chat')).toBeTruthy()
        }, { timeout: 500 })

        fireEvent.click(screen.getByText('Test Chat'))

        expect(mockOnSelectChat).toHaveBeenCalledWith('123', 'Test Chat')
        expect(mockOnClose).toHaveBeenCalled()
    })

    test('should show no results message', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ results: [] })
        } as Response)

        render(
            <SearchModal
                isOpen={true}
                onClose={mockOnClose}
                onSelectChat={mockOnSelectChat}
            />
        )

        const input = screen.getByPlaceholderText('Search chats...')
        fireEvent.change(input, { target: { value: 'nonexistent' } })

        await waitFor(() => {
            expect(screen.getByText(/No results found/)).toBeTruthy()
        }, { timeout: 500 })
    })
})
