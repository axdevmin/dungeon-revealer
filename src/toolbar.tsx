import React, { useMemo, useEffect } from "react";
import styled from "@emotion/styled/macro";
import type { ReactEventHandlers } from "react-use-gesture/dist/types";
import { ds } from "./design-system";

const ToolbarContext = React.createContext({
  horizontal: false,
  transparent: false,
});

const ToolbarBase = styled.div<{ horizontal?: boolean; transparent?: boolean }>`
  pointer-events: all;
  border-radius: ${ds.radii.xl};
  text-align: center;
  width: ${(p) => (p.horizontal ? "max-content" : "57px")};
  height: ${(p) => (p.horizontal ? "44px" : "max-content")};
  display: ${(p) => (p.horizontal ? "flex" : null)};
  align-items: ${(p) => (p.horizontal ? "center" : null)};

  background: ${(p) =>
    p.transparent ? ds.colors.glassDark : ds.colors.surface};
  backdrop-filter: ${(p) => (p.transparent ? ds.blur.md : "none")};
  -webkit-backdrop-filter: ${(p) => (p.transparent ? ds.blur.md : "none")};
  border: 1px solid
    ${(p) => (p.transparent ? ds.colors.borderStrong : ds.colors.border)};
  box-shadow: ${ds.shadows.lg};

  > :last-child {
    border-top-right-radius: ${(p) => (p.horizontal ? ds.radii.xl : null)};
    border-top-left-radius: 0;
    border-bottom-right-radius: ${ds.radii.xl};
    border-bottom-left-radius: ${(p) => (p.horizontal ? null : ds.radii.xl)};
  }

  > :first-child {
    border-top-right-radius: ${(p) => (p.horizontal ? null : ds.radii.xl)};
    border-top-left-radius: ${ds.radii.xl};
    border-bottom-left-radius: ${(p) => (p.horizontal ? ds.radii.xl : null)};
  }
`;

const ToolbarGroup = styled.ul<{
  horizontal?: boolean;
  vertical?: boolean;
  divider?: boolean;
  transparent?: boolean;
}>`
  display: ${(p) => (p.horizontal ? "flex" : "block")};
  margin: 0;
  padding: 0;
  padding-bottom: ${(p) => (!p.horizontal ? "4px" : null)};
  border-bottom: ${(p) =>
    p.divider && !p.vertical ? `1px solid ${ds.colors.border}` : null};
  border-right: ${(p) =>
    p.horizontal && p.vertical ? `1px solid ${ds.colors.border}` : null};
  list-style: none;
  background-color: transparent;

  &:first-of-type {
    padding-left: ${(p) => (p.horizontal ? "8px" : null)};
  }
`;

const ToolbarItem = styled.li<{
  horizontal?: boolean;
  isEnabled?: boolean;
  isActive?: boolean;
  transparent?: boolean;
}>`
  position: relative;
  flex: ${(p) => (p.horizontal ? "1" : null)};
  min-width: ${(p) => (p.horizontal ? "60px" : null)};
  padding-top: ${(p) => (p.horizontal ? "0" : "10px")};
  padding-right: ${(p) => (p.horizontal ? "6px" : "0")};
  height: ${(p) => (p.horizontal ? "44px" : "auto")};

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  > :nth-child(2) {
    margin-top: 3px;
  }

  color: ${(p) => {
    if (p.isActive || p.isEnabled) return ds.colors.accent;
    return ds.colors.textMuted;
  }};

  transition: color ${ds.transitions.fast};

  &:last-child {
    margin-right: 0;
  }

  > button {
    height: ${(p) => (p.horizontal ? "44px" : "auto")};
    transition: transform ${ds.transitions.fast};

    &:hover {
      transform: scale(1.05);
    }
  }

  svg {
    stroke: ${(p) => {
      if (p.isActive || p.isEnabled) return ds.colors.accent;
      return ds.colors.textMuted;
    }};
    transition: stroke ${ds.transitions.fast};
  }

  &:hover svg {
    stroke: ${ds.colors.textPrimary};
  }
`;

const ToolboxButton = styled.button`
  display: block;
  width: 100%;
  padding: 0;
  cursor: pointer;
  border: none;
  background-color: transparent;
  color: inherit;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  > :nth-child(2) {
    margin-top: 3px;
  }
`;

const ToolbarItemPopupContainer = styled.div<{ horizontal?: boolean }>`
  position: absolute;
  box-shadow: ${ds.shadows.lg};
  border-radius: ${ds.radii.lg};
  background-color: ${ds.colors.surface};
  border: 1px solid ${ds.colors.border};
  top: ${(p) => (p.horizontal ? null : `0`)};
  bottom: ${(p) => (p.horizontal ? `52px` : null)};
  left: ${(p) => (p.horizontal ? `-12px` : `52px`)};
  filter: none;
  min-width: 200px;
  z-index: 100;
  overflow: hidden;
`;

const ToolbarItemPopup = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(({ children }, ref) => {
  const { horizontal } = React.useContext(ToolbarContext);
  return (
    <ToolbarItemPopupContainer horizontal={horizontal} ref={ref}>
      {children}
    </ToolbarItemPopupContainer>
  );
});

type ToolbarType = React.FC<{ horizontal?: boolean; transparent?: boolean }> & {
  Logo: typeof Logo;
  Group: typeof Group;
  Item: typeof Item;
  Button: typeof ToolboxButton;
  LongPressButton: typeof LongPressButton;
  Popup: typeof ToolbarItemPopup;
};

export const Toolbar: ToolbarType = ({
  children,
  horizontal,
  transparent,
  ...props
}) => {
  const contextValue = React.useMemo(
    () => ({
      horizontal: horizontal ?? false,
      transparent: transparent ?? false,
    }),
    [horizontal, transparent]
  );

  return (
    <ToolbarContext.Provider value={contextValue}>
      <ToolbarBase horizontal={horizontal} transparent={transparent} {...props}>
        {children}
      </ToolbarBase>
    </ToolbarContext.Provider>
  );
};

const ToolbarLogo = styled.div<{
  horizontal?: boolean;
  transparent?: boolean;
  cursor?: string;
}>`
  width: 100%;
  height: 44px;
  background: ${(p) =>
    p.transparent ? "rgba(96,165,250,0.12)" : ds.colors.accentMuted};
  border-bottom: 1px solid ${ds.colors.accentBorder};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: ${ds.colors.accent};
  font-family: ${ds.font.brand};
  line-height: 2;
  cursor: ${(props) => props.cursor};
  transition: background ${ds.transitions.fast};

  > span {
    transform: translateY(18%);
  }

  &:hover {
    background: rgba(96, 165, 250, 0.2);
  }

  &:last-child {
    border-top-right-radius: ${(p) => (p.horizontal ? ds.radii.xl : null)};
    border-bottom-right-radius: ${(p) => (p.horizontal ? ds.radii.xl : null)};
    border-top-left-radius: ${(p) => (p.horizontal ? ds.radii.xl : null)};
    border-bottom-left-radius: ${(p) => (p.horizontal ? ds.radii.xl : null)};
  }
`;

const Logo: React.FC<{
  cursor?: string & ReactEventHandlers;
}> = ({ children, ...props }) => {
  const { horizontal, transparent } = React.useContext(ToolbarContext);
  return (
    <ToolbarLogo horizontal={horizontal} transparent={transparent} {...props}>
      {children ?? <span>N</span>}
    </ToolbarLogo>
  );
};

const Group: React.FC<
  Pick<React.ComponentProps<"div">, "style"> & { divider?: boolean }
> = ({ children, style, divider, ...props }) => {
  const { horizontal, transparent } = React.useContext(ToolbarContext);
  return (
    <ToolbarGroup
      horizontal={horizontal}
      divider={divider}
      transparent={transparent}
      {...props}
    >
      {children}
    </ToolbarGroup>
  );
};

const Item = React.forwardRef<
  HTMLLIElement,
  Exclude<React.ComponentProps<"li">, "style"> & { isActive?: boolean }
>(({ children, isActive, style, ...props }, ref) => {
  const { horizontal, transparent } = React.useContext(ToolbarContext);

  return (
    <ToolbarItem
      {...props}
      horizontal={horizontal}
      isActive={isActive}
      transparent={transparent}
      ref={ref}
    >
      {children}
    </ToolbarItem>
  );
});

const LongPressButton: React.FC<{
  onLongPress?: () => () => void;
  onClick: () => void;
}> = ({ onLongPress, ...props }) => {
  const timeoutRef = React.useRef<() => void>();

  const onMouseDown = useMemo(() => {
    if (!onLongPress) {
      return undefined;
    }

    return (ev: React.MouseEvent | React.TouchEvent) => {
      ev.stopPropagation();
      const timeout = setTimeout(() => {
        const releaseHandler = onLongPress();

        const onMouseUp = () => {
          if (releaseHandler) {
            releaseHandler();
          }
          timeoutRef.current?.();
          window.removeEventListener("mouseup", onMouseUp);
          window.removeEventListener("touchend", onMouseUp);
          window.removeEventListener("touchcancel", onMouseUp);
        };

        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchend", onMouseUp);
        window.addEventListener("touchcancel", onMouseUp);
      }, 300);
      timeoutRef.current = () => clearTimeout(timeout);

      const onMouseUp = () => {
        timeoutRef.current?.();
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("touchend", onMouseUp);
        window.removeEventListener("touchcancel", onMouseUp);
      };

      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchend", onMouseUp);
      window.addEventListener("touchcancel", onMouseUp);
    };
  }, [onLongPress]);

  useEffect(() => () => timeoutRef.current?.(), []);

  return (
    <ToolboxButton
      {...props}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
    />
  );
};

Toolbar.Logo = Logo;
Toolbar.Group = Group;
Toolbar.Item = Item;
Toolbar.Button = ToolboxButton;
Toolbar.LongPressButton = LongPressButton;
Toolbar.Popup = ToolbarItemPopup;
