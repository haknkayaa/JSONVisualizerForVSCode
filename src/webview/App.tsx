import React, { useRef, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  useReactFlow,
  BackgroundVariant,
  Node,
  Edge,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

import { 
    FiZoomIn, 
    FiZoomOut, 
    FiMaximize2,
    FiDownload
} from 'react-icons/fi';

import { toPng } from 'html-to-image';

// Custom controls component
const CustomControls: React.FC<{ reactFlowWrapper: React.RefObject<HTMLDivElement> }> = ({ reactFlowWrapper }) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const downloadImage = () => {
        if (reactFlowWrapper.current === null) {
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
            <button
                className="control-button"
                onClick={() => zoomIn()}
                title="Zoom In"
            >
                <FiZoomIn size={18} />
            </button>
            <button
                className="control-button"
                onClick={() => zoomOut()}
                title="Zoom Out"
            >
                <FiZoomOut size={18} />
            </button>
            <button
                className="control-button"
                onClick={() => fitView({ padding: 0.2 })}
                title="Fit View"
            >
                <FiMaximize2 size={18} />
            </button>
            <button
                className="control-button"
                onClick={downloadImage}
                title="Download as PNG"
            >
                <FiDownload size={18} />
            </button>
        </div>
    );
};

const flowStyles = {
  background: '#1A1A1A',
  width: '100%',
  height: '100vh',
} as const;

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
  },
} as const;

interface NodeData {
  content: { key: string; value: any }[];
  isObject?: boolean;
}

interface AppProps {
  initialData?: any;
  errorMessage?: string;
}

export const App: React.FC<AppProps> = ({ initialData, errorMessage }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const CustomNode = ({ data }: { data: NodeData }) => (
    <div
      style={{
        background: '#2B2B2B',
        color: '#fff',
        border: '1px solid #3D3D3D',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
        fontFamily: "'Menlo', 'Consolas', 'Monaco', monospace",
        minWidth: '200px',
        position: 'relative',
        cursor: 'move',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        transition: 'box-shadow 0.2s, transform 0.1s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(100, 181, 246, 0.4)'; 
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.border = '1px solid #64B5F6'; 
        e.currentTarget.style.background = '#333333'; 
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.border = '1px solid #3D3D3D';
        e.currentTarget.style.background = '#2B2B2B';
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          background: '#3D3D3D',
          width: '8px',
          height: '8px'
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          background: '#3D3D3D',
          width: '8px',
          height: '8px'
        }}
      />

      {data.content.map(({ key, value }, index) => (
        <div
          key={index}
          style={{
            padding: '4px 0',
            borderBottom: index < data.content.length - 1 ? '1px solid #3D3D3D' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ color: '#64B5F6' }}>{key}</span>
          <span style={{ color: '#888' }}>:</span>
          <span style={{ 
            color: typeof value === 'string' ? '#98C379' : 
                   typeof value === 'number' ? '#E06C75' :
                   typeof value === 'boolean' ? '#61AFEF' : '#888'
          }}>
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  );

  const processJSON = useCallback((json: any) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;
    const X_SPACING = 400;
    const Y_SPACING = 150;
    const levelPositions = new Map<number, number>();

    const getNextPosition = (level: number) => {
      const next = levelPositions.get(level) ?? 0;
      levelPositions.set(level, next + 1);
      return next;
    };

    const processNode = (obj: any, parentId?: string, level = 0): string => {
      const currentId = `node-${nodeId++}`;
      const content: { key: string; value: any }[] = [];
      const childrenToProcess: [string, any][] = [];

      const verticalIndex = getNextPosition(level);

      if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          if (value === null || typeof value !== 'object') {
            content.push({ key, value });
          } else {
            childrenToProcess.push([key, value]);
          }
        });

        nodes.push({
          id: currentId,
          type: 'custom',
          data: {
            content,
            isObject: childrenToProcess.length > 0
          },
          position: {
            x: level * X_SPACING,
            y: verticalIndex * Y_SPACING
          },
          style: {
            opacity: content.length > 0 ? 1 : 0.7
          }
        });

        childrenToProcess.forEach(([key, value]) => {
          const childId = processNode(value, currentId, level + 1);
          edges.push({
            id: `edge-${currentId}-${childId}`,
            source: currentId,
            target: childId,
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
      }

      return currentId;
    };

    try {
      processNode(json);
      setNodes(nodes);
      setEdges(edges);
    } catch (error) {
      console.error('JSON processing error:', error);
    }
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const hasData =
      initialData &&
      (!(typeof initialData === 'object') || Object.keys(initialData).length > 0);

    const data = hasData
      ? initialData
      : {
          appName: 'JSON Visualizer',
          author: 'haknkayaa',
          openSource: true,
          stars: '⭐️'
        };

    processJSON(data);
  }, [processJSON, initialData, errorMessage]);

  const nodeTypes = {
    custom: CustomNode
  };

  if (errorMessage) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A1A1A',
          color: '#fff'
        }}
      >
        <div
          style={{
            maxWidth: '420px',
            padding: '24px',
            borderRadius: '12px',
            background: '#2B2B2B',
            border: '1px solid #3D3D3D',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            textAlign: 'center',
            lineHeight: 1.6
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '12px', color: '#F48FB1' }}>
            Unable to render JSON
          </h2>
          <p style={{ margin: 0, color: '#CCCCCC' }}>{errorMessage}</p>
          <p style={{ marginTop: '16px', fontSize: '13px', color: '#888' }}>
            Please ensure the JSON is valid before trying again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={defaultEdgeOptions}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        snapToGrid={true}
        snapGrid={[15, 15]}
        onNodeDragStart={(_, node) => {
          node.style = { ...node.style, zIndex: 1000 };
        }}
        onNodeDragStop={(_, node) => {
          node.style = { ...node.style, zIndex: 0 };
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color="#4A4A4A"
          style={{ backgroundColor: '#1A1A1A' }}
        />
        <CustomControls reactFlowWrapper={reactFlowWrapper}/>
      </ReactFlow>
    </div>
  );
}; 