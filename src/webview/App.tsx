import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FiCode, FiDownload, FiMaximize2, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { toPng } from 'html-to-image';
import { toYamlString } from './yaml';

const PATH_SEPARATOR = '\u001f';
const ROOT_NODE_PATH = '__root__';
const CONTEXT_MENU_WIDTH = 190;
const CONTEXT_MENU_PADDING = 12;
const NODE_X_SPACING = 400;
const NODE_Y_SPACING = 150;

type NodeKind = 'object' | 'array' | 'value';

interface ContentItem {
  key: string;
  value: unknown;
  nestedJsonPath?: string;
  hasNestedJson?: boolean;
  isNestedJsonExpanded?: boolean;
}

interface NodeContextMenuPayload {
  nodePath: string;
  hasChildren: boolean;
  isCollapsed: boolean;
  isRoot: boolean;
  hasHiddenDescendants: boolean;
}

interface ContextMenuState extends NodeContextMenuPayload {
  x: number;
  y: number;
}

interface NodeData extends NodeContextMenuPayload {
  content: ContentItem[];
  itemCount: number;
  kind: NodeKind;
  title: string;
  isParsedNode?: boolean;
  valueText?: string;
  onNestedJsonAction: (path: string) => void;
  onOpenContextMenu: (
    event: React.MouseEvent<HTMLDivElement>,
    payload: NodeContextMenuPayload
  ) => void;
}

interface ChildNodeCandidate {
  key: string;
  value: unknown;
  pathSegments: string[];
  title?: string;
  isParsedNode?: boolean;
  asValueNode?: boolean;
  forceChildNodes?: boolean;
}

interface GraphBuildOptions {
  expandedPaths: Set<string>;
  hiddenPaths: Set<string>;
  collapsedPaths: Set<string>;
  onNestedJsonAction: (path: string) => void;
  onOpenContextMenu: (
    event: React.MouseEvent<HTMLDivElement>,
    payload: NodeContextMenuPayload
  ) => void;
}

interface AppProps {
  initialData?: unknown;
  dataSignature?: string;
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: {
    stroke: '#fff',
    strokeWidth: 2,
    strokeDasharray: '5,5'
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20
  }
} as const;

const createPathId = (pathSegments: string[]) => (
  pathSegments.length > 0 ? pathSegments.join(PATH_SEPARATOR) : ROOT_NODE_PATH
);

const formatNodeTitle = (nodePath: string) => {
  if (nodePath === ROOT_NODE_PATH) {
    return 'root';
  }

  const segments = nodePath.split(PATH_SEPARATOR);
  return segments[segments.length - 1];
};

const formatEntryLabel = (kind: NodeKind, key: string) => (
  kind === 'array' ? `[${key}]` : key
);

const getNodeSummaryLabel = (kind: NodeKind, itemCount: number) => {
  if (kind === 'value') {
    return 'text';
  }

  const noun = kind === 'array' ? 'items' : 'fields';
  return `${itemCount} ${noun}`;
};

const isSamePathOrDescendant = (candidatePath: string, parentPath: string) => (
  candidatePath === parentPath || candidatePath.startsWith(`${parentPath}${PATH_SEPARATOR}`)
);

const isDescendantPath = (candidatePath: string, parentPath: string) => {
  if (candidatePath === parentPath) {
    return false;
  }

  if (parentPath === ROOT_NODE_PATH) {
    return candidatePath !== ROOT_NODE_PATH;
  }

  return candidatePath.startsWith(`${parentPath}${PATH_SEPARATOR}`);
};

const tryParseNestedJson = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue || !['{', '['].includes(trimmedValue[0])) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(trimmedValue);
    return typeof parsedValue === 'object' && parsedValue !== null ? parsedValue : null;
  } catch {
    return null;
  }
};

const getNodeChrome = (data: NodeData) => {
  if (data.isParsedNode) {
    return {
      background: '#213425',
      border: '#4CAF50',
      hoverBackground: '#27432C',
      hoverBorder: '#7BD67F'
    };
  }

  if (data.kind === 'array') {
    return {
      background: '#24303A',
      border: '#44637A',
      hoverBackground: '#2B3944',
      hoverBorder: '#64B5F6'
    };
  }

  if (data.kind === 'value') {
    return {
      background: '#35291F',
      border: '#8D6E63',
      hoverBackground: '#413126',
      hoverBorder: '#FFCC80'
    };
  }

  return {
    background: '#2B2B2B',
    border: '#3D3D3D',
    hoverBackground: '#333333',
    hoverBorder: '#64B5F6'
  };
};

const CustomControls: React.FC<{
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  onExportYaml: () => void;
}> = ({ reactFlowWrapper, onExportYaml }) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const downloadImage = () => {
    if (!reactFlowWrapper.current) {
      return;
    }

    toPng(reactFlowWrapper.current, {
      backgroundColor: '#1A1A1A',
      quality: 1,
      pixelRatio: 2
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'json-visualization.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error('Image export failed:', error);
      });
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: '20px',
        top: '20px',
        zIndex: 4,
        display: 'flex',
        gap: '8px',
        padding: '6px',
        borderRadius: '6px',
        background: '#2B2B2B',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <button className="control-button" onClick={() => zoomIn()} title="Zoom In">
        <FiZoomIn size={18} />
      </button>
      <button className="control-button" onClick={() => zoomOut()} title="Zoom Out">
        <FiZoomOut size={18} />
      </button>
      <button
        className="control-button"
        onClick={() => fitView({ padding: 0.2 })}
        title="Fit View"
      >
        <FiMaximize2 size={18} />
      </button>
      <button className="control-button" onClick={onExportYaml} title="Download as YAML">
        <FiCode size={18} />
      </button>
      <button className="control-button" onClick={downloadImage} title="Download as PNG">
        <FiDownload size={18} />
      </button>
    </div>
  );
};

const AutoFitView: React.FC<{ signature: string }> = ({ signature }) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({
        padding: 0.3,
        duration: 250
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fitView, signature]);

  return null;
};

const CustomNode = memo(({ data }: NodeProps<NodeData>) => {
  const chrome = getNodeChrome(data);

  return (
    <div
      style={{
        background: chrome.background,
        color: '#fff',
        border: `1px solid ${chrome.border}`,
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
        fontFamily: "'Menlo', 'Consolas', 'Monaco', monospace",
        minWidth: '200px',
        position: 'relative',
        cursor: 'move',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        transition: 'box-shadow 0.2s, transform 0.1s, background 0.2s, border-color 0.2s',
        userSelect: 'none'
      }}
      onContextMenu={(event) => data.onOpenContextMenu(event, {
        nodePath: data.nodePath,
        hasChildren: data.hasChildren,
        isCollapsed: data.isCollapsed,
        isRoot: data.isRoot,
        hasHiddenDescendants: data.hasHiddenDescendants
      })}
      onMouseEnter={(event) => {
        event.currentTarget.style.boxShadow = '0 4px 15px rgba(100, 181, 246, 0.4)';
        event.currentTarget.style.transform = 'translateY(-2px)';
        event.currentTarget.style.borderColor = chrome.hoverBorder;
        event.currentTarget.style.background = chrome.hoverBackground;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.borderColor = chrome.border;
        event.currentTarget.style.background = chrome.background;
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#3D3D3D', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#3D3D3D', width: '8px', height: '8px' }}
      />

      <div
        className="node-drag-handle"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: data.content.length > 0 ? '10px' : '6px',
          paddingBottom: data.content.length > 0 ? '8px' : '0',
          borderBottom: data.content.length > 0 ? '1px solid #3D3D3D' : 'none'
        }}
      >
        <span
          style={{
            color: '#E6E6E6',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
        >
          {data.title}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: data.kind === 'array' ? '#9CDCFE' : data.kind === 'value' ? '#FFCC80' : '#C5A5FF',
              background: data.kind === 'array'
                ? 'rgba(86, 156, 214, 0.12)'
                : data.kind === 'value'
                  ? 'rgba(255, 204, 128, 0.12)'
                  : 'rgba(197, 165, 255, 0.12)',
              border: `1px solid ${
                data.kind === 'array'
                  ? 'rgba(86, 156, 214, 0.35)'
                  : data.kind === 'value'
                    ? 'rgba(255, 204, 128, 0.35)'
                    : 'rgba(197, 165, 255, 0.35)'
              }`,
              borderRadius: '999px',
              padding: '2px 6px'
            }}
          >
            {data.kind}
          </span>
          {data.isParsedNode && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#A5D6A7',
                background: 'rgba(76, 175, 80, 0.14)',
                border: '1px solid rgba(76, 175, 80, 0.35)',
                borderRadius: '999px',
                padding: '2px 6px'
              }}
            >
              parsed
            </span>
          )}
          <span style={{ fontSize: '10px', color: '#B3B3B3' }}>
            {getNodeSummaryLabel(data.kind, data.itemCount)}
          </span>
        </div>
      </div>

      {data.kind === 'value' && data.valueText && (
        <div
          className="nodrag nopan"
          style={{
            color: '#F5E6CC',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '13px',
            lineHeight: 1.5,
            userSelect: 'text',
            background: 'rgba(0,0,0,0.18)',
            border: '1px solid #3D3D3D',
            borderRadius: '6px',
            padding: '8px 10px'
          }}
        >
          {data.valueText}
        </div>
      )}

      {data.kind !== 'value' && data.content.length === 0 && (
        <div
          className="nodrag nopan"
          style={{
            color: '#8B949E',
            fontSize: '12px',
            fontStyle: 'italic'
          }}
        >
          {data.kind === 'array' ? 'Contains nested items only' : 'Contains nested objects only'}
        </div>
      )}

      {data.kind !== 'value' && (
        <div className="nodrag nopan">
          {data.content.map((item, index) => (
            <div
              key={`${item.key}-${index}`}
              style={{
                padding: '4px 0',
                borderBottom: index < data.content.length - 1 ? '1px solid #3D3D3D' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  flexDirection: typeof item.value === 'string' && item.value.includes('\n') ? 'column' : 'row'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                  <span style={{ color: data.kind === 'array' ? '#9CDCFE' : '#64B5F6' }}>{item.key}</span>
                  <span style={{ color: '#888' }}>:</span>
                  {typeof item.value === 'string' && item.value.includes('\n') ? (
                    <div
                      style={{
                        color: '#98C379',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        flex: 1,
                        userSelect: 'text',
                        background: 'rgba(0,0,0,0.18)',
                        border: '1px solid #3D3D3D',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        lineHeight: 1.45
                      }}
                    >
                      {item.value}
                    </div>
                  ) : (
                    <span
                      style={{
                        color: typeof item.value === 'string'
                          ? '#98C379'
                          : typeof item.value === 'number'
                            ? '#E06C75'
                            : typeof item.value === 'boolean'
                              ? '#61AFEF'
                              : '#888',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        flex: 1,
                        userSelect: 'text'
                      }}
                    >
                      {String(item.value)}
                    </span>
                  )}
                </div>
              </div>
              {typeof item.value === 'string' && item.hasNestedJson && item.nestedJsonPath && (
                <div className="nodrag nopan">
                  <button
                    type="button"
                    className="nodrag nopan"
                    onMouseDown={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => {
                      event.stopPropagation();
                      data.onNestedJsonAction(item.nestedJsonPath!);
                    }}
                    style={{
                      background: item.isNestedJsonExpanded ? '#64B5F6' : 'transparent',
                      color: item.isNestedJsonExpanded ? '#1A1A1A' : '#64B5F6',
                      border: '1px solid #64B5F6',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      pointerEvents: 'auto'
                    }}
                    onMouseEnter={(event) => {
                      if (!item.isNestedJsonExpanded) {
                        event.currentTarget.style.background = 'rgba(100, 181, 246, 0.12)';
                      }
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = item.isNestedJsonExpanded
                        ? '#64B5F6'
                        : 'transparent';
                    }}
                  >
                    {item.isNestedJsonExpanded ? 'Hide parsed node' : 'Parse JSON value'}
                  </button>
                  {item.isNestedJsonExpanded && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#A5D6A7' }}>
                      Parsed node created to the right.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

const nodeTypes = {
  custom: CustomNode
};

const buildGraph = (json: unknown, options: GraphBuildOptions) => {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;
  let rowCursor = 0;

  interface ProcessedNode {
    id: string;
    row: number;
  }

  const processNode = (
    value: unknown,
    level = 0,
    pathSegments: string[] = [],
    nodeOptions?: {
      title?: string;
      isParsedNode?: boolean;
      asValueNode?: boolean;
      forceChildNodes?: boolean;
    }
  ): ProcessedNode | null => {
    const nodePath = createPathId(pathSegments);
    const nodeKind: NodeKind = nodeOptions?.asValueNode
      ? 'value'
      : Array.isArray(value)
        ? 'array'
        : 'object';

    if (options.hiddenPaths.has(nodePath)) {
      return null;
    }

    if (nodeKind !== 'value' && (typeof value !== 'object' || value === null)) {
      return null;
    }

    const currentId = `node-${nodeId++}`;
    const content: ContentItem[] = [];
    const childNodeCandidates: ChildNodeCandidate[] = [];

    if (nodeKind === 'value') {
      const row = rowCursor++;

      nodes.push({
        id: currentId,
        type: 'custom',
        data: {
          content: [],
          title: nodeOptions?.title ?? formatNodeTitle(nodePath),
          kind: 'value',
          itemCount: 1,
          isParsedNode: nodeOptions?.isParsedNode,
          valueText: String(value),
          nodePath,
          hasChildren: false,
          isCollapsed: false,
          isRoot: nodePath === ROOT_NODE_PATH,
          hasHiddenDescendants: false,
          onNestedJsonAction: options.onNestedJsonAction,
          onOpenContextMenu: options.onOpenContextMenu
        },
        position: {
          x: level * NODE_X_SPACING,
          y: row * NODE_Y_SPACING
        }
      });

      return { id: currentId, row };
    }

    const structuredValue = value as Record<string, unknown>;
    const forceChildNodes = nodeOptions?.forceChildNodes ?? false;

    Object.entries(structuredValue).forEach(([key, childValue]) => {
      const childPathSegments = [...pathSegments, key];
      const displayKey = formatEntryLabel(nodeKind, key);

      if (childValue !== null && typeof childValue === 'object') {
        childNodeCandidates.push({
          key: displayKey,
          value: childValue,
          pathSegments: childPathSegments,
          title: displayKey
        });
        return;
      }

      const nestedJsonPath = createPathId(childPathSegments);
      const parsedNestedJson = tryParseNestedJson(childValue);
      const isNestedJsonExpanded = parsedNestedJson !== null
        && options.expandedPaths.has(nestedJsonPath);

      if (parsedNestedJson !== null && isNestedJsonExpanded) {
        childNodeCandidates.push({
          key: `${displayKey} (parsed)`,
          value: parsedNestedJson,
          pathSegments: childPathSegments,
          title: `${displayKey} parsed`,
          isParsedNode: true,
          forceChildNodes: true
        });
        return;
      }

      if (forceChildNodes) {
        childNodeCandidates.push({
          key: displayKey,
          value: childValue,
          pathSegments: childPathSegments,
          title: displayKey,
          asValueNode: true
        });
        return;
      }

      content.push({
        key: displayKey,
        value: childValue,
        hasNestedJson: parsedNestedJson !== null,
        nestedJsonPath,
        isNestedJsonExpanded
      });
    });

    const hasChildren = childNodeCandidates.length > 0;
    const isCollapsed = options.collapsedPaths.has(nodePath);
    const hasHiddenDescendants = Array.from(options.hiddenPaths).some((hiddenPath) => (
      isDescendantPath(hiddenPath, nodePath)
    ));

    const visibleChildren = isCollapsed
      ? []
      : childNodeCandidates.filter(({ pathSegments: childPathSegments }) => (
        !options.hiddenPaths.has(createPathId(childPathSegments))
      ));

    const childResults: Array<{ id: string; key: string; row: number }> = [];

    visibleChildren.forEach((childNodeCandidate) => {
      const childNode = processNode(
        childNodeCandidate.value,
        level + 1,
        childNodeCandidate.pathSegments,
        {
          title: childNodeCandidate.title,
          isParsedNode: childNodeCandidate.isParsedNode,
          asValueNode: childNodeCandidate.asValueNode,
          forceChildNodes: childNodeCandidate.forceChildNodes
        }
      );

      if (!childNode) {
        return;
      }

      childResults.push({
        id: childNode.id,
        key: childNodeCandidate.key,
        row: childNode.row
      });
    });

    const row = childResults.length > 0
      ? (childResults[0].row + childResults[childResults.length - 1].row) / 2
      : rowCursor++;

    nodes.push({
      id: currentId,
      type: 'custom',
      data: {
        content,
        title: nodeOptions?.title ?? formatNodeTitle(nodePath),
        kind: nodeKind,
        itemCount: Array.isArray(value) ? value.length : Object.keys(structuredValue).length,
        isParsedNode: nodeOptions?.isParsedNode,
        nodePath,
        hasChildren,
        isCollapsed,
        isRoot: nodePath === ROOT_NODE_PATH,
        hasHiddenDescendants,
        onNestedJsonAction: options.onNestedJsonAction,
        onOpenContextMenu: options.onOpenContextMenu
      },
      position: {
        x: level * NODE_X_SPACING,
        y: row * NODE_Y_SPACING
      },
      style: {
        opacity: content.length > 0 ? 1 : 0.7
      }
    });

    childResults.forEach(({ id, key }) => {
      edges.push({
        id: `edge-${currentId}-${id}`,
        source: currentId,
        target: id,
        label: key,
        type: 'bezier',
        animated: true,
        style: {
          stroke: '#fff',
          strokeWidth: 2
        },
        labelStyle: {
          fill: '#fff',
          fontSize: 12,
          fontWeight: 500
        },
        labelBgStyle: {
          fill: '#2B2B2B',
          fillOpacity: 0.7
        }
      });
    });

    return { id: currentId, row };
  };

  processNode(json);

  return { nodes, edges };
};

export const App: React.FC<AppProps> = ({ initialData, dataSignature }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNestedJsonPaths, setExpandedNestedJsonPaths] = useState<string[]>([]);
  const [hiddenNodePaths, setHiddenNodePaths] = useState<string[]>([]);
  const [collapsedNodePaths, setCollapsedNodePaths] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const data = initialData ?? {
    appName: 'null',
    author: 'proident',
    launched: -60643793.95864394,
    openSource: false,
    stars: 30228844.364910394
  };

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const toggleNestedJson = useCallback((path: string) => {
    setExpandedNestedJsonPaths((currentPaths) => (
      currentPaths.includes(path)
        ? currentPaths.filter((currentPath) => currentPath !== path)
        : [...currentPaths, path]
    ));
  }, []);

  const openContextMenu = useCallback((
    event: React.MouseEvent<HTMLDivElement>,
    payload: NodeContextMenuPayload
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      ...payload,
      x: Math.max(
        CONTEXT_MENU_PADDING,
        Math.min(event.clientX, window.innerWidth - CONTEXT_MENU_WIDTH - CONTEXT_MENU_PADDING)
      ),
      y: Math.max(
        CONTEXT_MENU_PADDING,
        Math.min(event.clientY, window.innerHeight - 220)
      )
    });
  }, []);

  const hideNode = useCallback((path: string) => {
    setHiddenNodePaths((currentPaths) => {
      if (currentPaths.some((currentPath) => isSamePathOrDescendant(path, currentPath))) {
        return currentPaths;
      }

      return [
        ...currentPaths.filter((currentPath) => !isDescendantPath(currentPath, path)),
        path
      ];
    });
    closeContextMenu();
  }, [closeContextMenu]);

  const unhideDescendants = useCallback((path: string) => {
    setHiddenNodePaths((currentPaths) => (
      currentPaths.filter((currentPath) => !isDescendantPath(currentPath, path))
    ));
    closeContextMenu();
  }, [closeContextMenu]);

  const unhideAllNodes = useCallback(() => {
    setHiddenNodePaths([]);
    closeContextMenu();
  }, [closeContextMenu]);

  const collapseNode = useCallback((path: string) => {
    setCollapsedNodePaths((currentPaths) => (
      currentPaths.includes(path) ? currentPaths : [...currentPaths, path]
    ));
    closeContextMenu();
  }, [closeContextMenu]);

  const expandNode = useCallback((path: string) => {
    setCollapsedNodePaths((currentPaths) => (
      currentPaths.filter((currentPath) => currentPath !== path)
    ));
    closeContextMenu();
  }, [closeContextMenu]);

  const exportYaml = useCallback(() => {
    const yaml = `${toYamlString(data)}\n`;
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'json-visualization.yaml';
    link.click();
    URL.revokeObjectURL(objectUrl);
  }, [data]);

  const graph = useMemo(() => buildGraph(data, {
    expandedPaths: new Set(expandedNestedJsonPaths),
    hiddenPaths: new Set(hiddenNodePaths),
    collapsedPaths: new Set(collapsedNodePaths),
    onNestedJsonAction: toggleNestedJson,
    onOpenContextMenu: openContextMenu
  }), [
    collapsedNodePaths,
    data,
    expandedNestedJsonPaths,
    hiddenNodePaths,
    openContextMenu,
    toggleNestedJson
  ]);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph.edges, graph.nodes, setEdges, setNodes]);

  useEffect(() => {
    setExpandedNestedJsonPaths([]);
    setHiddenNodePaths([]);
    setCollapsedNodePaths([]);
    setContextMenu(null);
  }, [dataSignature]);

  const viewportSignature = [
    graph.nodes.length,
    graph.edges.length,
    expandedNestedJsonPaths.join(','),
    hiddenNodePaths.join(','),
    collapsedNodePaths.join(',')
  ].join('|');

  return (
    <div style={{ width: '100%', height: '100vh' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={closeContextMenu}
        defaultEdgeOptions={defaultEdgeOptions}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        snapToGrid
        snapGrid={[15, 15]}
        onNodeDragStart={(_, node) => {
          closeContextMenu();
          node.style = { ...node.style, zIndex: 1000 };
        }}
        onNodeDragStop={(_, node) => {
          node.style = { ...node.style, zIndex: 0 };
        }}
      >
        <AutoFitView signature={viewportSignature} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color="#4A4A4A"
          style={{ backgroundColor: '#1A1A1A' }}
        />
        <CustomControls reactFlowWrapper={reactFlowWrapper} onExportYaml={exportYaml} />
      </ReactFlow>

      {contextMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          onClick={closeContextMenu}
          onContextMenu={(event) => {
            event.preventDefault();
            closeContextMenu();
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: contextMenu.y,
              left: contextMenu.x,
              width: `${CONTEXT_MENU_WIDTH}px`,
              background: '#252526',
              border: '1px solid #3D3D3D',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {!contextMenu.isRoot && (
              <button
                className="control-button"
                style={{
                  width: '100%',
                  height: 'auto',
                  justifyContent: 'flex-start',
                  padding: '8px 10px'
                }}
                onClick={() => hideNode(contextMenu.nodePath)}
              >
                Hide Node
              </button>
            )}
            {contextMenu.hasChildren && !contextMenu.isCollapsed && (
              <button
                className="control-button"
                style={{
                  width: '100%',
                  height: 'auto',
                  justifyContent: 'flex-start',
                  padding: '8px 10px'
                }}
                onClick={() => collapseNode(contextMenu.nodePath)}
              >
                Collapse Node
              </button>
            )}
            {contextMenu.hasChildren && contextMenu.isCollapsed && (
              <button
                className="control-button"
                style={{
                  width: '100%',
                  height: 'auto',
                  justifyContent: 'flex-start',
                  padding: '8px 10px'
                }}
                onClick={() => expandNode(contextMenu.nodePath)}
              >
                Expand Node
              </button>
            )}
            {contextMenu.hasHiddenDescendants && (
              <button
                className="control-button"
                style={{
                  width: '100%',
                  height: 'auto',
                  justifyContent: 'flex-start',
                  padding: '8px 10px'
                }}
                onClick={() => unhideDescendants(contextMenu.nodePath)}
              >
                Unhide Children
              </button>
            )}
            {hiddenNodePaths.length > 0 && (
              <button
                className="control-button"
                style={{
                  width: '100%',
                  height: 'auto',
                  justifyContent: 'flex-start',
                  padding: '8px 10px'
                }}
                onClick={unhideAllNodes}
              >
                Unhide All Nodes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
