import { Node, Edge, Position } from 'reactflow';
import dagre from 'dagre';

const nodeWidth = 250;
const nodeHeight = 80;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
    node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

export const transformDataToFlow = (data: any) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let idCounter = 0;

  const traverse = (item: any, parentId: string | null = null) => {
    const id = `node-${idCounter++}`;
    
    // Determine node type/color based on item type
    let type = 'default';
    let label = item.name || 'Unknown';
    
    // Add Node
    nodes.push({
      id,
      type,
      data: { label: label, ...item },
      position: { x: 0, y: 0 }, // Position will be calculated by dagre
      style: { 
        background: getTypeColor(item.type),
        color: '#fff',
        border: '1px solid #777',
        width: 180,
        fontSize: '12px',
        borderRadius: '8px',
        padding: '10px'
      }
    });

    // Add Edge
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#999' }
      });
    }

    // Process Children
    if (item.children && Array.isArray(item.children)) {
      item.children.forEach((child: any) => traverse(child, id));
    }
  };

  traverse(data);
  return getLayoutedElements(nodes, edges);
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'root': return '#2563eb'; // blue-600
    case 'category': return '#4b5563'; // gray-600
    case 'project': return '#16a34a'; // green-600
    case 'config': return '#ea580c'; // orange-600
    case 'device_config': return '#9333ea'; // purple-600
    case 'reference': return '#0891b2'; // cyan-600
    case 'sensor': return '#dc2626'; // red-600
    default: return '#64748b'; // slate-500
  }
};
