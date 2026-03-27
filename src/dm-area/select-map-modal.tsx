import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useFragment, useMutation, usePagination, useQuery } from "relay-hooks";
import { ConnectionHandler } from "relay-runtime";
import { Modal, ModalDialogSize } from "../modal";
import * as Icon from "../feather-icons";
import { Input, InputGroup } from "../input";
import * as Button from "../button";
import * as ScrollableList from "./components/scrollable-list";
import { generateSHA256FileHash } from "../crypto";
import { useSelectFileDialog } from "../hooks/use-select-file-dialog";
import { selectMapModal_MapsQuery } from "./__generated__/selectMapModal_MapsQuery.graphql";
import { selectMapModal_MapCreateMutation } from "./__generated__/selectMapModal_MapCreateMutation.graphql";
import { selectMapModal_MapImageRequestUploadMutation } from "./__generated__/selectMapModal_MapImageRequestUploadMutation.graphql";
import { selectMapModal_MapDeleteMutation } from "./__generated__/selectMapModal_MapDeleteMutation.graphql";
import { selectMapModal_MapUpdateTitleMutation } from "./__generated__/selectMapModal_MapUpdateTitleMutation.graphql";
import { selectMapModal_MapList_MapsFragment$key } from "./__generated__/selectMapModal_MapList_MapsFragment.graphql";
import { useInvokeOnScrollEnd } from "../hooks/use-invoke-on-scroll-end";
import { selectMapModal_ActiveMap_MapFragment$key } from "./__generated__/selectMapModal_ActiveMap_MapFragment.graphql";
import { selectMapModal_ActiveMapQuery } from "./__generated__/selectMapModal_ActiveMapQuery.graphql";
import { selectMapModal_MapCreateFromUrlMutation } from "./__generated__/selectMapModal_MapCreateFromUrlMutation.graphql";

type CreateNewMapButtonProps = {
  children: React.ReactChild;
  onSelectFile: (file: File) => void;
} & Pick<
  React.ComponentProps<typeof Button.Primary>,
  "tabIndex" | "fullWidth" | "big"
>;

const CreateNewMapButton = ({
  onSelectFile,
  children,
  ...props
}: CreateNewMapButtonProps) => {
  const [reactTreeNode, showFileDialog] = useSelectFileDialog(onSelectFile);
  return (
    <>
      <Button.Primary {...props} onClick={showFileDialog}>
        {children}
      </Button.Primary>
      {reactTreeNode}
    </>
  );
};
enum ModalType {
  EDIT_TITLE = "EDIT_TITLE",
  DELETE_MAP = "DELETE_MAP",
  CREATE_MAP = "CREATE_MAP",
  CREATE_MAP_FROM_URL = "CREATE_MAP_FROM_URL",
}

type ModalStates =
  | {
      type: ModalType.CREATE_MAP;
      data: {
        file: File;
      };
    }
  | {
      type: ModalType.CREATE_MAP_FROM_URL;
    }
  | {
      type: ModalType.DELETE_MAP;
      data: {
        mapId: string;
      };
    }
  | {
      type: ModalType.EDIT_TITLE;
      data: {
        mapId: string;
      };
    };

type SelectMapModalProps = {
  closeModal: () => void;
  setLoadedMapId: (id: string) => void;
  liveMapId: null | string;
  loadedMapId: null | string;
  canClose: boolean;
};

const SelectMapModal_MapsQuery = graphql`
  query selectMapModal_MapsQuery($titleNeedle: String!) {
    ...selectMapModal_MapList_MapsFragment @arguments(titleNeedle: $titleNeedle)
  }
`;

const SelectMapModal_MapImageRequestUploadMutation = graphql`
  mutation selectMapModal_MapImageRequestUploadMutation(
    $input: MapImageRequestUploadInput!
  ) {
    mapImageRequestUpload(input: $input) {
      id
      uploadUrl
    }
  }
`;

const SelectMapModal_MapCreateMutation = graphql`
  mutation selectMapModal_MapCreateMutation($input: MapCreateInput!) {
    mapCreate(input: $input) {
      ... on MapCreateSuccess {
        __typename
        createdMap {
          id
          title
          mapImageUrl
        }
      }
      ... on MapCreateError {
        __typename
        reason
      }
    }
  }
`;

const SelectMapModal_MapDeleteMutation = graphql`
  mutation selectMapModal_MapDeleteMutation($input: MapDeleteInput!) {
    mapDelete(input: $input)
  }
`;

const SelectMapModal_MapUpdateTitleMutation = graphql`
  mutation selectMapModal_MapUpdateTitleMutation($input: MapUpdateTitleInput!) {
    mapUpdateTitle(input: $input) {
      updatedMap {
        id
        title
      }
    }
  }
`;

const SelectMapModal_MapList_MapsFragment = graphql`
  fragment selectMapModal_MapList_MapsFragment on Query
  @argumentDefinitions(
    first: { type: "Int", defaultValue: 20 }
    after: { type: "String" }
    titleNeedle: { type: "String!" }
  )
  @refetchable(queryName: "selectMapModal_MapList_MoreMapsQuery") {
    maps(first: $first, after: $after, titleNeedle: $titleNeedle)
      @connection(key: "selectMapModal_MapList_maps") {
      __id
      edges {
        node {
          id
          title
          mapImageUrl
        }
      }
    }
  }
`;

const MapList = (props: {
  activeMapId: string | null;
  liveMapId: string | null;
  setActiveMapId: (mapId: string) => void;
  filter: string;
  maps: selectMapModal_MapList_MapsFragment$key;
  reportMapsConnectionId: (mapsConnectionId: string) => void;
}): React.ReactElement => {
  const { data, isLoading, hasNext, loadNext } = usePagination(
    SelectMapModal_MapList_MapsFragment,
    props.maps
  );
  const onScroll = useInvokeOnScrollEnd(() => {
    if (isLoading || !hasNext) {
      return;
    }
    loadNext(20);
  });

  React.useEffect(() => props.reportMapsConnectionId(data.maps.__id));

  return (
    <ScrollableList.List onScroll={onScroll}>
      {data.maps.edges.map((item) => (
        <ScrollableList.ListItem key={item.node.id}>
          <ScrollableList.ListItemButton
            tabIndex={1}
            isActive={item.node.id === props.activeMapId}
            onClick={() => {
              props.setActiveMapId(item.node.id);
            }}
          >
            {item.node.title}{" "}
            {item.node.id === props.liveMapId ? "(live)" : null}
          </ScrollableList.ListItemButton>
        </ScrollableList.ListItem>
      ))}
    </ScrollableList.List>
  );
};

const SelectMapModal_ActiveMap_MapFragment = graphql`
  fragment selectMapModal_ActiveMap_MapFragment on Map {
    id
    title
    mapImageUrl
    mediaType
  }
`;

const ActiveMap = (props: {
  activeMap: selectMapModal_ActiveMap_MapFragment$key;
  setModalState: React.Dispatch<React.SetStateAction<ModalStates | null>>;
  setLoadedMapId: (loadedMapId: string) => void;
}): React.ReactElement => {
  const activeMap = useFragment(
    SelectMapModal_ActiveMap_MapFragment,
    props.activeMap
  );

  return (
    <Modal.Content>
      <div
        style={{
          display: "flex",
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: 16,
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: `0.5rem 16px 0.5rem 0`,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {activeMap.title}
        </h3>
        <Button.Tertiary
          iconOnly
          small
          onClick={() => {
            props.setModalState({
              type: ModalType.EDIT_TITLE,
              data: { mapId: activeMap.id },
            });
          }}
        >
          <Icon.Edit boxSize="16px" />
        </Button.Tertiary>
      </div>
      <div
        style={{
          height: "100%",
          width: "100%",
          overflowY: "scroll",
        }}
      >
        {activeMap.mediaType === "video" ? (
          <video
            src={activeMap.mapImageUrl}
            style={{ width: "100%" }}
            muted
            playsInline
            controls
          />
        ) : (
          <img src={activeMap.mapImageUrl} style={{ width: "100%" }} />
        )}
      </div>
      <div
        style={{
          display: "flex",
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 20,
          paddingBottom: 16,
        }}
      >
        <div>
          <Button.Tertiary
            tabIndex={2}
            onClick={() => {
              props.setModalState({
                type: ModalType.DELETE_MAP,
                data: { mapId: activeMap.id },
              });
            }}
          >
            <Icon.Trash boxSize="20px" />
            <span>Supprimer</span>
          </Button.Tertiary>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Button.Primary
            tabIndex={1}
            onClick={() => {
              props.setLoadedMapId(activeMap.id);
            }}
          >
            <Icon.Check boxSize="20px" />
            <span>Charger la carte</span>
          </Button.Primary>
        </div>
      </div>
    </Modal.Content>
  );
};

const SelectMapModal_ActiveMapQuery = graphql`
  query selectMapModal_ActiveMapQuery($activeMapId: ID!) {
    map(id: $activeMapId) {
      ...selectMapModal_ActiveMap_MapFragment
    }
  }
`;

export const SelectMapModal = ({
  closeModal,
  setLoadedMapId,
  liveMapId,
  loadedMapId,
  canClose,
}: SelectMapModalProps): React.ReactElement => {
  const [activeMapId, setActiveMapId] = React.useState(loadedMapId);
  const [modalState, setModalState] = React.useState<ModalStates | null>(null);
  const [filter, setFilterValue] = React.useState("");

  const response = useQuery<selectMapModal_MapsQuery>(
    SelectMapModal_MapsQuery,
    React.useMemo(
      () => ({
        titleNeedle: filter,
      }),
      [filter]
    )
  );
  const activeMapResponse = useQuery<selectMapModal_ActiveMapQuery>(
    SelectMapModal_ActiveMapQuery,
    React.useMemo(
      () => ({
        activeMapId: activeMapId ?? "",
      }),
      [activeMapId]
    ),
    { skip: !activeMapId }
  );

  const [mapCreateFromUrl] =
    useMutation<selectMapModal_MapCreateFromUrlMutation>(
      graphql`
        mutation selectMapModal_MapCreateFromUrlMutation(
          $input: MapCreateFromUrlInput!
        ) {
          mapCreateFromUrl(input: $input) {
            ... on MapCreateSuccess {
              __typename
              createdMap {
                id
                title
                mapImageUrl
              }
            }
            ... on MapCreateError {
              __typename
              reason
            }
          }
        }
      `
    );

  const [mapImageRequestUpload] =
    useMutation<selectMapModal_MapImageRequestUploadMutation>(
      SelectMapModal_MapImageRequestUploadMutation
    );
  const [mapCreate] = useMutation<selectMapModal_MapCreateMutation>(
    SelectMapModal_MapCreateMutation
  );
  const [mapDelete] = useMutation<selectMapModal_MapDeleteMutation>(
    SelectMapModal_MapDeleteMutation
  );
  const [mapUpdateTitle] = useMutation<selectMapModal_MapUpdateTitleMutation>(
    SelectMapModal_MapUpdateTitleMutation
  );

  const onChangeFilter = React.useCallback(
    (ev) => {
      setFilterValue(ev.target.value);
    },
    [setFilterValue]
  );

  // TODO: find a better way of propagating the inner relay id to his level :)
  const mapsConnectionIdRef = React.useRef("");

  const beforeCreateMap = React.useCallback((file) => {
    setModalState({ type: ModalType.CREATE_MAP, data: { file } });
  }, []);

  const closeIfPossible = React.useCallback(() => {
    if (!canClose) {
      return;
    }
    closeModal();
  }, [closeModal, canClose]);

  return (
    <>
      <Modal onClickOutside={closeIfPossible} onPressEscape={closeIfPossible}>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading2>
              <Icon.Map boxSize="28px" /> Bibliothèque de cartes
            </Modal.Heading2>
            <div style={{ flex: 1, textAlign: "right" }}>
              {canClose ? (
                <Button.Tertiary
                  tabIndex={1}
                  style={{ marginLeft: 8 }}
                  onClick={closeModal}
                >
                  Fermer
                </Button.Tertiary>
              ) : null}
            </div>
          </Modal.Header>
          <Modal.Body style={{ display: "flex", height: "80vh" }} noPadding>
            <Modal.Aside>
              <div
                style={{
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 10,
                  paddingBottom: 10,
                }}
              >
                <Input
                  tabIndex={1}
                  placeholder="Filtrer"
                  value={filter}
                  onChange={onChangeFilter}
                  onKeyDown={(ev) => {
                    if (ev.keyCode === 27 && filter !== "") {
                      ev.stopPropagation();
                      setFilterValue("");
                    }
                  }}
                />
              </div>
              {response.data ? (
                <MapList
                  activeMapId={activeMapId}
                  liveMapId={liveMapId}
                  setActiveMapId={setActiveMapId}
                  filter={filter}
                  maps={response.data}
                  reportMapsConnectionId={(mapsConnectionId) => {
                    mapsConnectionIdRef.current = mapsConnectionId;
                  }}
                />
              ) : null}

              <Modal.Footer>
                <CreateNewMapButton
                  tabIndex={1}
                  fullWidth
                  onSelectFile={(file) => {
                    beforeCreateMap(file);
                  }}
                >
                  <>
                    <Icon.Plus boxSize="20px" /> <span>Nouvelle carte</span>
                  </>
                </CreateNewMapButton>
                <Button.Tertiary
                  tabIndex={1}
                  fullWidth
                  style={{ marginTop: 4 }}
                  onClick={() =>
                    setModalState({ type: ModalType.CREATE_MAP_FROM_URL })
                  }
                >
                  <Icon.Play boxSize="20px" /> <span>Carte YouTube</span>
                </Button.Tertiary>
              </Modal.Footer>
            </Modal.Aside>
            {activeMapResponse.data?.map ? (
              <ActiveMap
                activeMap={activeMapResponse.data.map}
                setLoadedMapId={setLoadedMapId}
                setModalState={setModalState}
              />
            ) : null}
          </Modal.Body>
        </Modal.Dialog>
      </Modal>
      {modalState ? (
        modalState.type === ModalType.EDIT_TITLE ? (
          <ChangeMapTitleModal
            closeModal={() => setModalState(null)}
            updateMapTitle={(newTitle) =>
              mapUpdateTitle({
                variables: {
                  input: {
                    mapId: modalState.data.mapId,
                    newTitle,
                  },
                },
              })
            }
          />
        ) : modalState.type === ModalType.DELETE_MAP ? (
          <DeleteMapModal
            closeModal={() => setModalState(null)}
            deleteMap={() => {
              const mapId = modalState.data.mapId;
              mapDelete({
                variables: {
                  input: {
                    mapId,
                  },
                },
                updater: (store) => {
                  const mapsConnection = store.get(mapsConnectionIdRef.current);
                  if (mapsConnection == null) {
                    return;
                  }
                  ConnectionHandler.deleteNode(mapsConnection, mapId);
                },
                onCompleted: () => {
                  setModalState(null);
                  setActiveMapId((activeMapId) =>
                    activeMapId === mapId ? null : activeMapId
                  );
                },
              });
            }}
          />
        ) : modalState.type === ModalType.CREATE_MAP ? (
          <CreateNewMapModal
            closeModal={() => {
              setModalState(null);
            }}
            file={modalState.data.file}
            createMap={async (title) => {
              const hash = await generateSHA256FileHash(modalState.data.file);
              // 1. request file upload
              const result = await mapImageRequestUpload({
                variables: {
                  input: {
                    sha256: hash,
                    extension: modalState.data.file.name.split(".").pop() ?? "",
                  },
                },
              });

              // 2. upload file
              const uploadResponse = await fetch(
                result.mapImageRequestUpload.uploadUrl,
                {
                  method: "PUT",
                  body: modalState.data.file,
                }
              );

              if (uploadResponse.status !== 200) {
                const body = await uploadResponse.text();
                throw new Error(
                  "Received invalid response code: " +
                    uploadResponse.status +
                    "\n\n" +
                    body
                );
              }

              // 3. create map
              await mapCreate({
                variables: {
                  input: {
                    title,
                    mapImageUploadId: result.mapImageRequestUpload.id,
                  },
                },
                updater: (store, result) => {
                  if (result.mapCreate.__typename !== "MapCreateSuccess") {
                    return;
                  }

                  const mapsConnection = store.get(mapsConnectionIdRef.current);
                  if (mapsConnection == null) {
                    return;
                  }

                  const createdMap = store.get(result.mapCreate.createdMap.id);

                  if (createdMap == null) {
                    return;
                  }

                  const edge = ConnectionHandler.createEdge(
                    store,
                    mapsConnection,
                    createdMap,
                    "Map"
                  );

                  ConnectionHandler.insertEdgeAfter(mapsConnection, edge);
                },
                onCompleted: (response) => {
                  if (response.mapCreate.__typename === "MapCreateSuccess") {
                    setActiveMapId(response.mapCreate.createdMap.id);
                  }
                },
              });

              setModalState(null);
            }}
          />
        ) : modalState.type === ModalType.CREATE_MAP_FROM_URL ? (
          <YouTubeUrlModal
            closeModal={() => setModalState(null)}
            onCreate={(title, videoUrl) => {
              mapCreateFromUrl({
                variables: { input: { title, videoUrl } },
                updater: (store, result) => {
                  if (result.mapCreateFromUrl.__typename !== "MapCreateSuccess")
                    return;
                  const mapsConnection = store.get(mapsConnectionIdRef.current);
                  if (mapsConnection == null) return;
                  const createdMap = store.get(
                    result.mapCreateFromUrl.createdMap.id
                  );
                  if (createdMap == null) return;
                  const edge = ConnectionHandler.createEdge(
                    store,
                    mapsConnection,
                    createdMap,
                    "Map"
                  );
                  ConnectionHandler.insertEdgeAfter(mapsConnection, edge);
                },
                onCompleted: (response) => {
                  if (
                    response.mapCreateFromUrl.__typename === "MapCreateSuccess"
                  ) {
                    setActiveMapId(response.mapCreateFromUrl.createdMap.id);
                  }
                  setModalState(null);
                },
              });
            }}
          />
        ) : null
      ) : null}
    </>
  );
};

const isValidYouTubeUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return !!u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.length > 1;
    }
    return false;
  } catch {
    return false;
  }
};

const YouTubeUrlModal = ({
  closeModal,
  onCreate,
}: {
  closeModal: () => void;
  onCreate: (title: string, videoUrl: string) => void;
}) => {
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [urlError, setUrlError] = React.useState<string | null>(null);

  const submit = React.useCallback(() => {
    let hasError = false;
    if (!title.trim()) {
      setTitleError("Veuillez saisir un titre.");
      hasError = true;
    }
    if (!url.trim()) {
      setUrlError("Veuillez saisir une URL YouTube.");
      hasError = true;
    } else if (!isValidYouTubeUrl(url.trim())) {
      setUrlError("URL invalide. Ex: https://www.youtube.com/watch?v=...");
      hasError = true;
    }
    if (hasError) return;
    onCreate(title.trim(), url.trim());
    closeModal();
  }, [title, url, onCreate, closeModal]);

  return (
    <Modal onClickOutside={closeModal} onPressEscape={closeModal}>
      <Modal.Dialog size={ModalDialogSize.SMALL} onSubmit={submit}>
        <Modal.Header>
          <Modal.Heading3>Carte YouTube</Modal.Heading3>
        </Modal.Header>
        <Modal.Body>
          <InputGroup
            autoFocus
            placeholder="Titre de la carte"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(null);
            }}
            error={titleError}
          />
          <div style={{ height: 8 }} />
          <InputGroup
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlError(null);
            }}
            error={urlError}
          />
        </Modal.Body>
        <Modal.Footer>
          <Modal.Actions>
            <Modal.ActionGroup>
              <div>
                <Button.Tertiary type="button" onClick={closeModal}>
                  Annuler
                </Button.Tertiary>
              </div>
              <div>
                <Button.Primary type="submit">Nouvelle carte</Button.Primary>
              </div>
            </Modal.ActionGroup>
          </Modal.Actions>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
};

const extractDefaultTitleFromFileName = (fileName: string) => {
  const parts = fileName.split(".");
  if (parts.length < 2) return fileName;
  parts.pop();
  return parts.join(".");
};

const CreateNewMapModal = ({
  closeModal,
  file,
  createMap,
}: {
  closeModal: () => void;
  file: File;
  createMap: (title: string) => void;
}): React.ReactElement => {
  const [inputValue, setInputValue] = React.useState(() =>
    extractDefaultTitleFromFileName(file.name)
  );
  const [error, setError] = React.useState<string | null>("");

  const onChangeInputValue = React.useCallback(
    (ev) => {
      setInputValue(ev.target.value);
      setError(null);
    },
    [setInputValue, setError]
  );

  return (
    <Modal onClickOutside={closeModal} onPressEscape={closeModal}>
      <Modal.Dialog size={ModalDialogSize.SMALL}>
        <Modal.Header>
          <Modal.Heading3>Nouvelle carte</Modal.Heading3>
        </Modal.Header>
        <Modal.Body>
          <InputGroup
            autoFocus
            placeholder="Titre de la carte"
            value={inputValue}
            onChange={onChangeInputValue}
            error={error}
          />
        </Modal.Body>
        <Modal.Footer>
          <Modal.Actions>
            <Modal.ActionGroup>
              <div>
                <Button.Tertiary onClick={closeModal} type="button">
                  Annuler
                </Button.Tertiary>
              </div>
              <div>
                <Button.Primary
                  type="submit"
                  onClick={() => {
                    if (inputValue.trim().length === 0) {
                      setError("Veuillez saisir un nom de carte.");
                      return;
                    }
                    createMap(inputValue);
                    closeModal();
                  }}
                >
                  Créer la carte
                </Button.Primary>
              </div>
            </Modal.ActionGroup>
          </Modal.Actions>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
};

const ChangeMapTitleModal: React.FC<{
  closeModal: () => void;
  updateMapTitle: (newTitle: string) => void;
}> = ({ closeModal, updateMapTitle: updateMap }): React.ReactElement => {
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const onChangeInputValue = React.useCallback(
    (ev) => {
      setInputValue(ev.target.value);
    },
    [setInputValue]
  );
  const submit = React.useCallback(() => {
    if (inputValue.trim().length === 0) {
      setError("Veuillez saisir un nom de carte.");
      return;
    }
    updateMap(inputValue);
    closeModal();
  }, [inputValue, closeModal, updateMap, setError]);

  return (
    <Modal onClickOutside={closeModal} onPressEscape={closeModal}>
      <Modal.Dialog size={ModalDialogSize.SMALL} onSubmit={submit}>
        <Modal.Header>
          <Modal.Heading3>Modifier le titre</Modal.Heading3>
        </Modal.Header>

        <Modal.Body>
          <InputGroup
            autoFocus
            placeholder="Nouveau titre"
            value={inputValue}
            onChange={onChangeInputValue}
            error={error}
          />
        </Modal.Body>
        <Modal.Footer>
          <Modal.Actions>
            <Modal.ActionGroup>
              <div>
                <Button.Tertiary type="button" onClick={closeModal}>
                  Annuler
                </Button.Tertiary>
              </div>
              <div>
                <Button.Primary type="submit">Modifier le titre</Button.Primary>
              </div>
            </Modal.ActionGroup>
          </Modal.Actions>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
};

const DeleteMapModal: React.FC<{
  closeModal: () => void;
  deleteMap: () => void;
}> = ({ closeModal, deleteMap }): React.ReactElement => {
  return (
    <Modal onClickOutside={closeModal} onPressEscape={closeModal}>
      <Modal.Dialog size={ModalDialogSize.SMALL}>
        <Modal.Header>
          <Modal.Heading3>Supprimer la carte</Modal.Heading3>
        </Modal.Header>
        <Modal.Body>Voulez-vous vraiment supprimer cette carte ?</Modal.Body>
        <Modal.Footer>
          <Modal.Actions>
            <Modal.ActionGroup>
              <div>
                <Button.Tertiary type="submit" onClick={closeModal}>
                  Annuler
                </Button.Tertiary>
              </div>
              <div>
                <Button.Primary
                  type="button"
                  onClick={() => {
                    deleteMap();
                  }}
                >
                  Supprimer
                </Button.Primary>
              </div>
            </Modal.ActionGroup>
          </Modal.Actions>
        </Modal.Footer>
      </Modal.Dialog>
    </Modal>
  );
};
