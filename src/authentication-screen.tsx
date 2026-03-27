import * as React from "react";
import styled from "@emotion/styled/macro";
import { Input } from "@chakra-ui/react";
import * as Button from "./button";
import { BackgroundImageContainer } from "./background-image-container";
import { BrandLogoText } from "./brand-logo-text";
import { Modal, ModalDialogSize } from "./modal";

const ButtonContainer = styled.div`
  margin-top: 16px;
  display: flex;
`;

const ButtonColumn = styled.div`
  margin-left: auto;
  margin-right: 0;
`;

const Link = styled.a`
  display: block;
  text-align: right;
  margin-top: 64px;
  color: white;
  font-family: folkard, cardinal, palitino, serif;
  font-size: 150%;
`;

export const AuthenticationScreen: React.FC<{
  onAuthenticate: (password: string) => void;
  requiredRole: "DM" | "PC";
  fetch: typeof fetch;
}> = ({ onAuthenticate, requiredRole = "DM", fetch }) => {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  return (
    <BackgroundImageContainer>
      <BrandLogoText />
      <form
        onSubmit={async (ev) => {
          ev.preventDefault();
          setError(null);
          const result = await fetch("/auth", {
            headers: {
              Authorization: `Bearer ${password}`,
            },
          }).then((res) => res.json());
          if (result.data.role === requiredRole || result.data.role === "DM") {
            onAuthenticate(password);
          } else {
            setError("Mot de passe invalide !");
          }
        }}
      >
        <Input
          background="white"
          placeholder={`Mot de passe ${
            requiredRole === "DM" ? "MJ" : "joueur"
          }`}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
        />
        <ButtonContainer>
          <ButtonColumn>
            <Button.Primary type="submit">Connexion</Button.Primary>
          </ButtonColumn>
        </ButtonContainer>
        <div>
          {requiredRole === "DM" ? (
            <Link href="/">Section joueurs{" >"}</Link>
          ) : (
            <Link href="/dm">Section MJ{" >"}</Link>
          )}
        </div>
      </form>

      {error ? (
        <Modal onPressEscape={() => undefined}>
          <Modal.Dialog size={ModalDialogSize.SMALL}>
            <Modal.Header>
              <h3>Mot de passe invalide</h3>
            </Modal.Header>
            <Modal.Body>
              Le mot de passe saisi est incorrect. Veuillez réessayer.{" "}
              <ButtonContainer>
                <ButtonColumn
                  onClick={() => {
                    setError(null);
                    setPassword("");
                  }}
                >
                  <Button.Primary>Réessayer.</Button.Primary>
                </ButtonColumn>
              </ButtonContainer>
            </Modal.Body>
          </Modal.Dialog>
        </Modal>
      ) : null}
    </BackgroundImageContainer>
  );
};
