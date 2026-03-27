import React from "react";
import styled from "@emotion/styled/macro";

export const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;

  background-image: linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)),
    url("/images/navis-background.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
`;

const Inner = styled.div`
  min-height: 40vh;
  padding-left: 32px;
  padding-right: 32px;
  max-width: 500px;
`;

export const BackgroundImageContainer: React.FC<{}> = ({ children }) => {
  return (
    <Container>
      <Inner>{children}</Inner>
    </Container>
  );
};
