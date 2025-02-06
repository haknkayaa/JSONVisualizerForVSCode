import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';

interface JsonVisualizerProps {
  jsonData: string;
}

const flowStyles = {
  background: '#1A1A1A',
  width: '100%',
  height: '100vh',
} as const;

const defaultEdgeOptions = {
  style: { stroke: '#fff', strokeWidth: 2 },
  type: 'smoothstep',
  animated: true,
} as const;

export const JsonVisualizer: React.FC<JsonVisualizerProps> = ({ jsonData }): JSX.Element => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const createGraphData = useCallback((json: any) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;
    let xPos = 0;
    let yPos = 0;
    const HORIZONTAL_SPACING = 200;
    const VERTICAL_SPACING = 100;

    const processNode = (data: any, parentId?: string, level = 0) => {
      const currentId = `node-${nodeId++}`;
      
      const createNodeStyle = (type: string) => ({
        background: '#2B2B2B',
        color: '#fff',
        border: '1px solid #3D3D3D',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '14px',
        width: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      });

      if (Array.isArray(data)) {
        nodes.push({
          id: currentId,
          data: { label: '[]' },
          position: { x: xPos, y: yPos },
          style: createNodeStyle('array')
        });

        data.forEach((item, index) => {
          yPos += VERTICAL_SPACING;
          const childId = processNode(item, currentId, level + 1);
          edges.push({
            id: `edge-${currentId}-${childId}`,
            source: currentId,
            target: childId,
            label: `${index}`,
            type: 'smoothstep',
            animated: true,
          });
        });
      } else if (typeof data === 'object' && data !== null) {
        nodes.push({
          id: currentId,
          data: { label: '{}' },
          position: { x: xPos, y: yPos },
          style: createNodeStyle('object')
        });

        Object.entries(data).forEach(([key, value]) => {
          yPos += VERTICAL_SPACING;
          const childId = processNode(value, currentId, level + 1);
          edges.push({
            id: `edge-${currentId}-${childId}`,
            source: currentId,
            target: childId,
            label: key,
            type: 'smoothstep',
            animated: true,
          });
        });
      } else {
        nodes.push({
          id: currentId,
          data: { label: String(data) },
          position: { x: xPos, y: yPos },
          style: createNodeStyle('value')
        });
      }

      xPos += HORIZONTAL_SPACING;
      return currentId;
    };

    try {
      const parsedJson = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      processNode(parsedJson);
      setNodes(nodes);
      setEdges(edges);
    } catch (error) {
      console.error('JSON parse error:', error);
    }
  }, []);

  useEffect(() => {
    createGraphData(jsonData);
  }, [jsonData, createGraphData]);

  return (
    <div style={flowStyles}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color="#2B2B2B"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}; 