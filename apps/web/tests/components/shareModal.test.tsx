import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareModal } from '../../app/components/ui/shareModal'

describe('ShareModal Component', () => {
    const mockOnClose = vi.fn()
    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        chatId: 'test-chat-123',
        chatTitle: 'Test Chat'
    }

    beforeEach(() => {
        vi.resetAllMocks()
        vi.mocked(window.localStorage.getItem).mockReturnValue('test-token')
    })

    test('should not render when isOpen is false', () => {
        render(<ShareModal {...defaultProps} isOpen={false} />)

        expect(screen.queryByText('Share this chat')).toBeNull()
    })

    test('should render when isOpen is true', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ chats: [{ id: 'test-chat-123', shareable: false }] })
        } as Response)

        render(<ShareModal {...defaultProps} />)

        expect(screen.getByText('Share this chat')).toBeTruthy()
    })

    test('should call onClose when backdrop is clicked', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ chats: [] })
        } as Response)

        render(<ShareModal {...defaultProps} />)

        const backdrop = document.querySelector('.bg-black\\/50')
        if (backdrop) {
            fireEvent.click(backdrop)
        }

        expect(mockOnClose).toHaveBeenCalled()
    })

    test('should call onClose when close button is clicked', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ chats: [] })
        } as Response)

        render(<ShareModal {...defaultProps} />)

        await waitFor(() => {
            expect(screen.queryByText('Anyone with the link can view')).toBeTruthy()
        })

        const closeButtons = screen.getAllByRole('button')
        const closeButton = closeButtons.find(btn => btn.querySelector('svg'))
        if (closeButton) {
            fireEvent.click(closeButton)
        }

        expect(mockOnClose).toHaveBeenCalled()
    })

    test('should show loading spinner initially', () => {
        vi.mocked(global.fetch).mockImplementationOnce(() => new Promise(() => {})) // Never resolves

        render(<ShareModal {...defaultProps} />)

        // Should show loading spinner
        expect(document.querySelector('.animate-spin')).toBeTruthy()
    })

    test('should toggle shareable status', async () => {
        // First call - get chats
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ chats: [{ id: 'test-chat-123', shareable: false }] })
        } as Response)

        // Second call - toggle share
        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ shareable: true })
        } as Response)

        render(<ShareModal {...defaultProps} />)

        await waitFor(() => {
            expect(screen.getByText('Anyone with the link can view')).toBeTruthy()
        })

        // Find and click the toggle button
        const toggleButton = document.querySelector('button.relative.w-12')
        if (toggleButton) {
            fireEvent.click(toggleButton)
        }

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2)
        })
    })

    test('should show share URL when shareable is enabled', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ chats: [{ id: 'test-chat-123', shareable: true }] })
        } as Response)

        render(<ShareModal {...defaultProps} />)

        await waitFor(() => {
            const urlInput = document.querySelector('input[readonly]') as HTMLInputElement
            expect(urlInput).toBeTruthy()
            expect(urlInput?.value).toContain('/share/test-chat-123')
        })
    })

    test('should copy URL to clipboard', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.resolve({ chats: [{ id: 'test-chat-123', shareable: true }] })
        } as Response)

        render(<ShareModal {...defaultProps} />)

        await waitFor(() => {
            expect(screen.getByText('Copy')).toBeTruthy()
        })

        fireEvent.click(screen.getByText('Copy'))

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining('/share/test-chat-123')
        )
    })
})
