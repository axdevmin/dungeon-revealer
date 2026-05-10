import * as React from "react";
import { useMessageAddMutation } from "./message-add-mutation";
import { usePersistedState } from "../hooks/use-persisted-state";
import styled from "@emotion/styled/macro";
import { ds } from "../design-system";
import * as Icon from "../feather-icons";

const useRawChatHistory = () =>
  usePersistedState<Array<string>>("chat.history", {
    encode: (value) => JSON.stringify(value),
    decode: (rawValue) => {
      if (typeof rawValue !== "string") {
        return [];
      }
      try {
        const value = JSON.parse(rawValue);
        if (
          Array.isArray(value) &&
          value.every((value) => typeof value === "string")
        ) {
          return value;
        }
      } catch (err) {}
      return [];
    },
  });

const useChatHistory = (size = 10): [string[], (text: string) => void] => {
  const [data, setData] = useRawChatHistory();

  const pushValue = React.useCallback(
    (text) => {
      setData((data) => {
        const newData = [text, ...data];
        if (newData.length > size) {
          newData.splice(size, newData.length - size);
        }
        return newData;
      });
    },
    [size]
  );

  return [data, pushValue];
};

const Wrapper = styled.div`
  display: flex;
  gap: 6px;
  align-items: flex-end;
`;

const TextareaField = styled.textarea`
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${ds.colors.border};
  border-radius: ${ds.radii.md};
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: all ${ds.transitions.fast};
  min-height: 72px;

  &::placeholder {
    color: ${ds.colors.textMuted};
  }

  &:focus {
    border-color: ${ds.colors.accentBorder};
    background: rgba(201, 133, 58, 0.04);
    box-shadow: 0 0 0 2px rgba(201, 133, 58, 0.1);
  }

  &::-webkit-scrollbar {
    width: 3px;
  }
`;

const SendButton = styled.button`
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: ${ds.colors.accentMuted};
  border: 1px solid ${ds.colors.accentBorder};
  border-radius: ${ds.radii.md};
  color: ${ds.colors.accent};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${ds.transitions.fast};

  svg {
    stroke: ${ds.colors.accent};
  }

  &:hover {
    background: ${ds.colors.accent};
    svg {
      stroke: #fff;
    }
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(201, 133, 58, 0.35);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Hint = styled.span`
  font-size: 10px;
  color: ${ds.colors.textMuted};
  font-family: ${ds.font.sans};
`;

export const ChatTextArea: React.FC<{}> = () => {
  const [value, setValue] = React.useState("");
  const [chatHistory, pushToHistory] = useChatHistory();
  const offset = React.useRef(-1);

  const messageAdd = useMessageAddMutation();

  const onChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(ev.currentTarget.value);
    },
    []
  );

  const onSubmit = React.useCallback(() => {
    if (value.trim() === "") return;
    messageAdd({
      rawContent: value,
    });
    setValue("");
    pushToHistory(value);
    offset.current = -1;
  }, [messageAdd, value]);

  const onKeyPress = React.useCallback(
    (ev: React.KeyboardEvent) => {
      if (ev.key === "Enter" && ev.shiftKey === false) {
        onSubmit();
        ev.preventDefault();
      }
    },
    [onSubmit, chatHistory, value]
  );

  const onKeyDown = React.useCallback(
    (ev: React.KeyboardEvent) => {
      if (ev.key === "ArrowUp" && ev.shiftKey === true) {
        offset.current = Math.min(offset.current + 1, chatHistory.length - 1);
        setValue((value) => chatHistory[offset.current] || value);
      } else if (ev.key === "ArrowDown" && ev.shiftKey === true) {
        offset.current = Math.max(offset.current - 1, -1);
        if (offset.current === -1) {
          setValue("");
        } else {
          setValue((value) => chatHistory[offset.current] || value);
        }
      }
      ev.stopPropagation();
    },
    [value]
  );

  return (
    <div>
      <Wrapper>
        <TextareaField
          placeholder="Écrire un message... (Entrée pour envoyer)"
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          onKeyDown={onKeyDown}
          rows={3}
        />
        <SendButton onClick={onSubmit} title="Envoyer">
          <Icon.Send boxSize="15px" />
        </SendButton>
      </Wrapper>
    </div>
  );
};
