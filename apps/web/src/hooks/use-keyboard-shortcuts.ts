"use client";

import { useEffect, useRef } from "react";

type BindingHandler = (event: KeyboardEvent) => void | Promise<void>;

type Bindings = Record<string, BindingHandler>;

type Options = {
  enabled?: boolean;
  bindings: Bindings;
  /**
   * Time window (ms) to complete a chord like `g i`.
   * Defaults to 1000.
   */
  chordTimeoutMs?: number;
};

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  // Some components wrap inputs; treat any element inside an editable ancestor as editable.
  const editableAncestor = target.closest(
    'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
  );
  return !!editableAncestor;
}

function normalizeKey(event: KeyboardEvent): string {
  // Use physical key codes for layout-sensitive symbols.
  if (event.code === "BracketLeft") return "[";
  if (event.code === "BracketRight") return "]";

  // Keep `#` as `#` (Shift+3) etc.
  const k = event.key;
  // Common keys we care about.
  if (k === " ") return "space";
  return k.toLowerCase();
}

export function useKeyboardShortcuts({
  enabled = true,
  bindings,
  chordTimeoutMs = 1000,
}: Options) {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const chordRef = useRef<string | null>(null);
  const chordTimerRef = useRef<number | null>(null);

  const chordPrefixesRef = useRef<Set<string>>(new Set());
  // Recompute chord prefixes whenever bindings change.
  {
    const prefixes = new Set<string>();
    for (const key of Object.keys(bindings)) {
      const parts = key.split(" ");
      if (parts.length > 1) prefixes.add(parts[0]!);
    }
    chordPrefixesRef.current = prefixes;
  }

  useEffect(() => {
    if (!enabled) return;

    function clearChord() {
      chordRef.current = null;
      if (chordTimerRef.current) {
        window.clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    }

    function armChord(prefix: string) {
      chordRef.current = prefix;
      if (chordTimerRef.current) window.clearTimeout(chordTimerRef.current);
      chordTimerRef.current = window.setTimeout(() => {
        chordRef.current = null;
        chordTimerRef.current = null;
      }, chordTimeoutMs);
    }

    async function onKeyDown(event: KeyboardEvent) {
      if (!enabled) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableElement(event.target)) return;

      const key = normalizeKey(event);
      const currentBindings = bindingsRef.current;

      // If we are mid-chord, try to complete it.
      if (chordRef.current) {
        const chord = `${chordRef.current} ${key}`;
        const handler = currentBindings[chord];
        clearChord();
        if (handler) {
          event.preventDefault();
          await handler(event);
          return;
        }
        // If completion failed but this key is itself a chord prefix, start a new chord.
        if (chordPrefixesRef.current.has(key)) {
          event.preventDefault();
          armChord(key);
          return;
        }
        // Otherwise fall through to try single-key bindings.
      }

      // Single-key binding.
      const single = currentBindings[key];
      if (single) {
        event.preventDefault();
        await single(event);
        return;
      }

      // Start a chord if this key is a prefix.
      if (chordPrefixesRef.current.has(key)) {
        event.preventDefault();
        armChord(key);
      } else {
        clearChord();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (chordTimerRef.current) window.clearTimeout(chordTimerRef.current);
    };
  }, [enabled, chordTimeoutMs]);
}
