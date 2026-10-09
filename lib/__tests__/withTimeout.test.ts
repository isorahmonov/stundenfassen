import { describe, it, expect, vi, afterEach } from "vitest"
import { withTimeout } from "../withTimeout"

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("resolves with the promise value when it settles before the timeout", async () => {
    const result = await withTimeout(Promise.resolve(42), 1000)
    expect(result).toBe(42)
  })

  it("propagates the original rejection when the promise rejects before the timeout", async () => {
    const err = new Error("upstream failure")
    await expect(withTimeout(Promise.reject(err), 1000)).rejects.toThrow("upstream failure")
  })

  it("rejects with a timeout error when the promise takes too long", async () => {
    vi.useFakeTimers()
    const never = new Promise<never>(() => { /* never resolves */ })
    const raced = withTimeout(never, 5000)
    vi.advanceTimersByTime(5001)
    await expect(raced).rejects.toThrow("Zeitüberschreitung (5 s)")
  })

  it("does not fire the timeout after the promise resolves", async () => {
    vi.useFakeTimers()
    const fast = Promise.resolve("ok")
    const raced = withTimeout(fast, 5000)
    await expect(raced).resolves.toBe("ok")
    // Advancing past the timeout should not cause an unhandled rejection
    vi.advanceTimersByTime(10_000)
  })
})
