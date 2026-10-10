import { Font } from "@react-pdf/renderer"

Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/noto-sans-combined-400-normal.woff", fontWeight: 400 },
    { src: "/fonts/noto-sans-combined-700-normal.woff", fontWeight: 700 },
  ],
})
