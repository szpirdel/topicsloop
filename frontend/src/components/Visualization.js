import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import axios from '../api/axios';
import { fetchPostNetwork, fetchSimilarPosts, fetchSimilarCategories } from '../services/api';

const Visualization = () => {
  const networkRef = useRef(null);
  const networkInstance = useRef(null);

  // Always start with unified graph, but check for focus post
  const getInitialGraphType = () => {
    return 'unified';
  };

  const getInitialFocusPostId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('focus_post');
  };

  const getInitialFocusCategoryId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('focus_category');
  };

  const [currentGraph, setCurrentGraph] = useState(getInitialGraphType());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState({});
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [isPersonalized, setIsPersonalized] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [focusPostId, setFocusPostId] = useState(getInitialFocusPostId());
  const [focusCategoryId, setFocusCategoryId] = useState(getInitialFocusCategoryId());
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [isStabilizing, setIsStabilizing] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    nodeType: null,
    nodeData: null
  });

  // Handle post node click
  const handlePostNodeClick = useCallback((node) => {
    console.log('🎯 Opening post details for:', node.label);
    setSelectedPost(node);
    setShowPostModal(true);
  }, []);

  // Handle post modal close
  const closePostModal = useCallback(() => {
    setShowPostModal(false);
    setSelectedPost(null);
  }, []);

  // Context menu functions
  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const showContextMenu = useCallback((nodeId, nodeType, nodeData, x, y) => {
    setContextMenu({
      visible: true,
      x,
      y,
      nodeId,
      nodeType,
      nodeData
    });
  }, []);

  const handleFindSimilarPosts = useCallback(async (postId) => {
    try {
      hideContextMenu();
      setLoading(true);

      const similarPostsData = await fetchSimilarPosts(postId, {
        threshold: 0.5,
        limit: 5,
        method: 'fallback'
      });

      if (similarPostsData.similar_posts && similarPostsData.similar_posts.length > 0) {
        // Create a new graph focused on similar posts
        const similarPostIds = similarPostsData.similar_posts.map(sp => sp.post.id);
        similarPostIds.push(parseInt(postId)); // Include the original post

        // Note: Graph will be reloaded automatically when data updates

        console.log('🔍 Found similar posts:', similarPostsData.similar_posts.length);
        alert(`Found ${similarPostsData.similar_posts.length} similar posts! Check the graph for highlighted connections.`);
      } else {
        alert('No similar posts found with current threshold.');
      }
    } catch (error) {
      console.error('Error finding similar posts:', error);
      alert('Error finding similar posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isPersonalized, hideContextMenu]);

  const handleFindSimilarCategories = useCallback(async (categoryId) => {
    try {
      hideContextMenu();
      setLoading(true);

      const similarCategoriesData = await fetchSimilarCategories(categoryId, {
        threshold: 0.5,
        limit: 5
      });

      if (similarCategoriesData.similar_categories && similarCategoriesData.similar_categories.length > 0) {
        console.log('🔍 Found similar categories:', similarCategoriesData.similar_categories.length);

        const categoryNames = similarCategoriesData.similar_categories
          .map(sc => sc.category.name)
          .join(', ');

        alert(`Found ${similarCategoriesData.similar_categories.length} similar categories: ${categoryNames}`);
      } else {
        alert('No similar categories found with current threshold.');
      }
    } catch (error) {
      console.error('Error finding similar categories:', error);
      alert('Error finding similar categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [hideContextMenu]);

  const handleViewDetails = useCallback((nodeData, nodeType) => {
    hideContextMenu();

    if (nodeType === 'post') {
      setSelectedPost(nodeData);
      setShowPostModal(true);
    } else if (nodeType === 'category') {
      // Navigate to category page or show category details
      window.open(`/categories?focus=${nodeData.id}`, '_blank');
    }
  }, [hideContextMenu]);

  const handleFocusOnNode = useCallback((nodeId, nodeType) => {
    hideContextMenu();

    if (nodeType === 'post') {
      const postId = nodeId.replace('post_', '');
      setFocusPostId(postId);
      // Graph will reload automatically when focusPostId changes
    } else if (nodeType === 'category') {
      const categoryId = nodeId.replace('category_', '');
      setFocusCategoryId(categoryId);
      // Graph will reload automatically when focusCategoryId changes
    }
  }, [hideContextMenu]);

  // Handle category expansion in posts graph
  const handleCategoryExpansionInPostsGraph = useCallback(async (nodeId, categoryNode) => {
    try {
      console.log('🔄 Loading posts from category:', categoryNode.label);

      // Extract category ID from node ID (format: "category_1")
      const categoryId = nodeId.replace('category_', '');

      // Fetch post network focused on this category
      const params = {
        category_id: categoryId,
        include_posts: true,
        similarity_threshold: 0.7,
        max_posts: 15,
        max_connections: 3
      };

      console.log('📊 Fetching category posts with params:', params);
      const data = await fetchPostNetwork(params);

      // Update graph data
      setGraphData(data);
      setStats(data.stats || {});

      // Destroy and recreate network
      if (networkInstance.current) {
        networkInstance.current.destroy();
        networkInstance.current = null;
      }

    } catch (error) {
      console.error('❌ Failed to load category posts:', error);
      setError('Failed to load posts from category');
    }
  }, []);

  // Debug function to reset expanded state
  const resetExpandedNodes = () => {
    console.log('🔄 Resetting all expanded nodes');
    setExpandedNodes(new Set());
  };

  // vis.js network options - dynamic based on graph type
  const networkOptions = useMemo(() => {
    const baseOptions = {
      nodes: {
        shape: 'dot',
        size: 20, // Increased from 16 to 20 for better visibility
        color: {
          background: '#3498db',
          border: '#2980b9',
          highlight: {
            background: '#e74c3c',
            border: '#c0392b'
          }
        },
        font: {
          size: 16, // Increased from 14 to 16 for better readability
          color: '#2c3e50'
        },
        borderWidth: 2
      },
      edges: {
        color: {
          color: '#95a5a6',
          highlight: '#3498db'
        },
        width: 2.5, // Slightly thicker edges for better visibility
        smooth: {
          type: 'continuous'
        }
      },
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: false,
        tooltipDelay: 300
      }
    };

    // Hierarchical layout for hierarchical graph
    if (currentGraph === 'hierarchical') {
      return {
        ...baseOptions,
        layout: {
          hierarchical: {
            enabled: true,
            levelSeparation: 150,
            nodeSpacing: 100,
            treeSpacing: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
            direction: 'UD',
            sortMethod: 'directed'
          }
        },
        physics: {
          enabled: true,
          hierarchicalRepulsion: {
            centralGravity: 0.0,
            springLength: 100,
            springConstant: 0.01,
            nodeDistance: 120,
            damping: 0.09
          }
        }
      };
    }

    // Standard physics for other layouts
    return {
      ...baseOptions,
      physics: {
        enabled: physicsEnabled,
        stabilization: {
          enabled: physicsEnabled,
          iterations: physicsEnabled ? 1000 : 0,
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
      layout: {
        improvedLayout: true
      },
      interaction: {
        ...baseOptions.interaction,
        dragNodes: true, // Always allow dragging
        dragView: true,
        zoomView: true
      }
    };
  }, [currentGraph, physicsEnabled]);

  // Fetch graph data from Django API
  const fetchGraphData = useCallback(async (graphType, personalized = isPersonalized) => {
    setLoading(true);
    setError('');

    try {
      let data;

      if (graphType === 'unified') {
        // Always use fetchPostNetwork for unified view to include posts
        const params = {
          include_posts: true,
          similarity_threshold: 0.7,
          max_posts: 20,
          max_connections: 5,
          personalized: personalized  // Pass personalization to post network
        };

        // Add focus_post_id if available
        if (focusPostId) {
          params.focus_post_id = focusPostId;
        }

        // Add focus_category_id if available
        if (focusCategoryId) {
          params.category_id = focusCategoryId;
        }

        // Fetching unified network with posts
        data = await fetchPostNetwork(params);
      } else {
        // Original graph types
        let endpoint;
        switch (graphType) {
          case 'categories':
            endpoint = '/api/viz/category-network/';
            break;
          case 'semantic':
            endpoint = '/api/viz/semantic-category-network/';
            break;
          case 'unified':
            endpoint = `/api/viz/unified-network/${personalized ? '?personalized=true' : ''}`;
            break;
          case 'users':
          default:
            endpoint = '/api/viz/user-network/';
            break;
        }

        console.log(`Fetching data from: ${endpoint}`);
        const response = await axios.get(endpoint);
        data = response.data;
      }

      console.log('Graph data received:', data);

      setGraphData(data);
      setStats(data.stats || {});

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
  }, [focusPostId, focusCategoryId]);

  // Expand a node to show its subcategories
  const expandNode = useCallback(async (nodeId) => {
    console.log(`🚀 ENTER expandNode function for nodeId: ${nodeId}`);

    try {
      // Find the parent node to determine the level of subcategories
      const parentNode = networkInstance.current.body.data.nodes.get(nodeId);
      const subcategoryLevel = (parentNode?.level || 0) + 1;

      console.log(`🔽 Expanding node ${nodeId} (${parentNode?.label}) - fetching level ${subcategoryLevel} subcategories`);

      const response = await axios.get(`/api/viz/unified-network/?parent_id=${nodeId}&level=${subcategoryLevel}`);
      const subcategoryData = response.data;

      if (!networkInstance.current) return;

      const nodes = networkInstance.current.body.data.nodes;
      const edges = networkInstance.current.body.data.edges;

      console.log(`📊 Received ${subcategoryData.nodes?.length || 0} subcategory nodes and ${subcategoryData.edges?.length || 0} edges`);

      // Add subcategory nodes with full vis.js compatible properties
      if (subcategoryData.nodes) {
        console.log('📦 Raw subcategory nodes from API:', subcategoryData.nodes);

        // Get parent node position for better subcategory positioning
        const parentPosition = networkInstance.current.getPositions([nodeId])[nodeId];
        console.log(`📍 Parent node position:`, parentPosition);

        const nodesToAdd = subcategoryData.nodes
          .filter(node => !nodes.get(node.id))
          .map((node, index) => {
            console.log(`➕ Preparing subcategory node: ${node.label} (id: ${node.id})`);

            // Calculate position closer to parent node (reduced distance)
            const angle = (index * (360 / subcategoryData.nodes.length)) * (Math.PI / 180);
            const distance = 120; // Reduced from default ~200-400 to 120
            const x = parentPosition.x + distance * Math.cos(angle);
            const y = parentPosition.y + distance * Math.sin(angle);

            // Ensure all required vis.js properties are present
            const visNode = {
              id: node.id,
              label: node.label,
              title: node.title || node.label,
              shape: node.shape || 'dot',
              size: node.size || 20, // Updated to match base size
              color: node.color || {
                background: '#3498db',
                border: '#2980b9'
              },
              font: node.font || {
                size: 16, // Updated to match base font size
                color: '#2c3e50'
              },
              // Position closer to parent
              x: x,
              y: y,
              // Include any other properties from API
              ...node,
              // Force physics enabled but with initial position
              physics: true,
              fixed: false
            };

            console.log(`🔧 Processed vis.js node at position (${x.toFixed(1)}, ${y.toFixed(1)}):`, visNode);
            return visNode;
          });

        if (nodesToAdd.length > 0) {
          console.log(`📦 Adding ${nodesToAdd.length} nodes in batch to DataSet`);

          try {
            nodes.add(nodesToAdd);
            console.log(`✅ Successfully added ${nodesToAdd.length} nodes to DataSet`);

            // Verify all nodes were added
            nodesToAdd.forEach(node => {
              const addedNode = nodes.get(node.id);
              console.log(`🔍 Verification - node ${node.id} in DataSet:`, addedNode ? '✅ CONFIRMED' : '❌ FAILED');
            });

          } catch (err) {
            console.error(`❌ Failed to add nodes batch:`, err);
          }
        } else {
          console.log('⚠️ All nodes already exist - no new nodes to add');
        }
      }

      // Add parent-child visual connections (dashed lines) for ALL subcategory nodes
      const parentChildEdges = subcategoryData.nodes
        .filter(node => !edges.get(`parent-${nodeId}-child-${node.id}`)) // Only if edge doesn't exist
        .map(childNode => {
          const edgeId = `parent-${nodeId}-child-${childNode.id}`;
          console.log(`🔗 Creating parent-child edge: ${nodeId} -> ${childNode.id} (${edgeId})`);
          return {
            id: edgeId,
            from: nodeId,
            to: childNode.id,
            // Parent-child connection styling (dashed line)
            dashes: [5, 5], // Dashed line pattern
            color: {
              color: '#95a5a6',
              highlight: '#7f8c8d'
            },
            width: 1,
            title: 'Parent-child relationship',
            smooth: {
              type: 'continuous',
              forceDirection: 'none'
            }
          };
        });

      // Add semantic edges from API
      if (subcategoryData.edges) {
        console.log('🔗 Raw edges from API:', subcategoryData.edges);

        subcategoryData.edges.forEach(edge => {
          const edgeId = edge.id || `${edge.from}-${edge.to}`;
          const edgeWithId = { ...edge, id: edgeId };

          const existingEdge = edges.get(edgeId);
          if (!existingEdge) {
            console.log(`🔗 Adding semantic edge: ${edge.from} -> ${edge.to} (id: ${edgeId})`);

            try {
              edges.add(edgeWithId);
              console.log(`✅ Successfully added semantic edge ${edgeId} to DataSet`);
            } catch (err) {
              console.error(`❌ Failed to add semantic edge ${edgeId}:`, err);
            }
          }
        });
      }

      // Add all parent-child edges
      if (parentChildEdges.length > 0) {
        console.log(`🔗 Adding ${parentChildEdges.length} parent-child edges`);

        try {
          edges.add(parentChildEdges);
          console.log(`✅ Successfully added ${parentChildEdges.length} parent-child edges to DataSet`);
        } catch (err) {
          console.error(`❌ Failed to add parent-child edges:`, err);
        }
      }

      // Mark node as expanded
      setExpandedNodes(prev => new Set([...prev, nodeId]));

      // Final state verification
      console.log(`📊 Final DataSet state: ${nodes.length} nodes, ${edges.length} edges`);

      // Update the parent node appearance
      const currentParentNode = nodes.get(nodeId);
      if (currentParentNode) {
        nodes.update({
          ...currentParentNode,
          title: currentParentNode.title.replace('🔽 Dwuklik = rozwiń', '🔼 Rozwięte'),
          color: {
            ...currentParentNode.color,
            background: '#e74c3c'
          }
        });
      }

    } catch (error) {
      console.error('❌ Error expanding node:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  }, []);

  // Initialize network
  const initializeNetwork = useCallback(() => {
    if (!networkRef.current) return;

    const nodes = new DataSet(graphData.nodes);
    const edges = new DataSet(graphData.edges);

    const data = { nodes, edges };

    networkInstance.current = new Network(networkRef.current, data, networkOptions);

    // Set initial zoom and focus on specific post if available
    networkInstance.current.once('afterDrawing', () => {
      console.log('🔍 Network drawing completed');

      if (focusPostId) {
        // Find the focused post node
        const focusedPostNode = nodes.get().find(node =>
          node.type === 'post' && String(node.post_id) === String(focusPostId)
        );

        if (focusedPostNode) {
          console.log('🎯 Focusing on post:', focusedPostNode.label);

          // Enhance the focused post visual appearance
          nodes.update({
            ...focusedPostNode,
            color: {
              background: '#ff6b6b', // Bright red for focused post
              border: '#ff3838',
              highlight: {
                background: '#ff4757',
                border: '#ff3742'
              }
            },
            size: 25, // Make it bigger
            borderWidth: 4, // Thicker border
            font: {
              size: 18,
              color: '#2c3e50',
              bold: true
            }
          });

          // Center view on the focused post
          networkInstance.current.focus(focusedPostNode.id, {
            scale: 1.5,
            animation: {
              duration: 1000,
              easingFunction: 'easeInOutQuad'
            }
          });

          // Add pulsing effect after focusing
          setTimeout(() => {
            if (networkInstance.current) {
              // Select the focused node to make it stand out
              networkInstance.current.selectNodes([focusedPostNode.id]);
              console.log('✨ Applied special highlighting to focused post');
            }
          }, 1200); // After the focus animation completes
        } else {
          console.log('⚠️ Focused post not found in nodes');
          // Fallback to normal zoom
          networkInstance.current.moveTo({
            scale: 1.5,
            animation: {
              duration: 500,
              easingFunction: 'easeInOutQuad'
            }
          });
        }
      } else {
        // Normal zoom when no focus post
        networkInstance.current.moveTo({
          scale: 1.5,
          animation: {
            duration: 500,
            easingFunction: 'easeInOutQuad'
          }
        });
      }
    });

    // Minimal event listeners for important debugging only
    networkInstance.current.on('animationFinished', () => {
      // Animation completed - could be used for performance monitoring
    });

    // Add DataSet event listeners
    nodes.on('add', (event, properties) => {
      console.log('📊 DataSet ADD event:', properties);
    });

    nodes.on('update', (event, properties) => {
      console.log('📊 DataSet UPDATE event:', properties);
    });

    edges.on('add', (event, properties) => {
      console.log('🔗 DataSet EDGE ADD event:', properties);
    });

    // Add event listeners
    networkInstance.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);
        console.log('👆 Single click on node:', node.label, '(id:', nodeId, ')');

        // === POST NODE CLICK HANDLING ===
        if (currentGraph === 'unified' && node?.type === 'post') {
          console.log('📄 Post node clicked:', node);
          handlePostNodeClick(node);
        }
      }
    });

    networkInstance.current.on('doubleClick', (params) => {
      console.log('👆👆 Double click detected! Params:', params);

      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);


        // === UNIFIED GRAPH DOUBLE-CLICK HANDLING (original logic) ===
        if (currentGraph === 'unified') {
          console.log(`🎯 Double-clicked node: ${node?.label} (id: ${nodeId}) type: ${node?.type}`);

          // Handle post nodes in unified graph
          if (node?.type === 'post') {
            console.log('📄 Post double-clicked in unified graph - focusing on this post');
            setFocusPostId(node.post_id);
            fetchGraphData('unified'); // Reload with new focus
            return;
          }

          // Handle category nodes when posts are included
          if (node?.type === 'category') {
            console.log('📂 Category double-clicked in unified view with posts - loading posts from this category');
            handleCategoryExpansionInPostsGraph(nodeId, node);
            return;
          }

          // Original category expansion logic
          console.log(`📊 Node details: has_subcategories=${node?.has_subcategories}, expanded=${expandedNodes.has(nodeId)}`);

          // === DEBUG: DETAILED STATE INSPECTION ===
        console.log('🔍 === DETAILED DEBUG STATE ===');
        console.log('🔍 Current network nodes count:', networkInstance.current.body.data.nodes.length);
        console.log('🔍 Current network edges count:', networkInstance.current.body.data.edges.length);
        console.log('🔍 Expanded nodes set:', Array.from(expandedNodes));
        console.log('🔍 Network body nodes DOM elements:', networkInstance.current.body.nodes ? Object.keys(networkInstance.current.body.nodes).length : 'null');
        console.log('🔍 Network rendering status:', networkInstance.current.body.view ? 'view exists' : 'no view');
        console.log('🔍 Physics simulation status:', networkInstance.current.physics.physicsEnabled);

        // Check if any nodes with id 7 and 8 exist in any form
        const nodeCheck7 = networkInstance.current.body.data.nodes.get(7);
        const nodeCheck8 = networkInstance.current.body.data.nodes.get(8);
        console.log('🔍 Node 7 in DataSet:', nodeCheck7 ? '✅ EXISTS' : '❌ MISSING');
        console.log('🔍 Node 8 in DataSet:', nodeCheck8 ? '✅ EXISTS' : '❌ MISSING');

        if (nodeCheck7) console.log('🔍 Node 7 details:', nodeCheck7);
        if (nodeCheck8) console.log('🔍 Node 8 details:', nodeCheck8);

        // Check rendering state
        const bodyNodes = networkInstance.current.body.nodes;
        if (bodyNodes) {
          console.log('🔍 Node 7 in body.nodes:', bodyNodes[7] ? '✅ EXISTS' : '❌ MISSING');
          console.log('🔍 Node 8 in body.nodes:', bodyNodes[8] ? '✅ EXISTS' : '❌ MISSING');

          if (bodyNodes[7]) {
            console.log('🔍 Node 7 body position:', {x: bodyNodes[7].x, y: bodyNodes[7].y});
            console.log('🔍 Node 7 options:', bodyNodes[7].options);
          }
          if (bodyNodes[8]) {
            console.log('🔍 Node 8 body position:', {x: bodyNodes[8].x, y: bodyNodes[8].y});
            console.log('🔍 Node 8 options:', bodyNodes[8].options);
          }
        }

        console.log('🔍 === END DEBUG STATE ===');

          if (node && node.has_subcategories && !expandedNodes.has(nodeId)) {
            console.log('🚀 FIRST TIME: Triggering expansion for node:', node.label);
            expandNode(nodeId);
          } else if (expandedNodes.has(nodeId)) {
            console.log('⚠️ ALREADY EXPANDED: Node already in expanded set - this is the SECOND click scenario');
          } else if (!node?.has_subcategories) {
            console.log('⚠️ Node has no subcategories');
          }
        }
      } else {
        console.log(`⚠️ Double-click conditions not met: nodes=${params.nodes.length}, graph=${currentGraph}`);
      }
    });

    networkInstance.current.on('hoverNode', (params) => {
      console.log('Node hovered:', params.node);
    });

    // Context menu event listener
    networkInstance.current.on('oncontext', (params) => {
      // Prevent default browser context menu
      params.event.preventDefault();

      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);

        if (node) {
          const domPosition = networkInstance.current.canvasToDOM(params.pointer.canvas);
          const containerRect = networkRef.current.getBoundingClientRect();

          showContextMenu(
            nodeId,
            node.type,
            node,
            containerRect.left + domPosition.x,
            containerRect.top + domPosition.y
          );
        }
      } else {
        hideContextMenu();
      }
    });

    // Hide context menu on regular click or outside click
    networkInstance.current.on('click', (params) => {
      if (contextMenu.visible) {
        hideContextMenu();
      }

      // Existing click logic
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);

        if (node?.type === 'post') {
          handlePostNodeClick(node);
        }
      }
    });
  }, [graphData, networkOptions, currentGraph, expandedNodes, contextMenu.visible, showContextMenu, hideContextMenu, handlePostNodeClick]);

  // Handle graph type change
  const handleGraphTypeChange = (newType) => {
    setCurrentGraph(newType);
    setExpandedNodes(new Set()); // Reset expanded nodes when changing graph types

    // Clear focus post and category when switching away from unified view
    if (newType !== 'unified') {
      setFocusPostId(null);
      setFocusCategoryId(null);
    }

    fetchGraphData(newType, isPersonalized);
  };

  // Handle personalization toggle
  const handlePersonalizationToggle = () => {
    const newPersonalized = !isPersonalized;
    setIsPersonalized(newPersonalized);
    setExpandedNodes(new Set()); // Reset expanded nodes
    fetchGraphData(currentGraph, newPersonalized);
  };

  // Handle physics toggle
  const handlePhysicsToggle = () => {
    const newPhysicsEnabled = !physicsEnabled;
    setPhysicsEnabled(newPhysicsEnabled);

    if (networkInstance.current) {
      // Update physics settings in real-time
      networkInstance.current.setOptions({
        physics: {
          enabled: newPhysicsEnabled,
          stabilization: {
            enabled: newPhysicsEnabled,
            iterations: newPhysicsEnabled ? 1000 : 0,
            updateInterval: 25
          }
        }
      });

      if (newPhysicsEnabled) {
        // When enabling physics, start stabilization
        setIsStabilizing(true);
        networkInstance.current.stabilize();

        // Listen for stabilization completion
        networkInstance.current.once('stabilizationIterationsDone', () => {
          setIsStabilizing(false);
          console.log('🔧 Physics stabilization completed');
        });
      } else {
        setIsStabilizing(false);
        console.log('🔧 Physics disabled - manual mode activated');
      }
    }
  };

  // Initialize on component mount
  useEffect(() => {
    fetchGraphData(currentGraph);

    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy();
      }
    };
  }, [currentGraph, fetchGraphData, isPersonalized, focusPostId, focusCategoryId]);

  // Initialize network when data is loaded (only for initial load, not for dynamic updates)
  useEffect(() => {
    if (graphData.nodes.length > 0 && networkRef.current && !networkInstance.current) {
      console.log('🔄 Initializing network for the first time');
      initializeNetwork();

      // Auto-scroll to graph if focus_post or focus_category parameter is present
      if ((focusPostId || focusCategoryId) && networkRef.current) {
        setTimeout(() => {
          networkRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          console.log('📍 Auto-scrolled to graph canvas for focused item');
        }, 100); // Small delay to ensure network is rendered
      }
    }
  }, [graphData, initializeNetwork, focusPostId, focusCategoryId]);

  // Global click listener to hide context menu
  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (contextMenu.visible) {
        hideContextMenu();
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu.visible, hideContextMenu]);

  return (
    <div className="content-container">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>Network Visualizations</h1>
      </div>

      <div className="visualization-container" style={{ textAlign: 'center' }}>
        {/* Graph Type Selector */}
        <div className="visualization-controls" style={{ textAlign: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          {/* Tab Navigation */}
          <div style={{
            borderBottom: '2px solid #e9ecef',
            marginBottom: '1rem',
            display: 'inline-block'
          }}>
            <div className="d-flex gap-0">
              <button
                onClick={() => handleGraphTypeChange('unified')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderBottom: currentGraph === 'unified' ? '3px solid #3498db' : '3px solid transparent',
                  color: currentGraph === 'unified' ? '#3498db' : '#6c757d',
                  fontWeight: currentGraph === 'unified' ? 'bold' : 'normal',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                🧠 AI Semantic Network
              </button>


              <button
                onClick={() => handleGraphTypeChange('users')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderBottom: currentGraph === 'users' ? '3px solid #3498db' : '3px solid transparent',
                  color: currentGraph === 'users' ? '#3498db' : '#6c757d',
                  fontWeight: currentGraph === 'users' ? 'bold' : 'normal',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                👥 User Network
              </button>

            </div>
          </div>

          {/* Tab Content - AI Semantic Network Options */}
          {currentGraph === 'unified' && (
            <div className="d-flex gap-2 justify-content-center flex-wrap" style={{ marginBottom: '1rem' }}>
              <button
                onClick={handlePersonalizationToggle}
                className={`btn btn-sm ${isPersonalized ? 'btn-success' : 'btn-outline-success'}`}
              >
                {isPersonalized ? '💙 My Favorites' : '🌍 Explore All'}
              </button>


              <button
                onClick={() => setShowLegend(!showLegend)}
                className="btn btn-sm btn-outline-info"
              >
                ℹ️ Legend
              </button>

              <button
                onClick={handlePhysicsToggle}
                className={`btn btn-sm ${physicsEnabled ? 'btn-primary' : 'btn-outline-primary'}`}
                disabled={isStabilizing}
              >
                {isStabilizing ? '⚡ Stabilizing...' : physicsEnabled ? '⚡ Physics ON' : '🔧 Manual Mode'}
              </button>
            </div>
          )}

          {/* Graph Description */}
          <div style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '0.5rem', textAlign: 'center' }}>
            {currentGraph === 'unified'
              ? isPersonalized
                ? `Personalized view: Your favorite categories (blue) plus related categories (orange) and posts (red boxes). Click posts for details. Double-click expandable nodes to reveal subcategories.`
                : `AI-powered semantic connections enhanced with shared post analysis including post nodes (red boxes). Click posts for details. Double-click expandable nodes to reveal subcategories.`
              : currentGraph === 'users'
              ? 'Shows users connected by shared interests. Connection strength indicates common categories.'
              : 'Network visualization of your content relationships.'
            }
            {!physicsEnabled && (
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#007bff' }}>
                🔧 Manual Mode: Drag nodes to position them freely. Physics disabled.
              </div>
            )}
          </div>

          {/* Legend Modal - only show when toggled */}
          {currentGraph === 'unified' && showLegend && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setShowLegend(false)}
            >
              <div
                className="card"
                style={{
                  padding: '2rem',
                  maxWidth: '600px',
                  width: '90%',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: '#2c3e50' }}>Network Legend</h3>
                  <button
                    onClick={() => setShowLegend(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                  {/* Connections Section */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '0.5rem' }}>Connections:</h4>
                    <div>🔵 <strong style={{ color: '#3498db' }}>Strong Connections</strong> - Over 50% similarity</div>
                    <div>🔘 <strong style={{ color: '#95a5a6' }}>Moderate Connections</strong> - Under 50% similarity</div>
                  </div>

                  {/* Nodes Section */}
                  <div>
                    <h4 style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '0.5rem' }}>Categories:</h4>
                    {isPersonalized ? (
                      <>
                        <div>💙 <strong style={{ color: '#3498db' }}>Your Favorites</strong> - Categories you've marked as favorites</div>
                        <div>🟠 <strong style={{ color: '#f39c12' }}>Related Categories</strong> - Categories connected to your favorites</div>
                        <div>🔴 <strong style={{ color: '#e74c3c' }}>Expanded Nodes</strong> - Categories showing subcategories</div>
                        <div>🔽 <strong>Double-click expandable nodes</strong> to reveal subcategories</div>
                      </>
                    ) : (
                      <>
                        <div>🔴 <strong style={{ color: '#e74c3c' }}>Expanded Nodes</strong> - Categories showing subcategories</div>
                        <div>🔽 <strong>Double-click expandable nodes</strong> to reveal subcategories</div>
                      </>
                    )}
                  </div>
                </div>
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
        {currentGraph === 'unified' && (
          <span> • <strong>Double-click expandable nodes</strong> to reveal subcategories • <strong>Click post nodes</strong> for details</span>
        )}
        {!physicsEnabled && (
          <span> • <strong>Drag nodes</strong> to reposition them manually</span>
        )}
      </div>

      {/* Post Details Modal */}
      {showPostModal && selectedPost && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closePostModal}
        >
          <div
            className="card"
            style={{
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.4rem', lineHeight: '1.3' }}>
                📄 {selectedPost.label}
              </h3>
              <button
                onClick={closePostModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '0.25rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Post Details */}
            <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  {selectedPost.title.split('\n').map((line, index) => (
                    <div key={index} style={{ marginBottom: '0.5rem' }}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={() => {
                    window.open(`/posts/${selectedPost.post_id}`, '_blank');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  📖 Read Full Post
                </button>

                <button
                  onClick={() => {
                    setFocusPostId(selectedPost.post_id);
                    closePostModal();
                    fetchGraphData('unified'); // Reload with this post as focus
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  🎯 Focus on This Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: '200px',
            padding: '8px 0'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
        >
          {contextMenu.nodeType === 'post' && (
            <>
              <div
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => {
                  const postId = contextMenu.nodeId.replace('post_', '');
                  handleFindSimilarPosts(postId);
                }}
              >
                🔍 Find Similar Posts
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => handleViewDetails(contextMenu.nodeData, 'post')}
              >
                📖 View Post Details
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => handleFocusOnNode(contextMenu.nodeId, 'post')}
              >
                🎯 Focus on This Post
              </div>
            </>
          )}

          {contextMenu.nodeType === 'category' && (
            <>
              <div
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => {
                  const categoryId = contextMenu.nodeId.replace('category_', '');
                  handleFindSimilarCategories(categoryId);
                }}
              >
                🔍 Find Similar Categories
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => handleViewDetails(contextMenu.nodeData, 'category')}
              >
                📂 View Category Details
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => handleFocusOnNode(contextMenu.nodeId, 'category')}
              >
                🎯 Focus on This Category
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Visualization;