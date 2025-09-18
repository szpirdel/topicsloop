import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import axios from '../api/axios';

const Visualization = () => {
  const networkRef = useRef(null);
  const networkInstance = useRef(null);

  const [currentGraph, setCurrentGraph] = useState('categories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState({});

  // vis.js network options
  const networkOptions = {
    nodes: {
      shape: 'dot',
      size: 16,
      color: {
        background: '#3498db',
        border: '#2980b9',
        highlight: {
          background: '#e74c3c',
          border: '#c0392b'
        }
      },
      font: {
        size: 14,
        color: '#2c3e50'
      },
      borderWidth: 2
    },
    edges: {
      color: {
        color: '#95a5a6',
        highlight: '#3498db'
      },
      width: 2,
      smooth: {
        type: 'continuous'
      }
    },
    physics: {
      enabled: true,
      stabilization: {
        enabled: true,
        iterations: 1000,
        updateInterval: 25
      },
      barnesHut: {
        gravitationalConstant: -8000,
        centralGravity: 0.3,
        springLength: 95,
        springConstant: 0.04,
        damping: 0.09
      }
    },
    interaction: {
      hover: true,
      hoverConnectedEdges: true,
      selectConnectedEdges: false,
      tooltipDelay: 300
    },
    layout: {
      improvedLayout: true
    }
  };

  // Fetch graph data from Django API
  const fetchGraphData = async (graphType) => {
    setLoading(true);
    setError('');

    try {
      const endpoint = graphType === 'categories'
        ? '/api/viz/category-network/'
        : '/api/viz/user-network/';

      console.log(`Fetching data from: ${endpoint}`);

      const response = await axios.get(endpoint);
      console.log('Graph data received:', response.data);

      setGraphData(response.data);
      setStats(response.data.stats || {});

      // Update network if it exists
      if (networkInstance.current) {
        updateNetwork(response.data);
      }

    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(`Failed to load ${graphType} network data`);
    } finally {
      setLoading(false);
    }
  };

  // Update network with new data
  const updateNetwork = (data) => {
    if (!networkInstance.current) return;

    const nodes = new DataSet(data.nodes);
    const edges = new DataSet(data.edges);

    networkInstance.current.setData({ nodes, edges });
    networkInstance.current.fit();
  };

  // Initialize network
  const initializeNetwork = () => {
    if (!networkRef.current) return;

    const nodes = new DataSet(graphData.nodes);
    const edges = new DataSet(graphData.edges);

    const data = { nodes, edges };

    networkInstance.current = new Network(networkRef.current, data, networkOptions);

    // Add event listeners
    networkInstance.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);
        console.log('Node clicked:', node);
      }
    });

    networkInstance.current.on('hoverNode', (params) => {
      console.log('Node hovered:', params.node);
    });
  };

  // Handle graph type change
  const handleGraphTypeChange = (newType) => {
    setCurrentGraph(newType);
    fetchGraphData(newType);
  };

  // Initialize on component mount
  useEffect(() => {
    fetchGraphData(currentGraph);

    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy();
      }
    };
  }, []);

  // Initialize network when data is loaded
  useEffect(() => {
    if (graphData.nodes.length > 0 && networkRef.current) {
      initializeNetwork();
    }
  }, [graphData]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2>Knowledge Network Visualization</h2>

      {/* Graph Type Selector */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={() => handleGraphTypeChange('categories')}
            style={{
              padding: '10px 20px',
              backgroundColor: currentGraph === 'categories' ? '#3498db' : '#ecf0f1',
              color: currentGraph === 'categories' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Category Network
          </button>

          <button
            onClick={() => handleGraphTypeChange('users')}
            style={{
              padding: '10px 20px',
              backgroundColor: currentGraph === 'users' ? '#3498db' : '#ecf0f1',
              color: currentGraph === 'users' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            User Network
          </button>
        </div>

        {/* Graph Description */}
        <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
          {currentGraph === 'categories'
            ? 'Shows how categories are connected through shared posts. Node size indicates post count.'
            : 'Shows users connected by shared interests. Connection strength indicates common categories.'
          }
        </p>
      </div>

      {/* Stats Panel */}
      {!loading && Object.keys(stats).length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Network Statistics</h4>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
            {currentGraph === 'categories' ? (
              <>
                <span><strong>Categories:</strong> {stats.total_categories || 0}</span>
                <span><strong>Connections:</strong> {stats.total_connections || 0}</span>
                {stats.most_connected && (
                  <span><strong>Most Connected:</strong> {stats.most_connected}</span>
                )}
              </>
            ) : (
              <>
                <span><strong>Users:</strong> {stats.total_users || 0}</span>
                <span><strong>Connections:</strong> {stats.total_connections || 0}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          color: '#7f8c8d'
        }}>
          <div>Loading {currentGraph} network...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          color: '#e74c3c',
          backgroundColor: '#fdf2f2',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Network Container */}
      {!loading && !error && (
        <div
          ref={networkRef}
          style={{
            width: '100%',
            height: '600px',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            backgroundColor: 'white'
          }}
        />
      )}

      {/* Controls Info */}
      <div style={{
        marginTop: '15px',
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        <strong>Controls:</strong> Drag to pan • Scroll to zoom • Click nodes for details • Hover for information
      </div>
    </div>
  );
};

export default Visualization;