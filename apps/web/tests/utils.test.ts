import { describe, test, expect } from 'vitest'
import { concatenate, getInitials } from '../app/utils'

describe('Utils', () => {
    describe('concatenate', () => {
        test('should concatenate two strings with separator', () => {
            expect(concatenate('Hello', 'World', ' ')).toBe('Hello World')
        })

        test('should return empty string if first word is undefined', () => {
            expect(concatenate(undefined, 'World', ' ')).toBe('')
        })

        test('should return empty string if second word is undefined', () => {
            expect(concatenate('Hello', undefined, ' ')).toBe('')
        })

        test('should return empty string if both are undefined', () => {
            expect(concatenate(undefined, undefined, ' ')).toBe('')
        })

        test('should work with different separators', () => {
            expect(concatenate('a', 'b', '-')).toBe('a-b')
            expect(concatenate('a', 'b', '')).toBe('ab')
        })
    })

    describe('getInitials', () => {
        test('should return uppercase initials', () => {
            expect(getInitials('John', 'Doe')).toBe('JD')
        })

        test('should return empty string if first name is undefined', () => {
            expect(getInitials(undefined, 'Doe')).toBe('')
        })

        test('should return empty string if last name is undefined', () => {
            expect(getInitials('John', undefined)).toBe('')
        })

        test('should return empty string if names are empty', () => {
            expect(getInitials('', '')).toBe('')
        })

        test('should handle lowercase names', () => {
            expect(getInitials('john', 'doe')).toBe('JD')
        })
    })
})
