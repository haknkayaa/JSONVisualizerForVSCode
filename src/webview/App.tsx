import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
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
}

export const App: React.FC<AppProps> = ({ initialData }) => {
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

    const processNode = (obj: any, parentId?: string, level = 0, verticalIndex = 0): string => {
      const currentId = `node-${nodeId++}`;
      const content: { key: string; value: any }[] = [];
      const childrenToProcess: [string, any][] = [];

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

        childrenToProcess.forEach(([key, value], index) => {
          const childId = processNode(value, currentId, level + 1, index);
          edges.push({
            id: `edge-${currentId}-${childId}`,
            source: currentId,
            target: childId,
            label: key,
            type: 'smoothstep',
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
    const data = initialData || {
      appName: "null",
      author: "proident",
      launched: -60643793.95864394,
      openSource: false,
      stars: 30228844.364910394
    };

    processJSON(data);
  }, [processJSON, initialData]);

  const nodeTypes = {
    custom: CustomNode
  };

  return (
    <div style={flowStyles}>
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
        <Controls 
          style={{ 
            background: '#2B2B2B', 
            border: 'none',
            borderRadius: '8px',
            padding: '4px'
          }} 
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}; 