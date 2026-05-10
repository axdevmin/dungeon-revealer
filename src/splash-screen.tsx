import React from "react";
import { BackgroundImageContainer } from "./background-image-container";
import { BrandLogoText } from "./brand-logo-text";
import styled from "@emotion/styled/macro";
import { keyframes } from "@emotion/react";
import { ds } from "./design-system";

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
`;

const dotAnimation = keyframes`
  0%, 20% { content: ""; }
  40% { content: "."; }
  60% { content: ".."; }
  80%, 100% { content: "..."; }
`;

const SplashText = styled.div`
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
  letter-spacing: 0.05em;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const Dots = styled.span`
  display: inline-block;
  width: 20px;
  text-align: left;

  &::after {
    content: "";
    animation: ${dotAnimation} 1.5s steps(1) infinite;
  }
`;

const LoadingBar = styled.div`
  width: 120px;
  height: 2px;
  background: ${ds.colors.border};
  border-radius: 9999px;
  margin: 16px auto 0;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: -50%;
    height: 100%;
    width: 50%;
    background: ${ds.colors.accent};
    border-radius: 9999px;
    animation: loading 1.4s ease-in-out infinite;
  }

  @keyframes loading {
    0% {
      left: -50%;
    }
    100% {
      left: 110%;
    }
  }
`;

export const SplashScreen: React.FC<{ text?: string; tagline?: string }> = ({
  text = null,
  tagline,
}) => {
  return (
    <BackgroundImageContainer>
      <div>
        <BrandLogoText tagline={tagline} />
        {text ? (
          <>
            <SplashText>
              {text}
              <Dots />
            </SplashText>
            <LoadingBar />
          </>
        ) : null}
      </div>
    </BackgroundImageContainer>
  );
};
