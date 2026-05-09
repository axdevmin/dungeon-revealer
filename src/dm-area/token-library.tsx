import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useMutation } from "relay-hooks";
import styled from "@emotion/styled/macro";
import type { TokenType } from "../map-typings";
import type { tokenLibraryAddTokenMutation } from "./__generated__/tokenLibraryAddTokenMutation.graphql";

const TOKEN_TYPE_COLORS: Record<TokenType, string> = {
  character: "#4488ff",
  creature: "#ff4444",
  object: "#ffaa33",
  hazard: "#ff6633",
  marker: "#aa44ff",
};

type TokenPreset = {
  label: string;
  tokenType: TokenType;
  color: string;
  emoji: string;
};

const LIBRARY: Array<{ category: string; tokens: TokenPreset[] }> = [
  {
    category: "Personnages",
    tokens: [
      {
        label: "Guerrier",
        tokenType: "character",
        color: "#3355cc",
        emoji: "⚔",
      },
      { label: "Mage", tokenType: "character", color: "#8833cc", emoji: "✨" },
      {
        label: "Rôdeur",
        tokenType: "character",
        color: "#336633",
        emoji: "🏹",
      },
      { label: "Clerc", tokenType: "character", color: "#ccaa33", emoji: "✝" },
      {
        label: "Roublard",
        tokenType: "character",
        color: "#333333",
        emoji: "🗡",
      },
      {
        label: "Barbare",
        tokenType: "character",
        color: "#993333",
        emoji: "💪",
      },
    ],
  },
  {
    category: "Créatures",
    tokens: [
      { label: "Dragon", tokenType: "creature", color: "#cc2222", emoji: "🐉" },
      {
        label: "Gobelin",
        tokenType: "creature",
        color: "#44aa44",
        emoji: "👺",
      },
      {
        label: "Mort-Vivant",
        tokenType: "creature",
        color: "#557755",
        emoji: "💀",
      },
      { label: "Démon", tokenType: "creature", color: "#880022", emoji: "😈" },
      { label: "Loup", tokenType: "creature", color: "#776655", emoji: "🐺" },
      {
        label: "Araignée",
        tokenType: "creature",
        color: "#222222",
        emoji: "🕷",
      },
    ],
  },
  {
    category: "Objets",
    tokens: [
      { label: "Coffre", tokenType: "object", color: "#886633", emoji: "📦" },
      { label: "Torche", tokenType: "object", color: "#cc7722", emoji: "🕯" },
      { label: "Potion", tokenType: "object", color: "#cc3366", emoji: "⚗" },
      { label: "Tonneau", tokenType: "object", color: "#774433", emoji: "🍺" },
      { label: "Porte", tokenType: "object", color: "#664422", emoji: "🚪" },
      { label: "Autel", tokenType: "object", color: "#555577", emoji: "⛩" },
    ],
  },
  {
    category: "Dangers",
    tokens: [
      { label: "Feu", tokenType: "hazard", color: "#dd4411", emoji: "🔥" },
      { label: "Piège", tokenType: "hazard", color: "#cc8822", emoji: "⚙" },
      { label: "Acide", tokenType: "hazard", color: "#88cc11", emoji: "☣" },
      { label: "Glace", tokenType: "hazard", color: "#44aacc", emoji: "❄" },
      { label: "Éclair", tokenType: "hazard", color: "#cccc11", emoji: "⚡" },
      { label: "Poison", tokenType: "hazard", color: "#558833", emoji: "☠" },
    ],
  },
];

const AddTokenMutation = graphql`
  mutation tokenLibraryAddTokenMutation($input: MapTokenAddManyInput!) {
    mapTokenAddMany(input: $input)
  }
`;

const PanelContainer = styled.div`
  background: #1a1a2e;
  border: 1px solid #333366;
  border-radius: 8px;
  width: 280px;
  max-height: 480px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  user-select: none;
`;

const PanelHeader = styled.div`
  padding: 10px 14px 8px;
  font-size: 13px;
  font-weight: 700;
  color: #aaaadd;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-bottom: 1px solid #2a2a4a;
  position: sticky;
  top: 0;
  background: #1a1a2e;
  z-index: 1;
`;

const CategoryTitle = styled.div`
  padding: 8px 14px 4px;
  font-size: 10px;
  font-weight: 700;
  color: #7777aa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 4px 10px 8px;
`;

const TokenButton = styled.button<{ typeColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px 6px;
  background: #12122a;
  border: 2px solid ${(p) => p.typeColor};
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  color: #ddddff;
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  word-break: break-word;

  &:hover {
    background: #1e1e3e;
    transform: scale(1.04);
  }

  &:active {
    transform: scale(0.96);
  }
`;

const TokenEmoji = styled.div`
  font-size: 22px;
  line-height: 1;
`;

export const TokenLibrary = (props: {
  mapId: string;
  mapCenterX: number;
  mapCenterY: number;
}) => {
  const [addToken] =
    useMutation<tokenLibraryAddTokenMutation>(AddTokenMutation);

  const place = (preset: TokenPreset) => {
    addToken({
      variables: {
        input: {
          mapId: props.mapId,
          tokens: [
            {
              x: props.mapCenterX,
              y: props.mapCenterY,
              color: preset.color,
              label: preset.label,
              tokenType: preset.tokenType,
              isAlive: true,
              isVisibleForPlayers: false,
              isMovableByPlayers: false,
            },
          ],
        },
      },
    });
  };

  return (
    <PanelContainer>
      <PanelHeader>Bibliothèque de tokens</PanelHeader>
      {LIBRARY.map((section) => (
        <React.Fragment key={section.category}>
          <CategoryTitle>{section.category}</CategoryTitle>
          <TokenGrid>
            {section.tokens.map((preset) => (
              <TokenButton
                key={preset.label}
                typeColor={TOKEN_TYPE_COLORS[preset.tokenType]}
                title={`Ajouter : ${preset.label}`}
                onClick={() => place(preset)}
              >
                <TokenEmoji>{preset.emoji}</TokenEmoji>
                {preset.label}
              </TokenButton>
            ))}
          </TokenGrid>
        </React.Fragment>
      ))}
    </PanelContainer>
  );
};
