import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const networkOptions = useMemo(() => ({
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
  }), []);

  // Fetch graph data from Django API
  const fetchGraphData = useCallback(async (graphType) => {
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

      // Destroy existing network and let useEffect recreate it
      if (networkInstance.current) {
        networkInstance.current.destroy();
        networkInstance.current = null;
      }

    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(`Failed to load ${graphType} network data`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize network
  const initializeNetwork = useCallback(() => {
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
  }, [graphData, networkOptions]);

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
  }, [currentGraph, fetchGraphData]);

  // Initialize network when data is loaded
  useEffect(() => {
    if (graphData.nodes.length > 0 && networkRef.current) {
      initializeNetwork();
    }
  }, [graphData, initializeNetwork]);

  return (
    <div className="content-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ color: '#2c3e50', margin: 0 }}>Knowledge Network Visualization</h1>
      </div>

      <div className="visualization-container">
        {/* Graph Type Selector */}
        <div className="visualization-controls">
          <div className="d-flex gap-2">
            <button
              onClick={() => handleGraphTypeChange('categories')}
              className={`btn ${currentGraph === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Category Network
            </button>

            <button
              onClick={() => handleGraphTypeChange('users')}
              className={`btn ${currentGraph === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            >
              User Network
            </button>

            <button
              onClick={() => handleGraphTypeChange('semantic')}
              className={`btn ${currentGraph === 'semantic' ? 'btn-primary' : 'btn-secondary'}`}
            >
              AI Semantic Network
            </button>
          </div>

          {/* Graph Description */}
          <div style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {currentGraph === 'categories'
              ? 'Shows how categories are connected through shared posts. Node size indicates post count.'
              : currentGraph === 'users'
              ? 'Shows users connected by shared interests. Connection strength indicates common categories.'
              : 'AI-powered semantic connections between categories based on content similarity.'
            }
          </div>

          {/* Stats Panel */}
          {!loading && Object.keys(stats).length > 0 && (
            <div className="card mt-2" style={{ margin: 0, padding: '1rem' }}>
              <div className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Network Statistics</div>
              <div className="d-flex gap-3" style={{ fontSize: '0.9rem' }}>
                {currentGraph === 'categories' || currentGraph === 'semantic' ? (
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
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-spinner">
            Loading {currentGraph} network...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card" style={{ backgroundColor: '#fdf2f2', borderColor: '#fecaca', color: '#dc3545' }}>
            <div className="card-content">{error}</div>
          </div>
        )}

        {/* Network Container */}
        {!loading && !error && (
          <div ref={networkRef} className="visualization-canvas" />
        )}
      </div>

      {/* Controls Info */}
      <div className="text-center mt-3" style={{ fontSize: '0.8rem', color: '#6c757d' }}>
        <strong>Controls:</strong> Drag to pan • Scroll to zoom • Click nodes for details • Hover for information
      </div>
    </div>
  );
};

export default Visualization;