import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Simple helper function
export function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null;
}

export function isNumber(n: unknown): n is number {
	return typeof n === 'number' && Number.isFinite(n);
}

// Tailwind
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Type helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
