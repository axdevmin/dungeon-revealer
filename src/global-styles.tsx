import { css } from "@emotion/react";
import { buildUrl } from "./public-url";
import { cssVars } from "./design-system";

export const globalStyles = css`
  ${cssVars}

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  @font-face {
    font-family: "folkard";
    src: url("${buildUrl("/fonts/folkard.woff")}") format("woff");
  }

  @font-face {
    font-family: "KnightsTemplar";
    src: url("${buildUrl("/fonts/KnightsTemplar.woff")}") format("woff");
  }

  * {
    box-sizing: border-box;
  }

  button {
    font: unset;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0px;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif;
    font-size: 16px;
    overflow: hidden;
    background-color: #0d0f14;
    color: #e8e6e1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html {
    touch-action: none;
  }

  .user-select-disabled {
    * {
      user-select: none !important;
    }
  }

  #root {
    height: 100%;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #0d0f14;
  }

  /* Scrollbars fines et discrètes */
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 9999px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  /* Range inputs */
  input[type="range"] {
    height: 20px;
    -webkit-appearance: none;
    margin: 4px 0;
    width: 100%;
    background: transparent;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 3px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
  }

  input[type="range"]::-webkit-slider-thumb {
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: #60a5fa;
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -5.5px;
    box-shadow: 0 0 6px rgba(96, 165, 250, 0.5);
    transition: transform 0.15s ease;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  input[type="range"]:focus::-webkit-slider-runnable-track {
    background: rgba(255, 255, 255, 0.15);
  }

  .no-focus-outline *:focus {
    outline: none !important;
  }

  .react-colorful__pointer {
    width: 18px;
    height: 18px;
  }

  .react-colorful {
    border-radius: 10px !important;
  }

  /* Chakra UI overrides for dark theme */
  .chakra-input,
  .chakra-textarea,
  .chakra-select {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #e8e6e1 !important;
    font-family: "Inter", sans-serif !important;
  }

  .chakra-input:focus,
  .chakra-textarea:focus {
    border-color: rgba(96, 165, 250, 0.5) !important;
    box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.3) !important;
  }

  .chakra-input::placeholder,
  .chakra-textarea::placeholder {
    color: rgba(255, 255, 255, 0.25) !important;
  }

  .chakra-switch__track[data-checked] {
    background: #60a5fa !important;
  }

  .chakra-form__label {
    color: #9ca3af !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
  }
`;
