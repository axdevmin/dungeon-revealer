import styled from "@emotion/styled/macro";
import { ds } from "./design-system";

export const Group = styled.div`
  display: flex;
  gap: 1px;
  background: ${ds.colors.border};
  border-radius: ${ds.radii.sm};
  overflow: hidden;
  padding: 1px;
`;

type NavButtonProps = {
  isActive?: boolean;
  small?: boolean;
  fullWidth?: boolean;
};

export const Button = styled.button<NavButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: ${(p) => (p.fullWidth ? 1 : null)};
  height: ${(p) => (p.small ? "30px" : "36px")};
  padding: 0 12px;
  font-family: ${ds.font.sans};
  font-size: 12px;
  font-weight: 500;
  border: none;
  border-radius: ${ds.radii.sm};
  cursor: pointer;
  white-space: nowrap;
  transition: all ${ds.transitions.fast};
  letter-spacing: 0.01em;

  background: ${(p) => (p.isActive ? ds.colors.surfaceActive : "transparent")};
  color: ${(p) => (p.isActive ? ds.colors.textPrimary : ds.colors.textMuted)};

  svg {
    stroke: ${(p) => (p.isActive ? ds.colors.accent : ds.colors.textMuted)};
    transition: stroke ${ds.transitions.fast};
  }

  &:hover {
    background: ${(p) =>
      p.isActive ? ds.colors.surfaceActive : ds.colors.surfaceHover};
    color: ${ds.colors.textPrimary};

    svg {
      stroke: ${(p) =>
        p.isActive ? ds.colors.accent : ds.colors.textSecondary};
    }
  }
`;
