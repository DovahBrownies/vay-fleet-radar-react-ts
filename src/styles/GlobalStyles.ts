// App-wide CSS reset + global tokens. Mounted once in App.tsx.

import { createGlobalStyle } from "styled-components";

import { SURFACE_COLORS, TEXT_COLORS } from "@app/styles/colors";

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
  }

  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: ${TEXT_COLORS.BODY};
    background: ${SURFACE_COLORS.BODY};
    -webkit-font-smoothing: antialiased;
  }
`;
