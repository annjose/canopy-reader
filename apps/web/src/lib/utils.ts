import { nanoid } from "nanoid";
import { READING_WPM } from "@canopy/shared";

export function generateId(): string {
  return nanoid(21);
}

export function extractDomain(url: string): string {
  return new URL(url).hostname;
}

export function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / READING_WPM);
}

export function nowISO(): string {
  return new Date().toISOString();
}
