import { describe, it, expect } from "vitest"
import { renderToString } from "react-dom/server"
import { createElement } from "react"
import { ShiftslotLoader } from "../ShiftslotLoader"

describe("ShiftslotLoader", () => {
  it("renders role=status", () => {
    const html = renderToString(createElement(ShiftslotLoader))
    expect(html).toContain('role="status"')
  })

  it("renders sr-only label when no label prop given", () => {
    const html = renderToString(createElement(ShiftslotLoader))
    expect(html).toContain("Lädt…")
  })

  it("renders visible label when label prop is given", () => {
    const html = renderToString(createElement(ShiftslotLoader, { label: "Speichert…" }))
    expect(html).toContain("Speichert…")
  })

  it("renders for each size without throwing", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const html = renderToString(createElement(ShiftslotLoader, { size }))
      expect(html).toContain('role="status"')
    }
  })
})
