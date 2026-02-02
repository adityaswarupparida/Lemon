import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LemonAnimation } from '../../app/components/ui/lemonAnimation'

describe('LemonAnimation Component', () => {
    test('renders with default xl size', () => {
        const { container } = render(<LemonAnimation />)

        // Check that the component renders
        expect(container.querySelector('svg')).toBeTruthy()
    })

    test('renders with sm size', () => {
        const { container } = render(<LemonAnimation size="sm" />)

        const svg = container.querySelector('svg')
        expect(svg).toBeTruthy()
        expect(svg?.classList.contains('w-6')).toBe(true)
        expect(svg?.classList.contains('h-6')).toBe(true)
    })

    test('renders with md size', () => {
        const { container } = render(<LemonAnimation size="md" />)

        const svg = container.querySelector('svg')
        expect(svg).toBeTruthy()
        expect(svg?.classList.contains('w-8')).toBe(true)
    })

    test('renders with lg size', () => {
        const { container } = render(<LemonAnimation size="lg" />)

        const svg = container.querySelector('svg')
        expect(svg).toBeTruthy()
        expect(svg?.classList.contains('w-10')).toBe(true)
    })

    test('renders with xl size', () => {
        const { container } = render(<LemonAnimation size="xl" />)

        const svg = container.querySelector('svg')
        expect(svg).toBeTruthy()
        expect(svg?.classList.contains('w-12')).toBe(true)
    })

    test('renders juice drop animations', () => {
        const { container } = render(<LemonAnimation />)

        // Should have 3 drop animations
        const drops = container.querySelectorAll('[class*="animate-drop"]')
        expect(drops.length).toBe(3)
    })
})
