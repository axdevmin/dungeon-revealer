import styled from "@emotion/styled/macro";
import { ds } from "../../design-system";

export const List = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
  flex: 1;
  overflow-y: auto;
`;

export const ListItem = styled.li``;

export const ListItemButton = styled.button<{ isActive?: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ${ds.font.sans};
  font-weight: 500;
  font-size: 13px;
  display: block;
  width: 100%;
  border: none;
  text-align: left;
  padding: 12px 14px;
  cursor: pointer;
  text-decoration: none;
  border-left: 3px solid
    ${(p) => (p.isActive ? ds.colors.accent : "transparent")};
  background: ${(p) => (p.isActive ? ds.colors.surfaceActive : "transparent")};
  color: ${(p) =>
    p.isActive ? ds.colors.textPrimary : ds.colors.textSecondary};
  transition: all ${ds.transitions.fast};
  outline: none;

  &:focus,
  &:hover {
    background: ${ds.colors.surfaceHover};
    color: ${ds.colors.textPrimary};
    border-left-color: ${(p) =>
      p.isActive ? ds.colors.accent : ds.colors.border};
  }
`;
