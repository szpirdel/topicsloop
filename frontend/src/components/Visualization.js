import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import axios from '../api/axios';
import { fetchPostNetwork, fetchSimilarPosts, fetchSimilarCategories } from '../services/api';

const Visualization = () => {
  const networkRef = useRef(null);
  const networkInstance = useRef(null);
  const isInitialized = useRef(false);

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

  const getInitialFindSimilar = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('find_similar') === 'true';
  };

  const [currentGraph, setCurrentGraph] = useState(getInitialGraphType());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState({});
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [focusPostId, setFocusPostId] = useState(getInitialFocusPostId());
  const [focusCategoryId, setFocusCategoryId] = useState(getInitialFocusCategoryId());
  const [autoFindSimilar, setAutoFindSimilar] = useState(getInitialFindSimilar());
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Removed node menu state - using overlay buttons instead

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

  // Clear similarity highlighting
  const clearSimilarityHighlighting = useCallback(() => {
    if (networkInstance.current) {
      const nodes = networkInstance.current.body.data.nodes;
      const edges = networkInstance.current.body.data.edges;

      // Prepare batch updates for post nodes
      const allNodes = nodes.get();
      const nodesToUpdate = [];

      allNodes.forEach(node => {
        if (node.type === 'post') {
          nodesToUpdate.push({
            ...node,
            color: {
              background: '#3498db',
              border: '#2980b9'
            },
            size: 20 // Reset to default size
          });
        }
      });

      // Batch update nodes
      if (nodesToUpdate.length > 0) {
        nodes.update(nodesToUpdate);
      }

      // Remove similarity edges in batch
      const allEdges = edges.get();
      const edgesToRemove = allEdges
        .filter(edge => edge.id && edge.id.startsWith('similarity_'))
        .map(edge => edge.id);

      if (edgesToRemove.length > 0) {
        edges.remove(edgesToRemove);
      }

      console.log('🧹 Cleared similarity highlighting');
    }
  }, []);

  // Spatial organization for similar posts - SIDE BY SIDE layout
  const organizeSimilarPostsLayout = (originalPostId, similarPostIds, nodes) => {
    if (!networkInstance.current) return;

    console.log('🎯 Organizing similar posts layout - side-by-side');

    try {
      // 1. FREEZE all nodes first to prevent chaos
      const allNodes = nodes.get();
      const freezeUpdates = allNodes.map(node => ({
        id: node.id,
        fixed: { x: true, y: true },
        physics: false
      }));
      nodes.update(freezeUpdates);
      console.log(`🧊 Froze ${allNodes.length} nodes`);

      // 2. Get original post position
      const originalPostNodeId = `post_${originalPostId}`;
      let positions = networkInstance.current.getPositions([originalPostNodeId]);
      let centerX = positions[originalPostNodeId]?.x || 0;
      let centerY = positions[originalPostNodeId]?.y || 0;

      console.log(`📍 Original post position: (${centerX}, ${centerY})`);

      const similarPostNodeIds = similarPostIds.map(id => `post_${id}`);
      const nodesToReposition = [];

      // 3. Position original post on the LEFT
      nodesToReposition.push({
        id: originalPostNodeId,
        x: centerX - 37, // Move LEFT (reduced by 87.5% from original 300)
        y: centerY,
        fixed: { x: true, y: true },
        physics: false
      });

      // 4. Position similar posts on the RIGHT in a vertical column
      const verticalSpacing = 25; // Space between similar posts (reduced by 87.5% from original 200)
      const startY = centerY - ((similarPostIds.length - 1) * verticalSpacing) / 2;

      similarPostNodeIds.forEach((nodeId, index) => {
        const x = centerX + 50; // RIGHT side (reduced by 87.5% from original 400)
        const y = startY + (index * verticalSpacing);

        nodesToReposition.push({
          id: nodeId,
          x: x,
          y: y,
          fixed: { x: true, y: true },
          physics: false
        });

        console.log(`📍 Similar post ${index + 1}/${similarPostIds.length}: ${nodeId} -> (${x.toFixed(1)}, ${y.toFixed(1)})`);
      });

      // 5. Apply positions for original + similar posts
      nodes.update(nodesToReposition);
      console.log(`✅ Positioned ${nodesToReposition.length} posts (LEFT: original, RIGHT: similar)`);

      // 6. UNFREEZE ALL nodes after layout is done (including original + similar)
      setTimeout(() => {
        const unfreezeUpdates = allNodes.map(node => ({
          id: node.id,
          fixed: { x: false, y: false },
          physics: true
        }));

        nodes.update(unfreezeUpdates);
        console.log(`🔓 Unfroze ALL ${unfreezeUpdates.length} nodes - now draggable!`);
      }, 1200);  // Wait a bit longer for layout to settle

      // 7. Focus view on original + similar posts cluster
      setTimeout(() => {
        if (networkInstance.current) {
          const focusNodes = [originalPostNodeId, ...similarPostNodeIds];
          networkInstance.current.fit({
            nodes: focusNodes,
            animation: {
              duration: 1000,
              easingFunction: 'easeInOutQuad'
            },
            padding: 18
          });
          console.log('🎯 Focused view on side-by-side layout');
        }
      }, 600);

    } catch (error) {
      console.error('❌ Failed to organize similar posts layout:', error);
    }
  };

  // Removed node menu functions - using overlay buttons instead

  const handleFindSimilarPosts = async (postId) => {
    try {
      console.log('🚀 Starting similarity search for post ID:', postId);
      // Don't set loading state to prevent re-renders that destroy the network

      const similarPostsData = await fetchSimilarPosts(postId, {
        threshold: 0.5,
        limit: 5,
        method: 'gnn'  // 🧠 Only use GNN for similarity search - this is AI-specific!
      });

      console.log('📨 Received similarity response:', similarPostsData);

      if (similarPostsData.similar_posts && similarPostsData.similar_posts.length > 0) {
        console.log('🔍 FULL Similar posts response:', similarPostsData);
        console.log('🔍 Similar posts array:', similarPostsData.similar_posts);

        // Highlight similar posts on the current graph
        if (networkInstance.current && networkInstance.current.body && networkInstance.current.body.data) {
          console.log('🔍 Network instance validation passed');
          const nodes = networkInstance.current.body.data.nodes;
          const edges = networkInstance.current.body.data.edges;

          console.log('📊 Current graph nodes count:', nodes.length);
          console.log('📊 Current graph edges count:', edges.length);

          // Get all current nodes for debugging
          const allNodes = nodes.get();
          const postNodes = allNodes.filter(n => n.type === 'post');
          console.log('📄 Current post nodes in graph:', postNodes.map(n => ({id: n.id, label: n.label})));

          // Prepare batch updates for better performance
          const nodesToUpdate = [];

          // First, reset all post nodes to default colors and level
          allNodes.forEach(node => {
            if (node.type === 'post') {
              nodesToUpdate.push({
                ...node,
                color: {
                  background: node.id === `post_${postId}` ? '#ff8c00' : '#3498db', // Bright orange for original post
                  border: node.id === `post_${postId}` ? '#e67e00' : '#2980b9'
                },
                size: node.id === `post_${postId}` ? 25 : 20,
                level: node.id === `post_${postId}` ? 10 : 1  // Original post on top
              });
            }
          });

          // Extract similar post IDs and prepare highlights
          const similarPostIds = similarPostsData.similar_posts.map(sp => sp.post.id);
          console.log('🎯 Looking for similar post IDs:', similarPostIds);

          let highlightedCount = 0;
          const edgesToAdd = [];

          // Process similar posts and prepare batch updates
          similarPostIds.forEach(similarId => {
            const similarNodeId = `post_${similarId}`;
            console.log(`🔍 Searching for node: ${similarNodeId}`);

            const existingNode = nodes.get(similarNodeId);
            console.log(`📍 Node ${similarNodeId} exists:`, !!existingNode);

            if (existingNode) {
              console.log(`✅ Found node ${similarNodeId}, preparing highlight...`);

              // Find and update the node in our batch update array
              const updateIndex = nodesToUpdate.findIndex(n => n.id === similarNodeId);
              if (updateIndex !== -1) {
                nodesToUpdate[updateIndex] = {
                  ...nodesToUpdate[updateIndex],
                  color: {
                    background: '#e74c3c', // Red for similar posts
                    border: '#c0392b'
                  },
                  size: 25, // Make them bigger
                  level: 10  // Similar posts on top (same as original)
                };
              }
              highlightedCount++;

              // Prepare edge for batch addition
              const edgeId = `similarity_${postId}_${similarId}`;
              console.log(`🔗 Preparing edge: ${edgeId}`);

              if (!edges.get(edgeId)) {
                edgesToAdd.push({
                  id: edgeId,
                  from: `post_${postId}`,
                  to: similarNodeId,
                  color: { color: '#e74c3c' },
                  width: 3,
                  dashes: false,
                  title: 'Similar post connection'
                });
                console.log(`✅ Prepared edge: ${edgeId}`);
              } else {
                console.log(`⚠️ Edge ${edgeId} already exists`);
              }
            } else {
              console.log(`❌ Node ${similarNodeId} NOT FOUND in current graph`);
            }
          });

          // Execute batch updates for better performance
          if (nodesToUpdate.length > 0) {
            console.log(`📊 Batch updating ${nodesToUpdate.length} nodes`);
            console.log('📊 Network instance exists:', !!networkInstance.current);
            console.log('📊 Nodes DataSet exists:', !!nodes);
            try {
              nodes.update(nodesToUpdate);
              console.log('✅ Node batch update successful');

              // Organize similar posts spatially - move them to one side
              setTimeout(() => {
                organizeSimilarPostsLayout(postId, similarPostIds, nodes);
              }, 200); // Small delay to let the color updates render first

            } catch (error) {
              console.error('❌ Node batch update failed:', error);
            }
          }

          if (edgesToAdd.length > 0) {
            console.log(`🔗 Batch adding ${edgesToAdd.length} edges`);
            console.log('🔗 Edges DataSet exists:', !!edges);
            try {
              edges.add(edgesToAdd);
              console.log('✅ Edge batch update successful');
            } catch (error) {
              console.error('❌ Edge batch update failed:', error);
            }
          }

          console.log(`📊 SUMMARY: Highlighted ${highlightedCount}/${similarPostIds.length} posts, added ${edgesToAdd.length} edges`);

          // Debug: Check if graph is visually rendered
          setTimeout(() => {
            if (networkInstance.current) {
              const canvas = networkRef.current?.querySelector('canvas');
              console.log('🎨 Canvas element exists:', !!canvas);
              console.log('🎨 Canvas dimensions:', canvas ? `${canvas.width}x${canvas.height}` : 'N/A');
              console.log('🎨 Network container dimensions:', networkRef.current ? `${networkRef.current.offsetWidth}x${networkRef.current.offsetHeight}` : 'N/A');
              console.log('🎨 Network is stabilized:', !networkInstance.current.physics.physicsEnabled || networkInstance.current.physics.stabilized);

              // Force a redraw
              try {
                networkInstance.current.redraw();
                console.log('🎨 Forced network redraw');
              } catch (e) {
                console.error('❌ Failed to force redraw:', e);
              }
            }
          }, 100);

          // 🎯 NEW APPROACH: Add missing posts dynamically instead of reloading
          const missingCount = similarPostIds.length - highlightedCount;
          console.log(`📊 Similar posts status: ${highlightedCount}/${similarPostIds.length} found in current graph, ${missingCount} missing`);

          if (missingCount > 0) {
            console.log(`🔄 Adding ${missingCount} missing similar posts to current graph...`);

            // Get missing post data
            const missingPostIds = similarPostIds.filter(id => !nodes.get(`post_${id}`));
            const missingPostsData = similarPostsData.similar_posts.filter(sp =>
              missingPostIds.includes(sp.post.id)
            );

            // Add missing posts as nodes
            const newNodes = [];
            const newEdges = [];

            missingPostsData.forEach(similarPost => {
              const post = similarPost.post;
              const postNodeId = `post_${post.id}`;

              // Create post node
              newNodes.push({
                id: postNodeId,
                label: post.title.substring(0, 30) + (post.title.length > 30 ? '...' : ''),
                type: 'post',
                post_id: post.id,
                title: `📄 ${post.title}\n👤 ${post.author?.username || 'Unknown'}\n📅 ${new Date(post.created_at).toLocaleDateString()}\n📂 ${post.primary_category?.name || 'No category'}`,
                shape: 'box',
                size: 25,  // Same as highlighted posts
                color: {
                  background: '#e74c3c', // Red for similar posts
                  border: '#c0392b'
                },
                font: { size: 14, color: 'white' },
                physics: true,
                level: 10  // Similar posts appear on top!
              });

              // Create edge from original post to this similar post
              const edgeId = `similarity_${postId}_${post.id}`;
              newEdges.push({
                id: edgeId,
                from: `post_${postId}`,
                to: postNodeId,
                color: { color: '#e74c3c' },
                width: 3,
                dashes: false,
                title: `Similarity: ${(similarPost.similarity_score * 100).toFixed(1)}%`
              });

              // Connect post to its category if category node exists
              if (post.primary_category) {
                const catNodeId = `category_${post.primary_category.id}`;
                if (allNodes.some(n => n.id === catNodeId)) {
                  newEdges.push({
                    id: `post_${post.id}_to_cat_${post.primary_category.id}`,
                    from: postNodeId,
                    to: catNodeId,
                    title: 'Primary category',
                    color: { color: '#95a5a6' },
                    width: 2,
                    dashes: [5, 5]
                  });
                }
              }
            });

            // Add new nodes and edges to the graph
            if (newNodes.length > 0) {
              try {
                nodes.add(newNodes);
                edges.add(newEdges);
                console.log(`✅ Added ${newNodes.length} missing posts and ${newEdges.length} connections to graph`);

                // Organize all similar posts spatially
                setTimeout(() => {
                  organizeSimilarPostsLayout(postId, similarPostIds, nodes);
                }, 300);

                setSuccessMessage(`🔍 Found ${similarPostsData.similar_posts.length} similar posts! ${highlightedCount} highlighted, ${newNodes.length} added to graph.`);
              } catch (error) {
                console.error('❌ Failed to add missing posts:', error);
                setSuccessMessage(`🔍 Found ${similarPostsData.similar_posts.length} similar posts! ${highlightedCount} highlighted in red.`);
              }
            }
          } else {
            setSuccessMessage(`🔍 Found ${similarPostsData.similar_posts.length} similar posts! All ${highlightedCount} highlighted in red with connection lines.`);
          }
        } else {
          console.log('❌ Network instance validation failed');
          console.log('❌ networkInstance.current:', !!networkInstance.current);
          console.log('❌ networkInstance.current.body:', !!(networkInstance.current && networkInstance.current.body));
          console.log('❌ networkInstance.current.body.data:', !!(networkInstance.current && networkInstance.current.body && networkInstance.current.body.data));
          setSuccessMessage(`⚠️ Found ${similarPostsData.similar_posts.length} similar posts but graph needs to refresh. Please try again.`);
        }
      } else {
        console.log('❌ No similar posts found or empty response');
        setSuccessMessage('🔍 No similar posts found with current similarity threshold.');
      }
    } catch (error) {
      console.error('Error finding similar posts:', error);
      setSuccessMessage('❌ Error finding similar posts. Please try again.');
    }
  };

  const handleFindSimilarCategories = useCallback(async (categoryId) => {
    try {
      // Menu functionality removed
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
  }, []);

  const handleViewDetails = useCallback((nodeData, nodeType) => {
    // hideNodeMenu removed

    if (nodeType === 'post') {
      setSelectedPost(nodeData);
      setShowPostModal(true);
    } else if (nodeType === 'category') {
      // Navigate to category page or show category details
      window.open(`/categories?focus=${nodeData.id}`, '_blank');
    }
  }, []);

  const handleFocusOnNode = useCallback((nodeId, nodeType) => {
    // hideNodeMenu removed

    if (nodeType === 'post') {
      const postId = nodeId.replace('post_', '');
      setFocusPostId(postId);
      // Graph will reload automatically when focusPostId changes
    } else if (nodeType === 'category') {
      const categoryId = nodeId.replace('category_', '');
      setFocusCategoryId(categoryId);
      // Graph will reload automatically when focusCategoryId changes
    }
  }, []);

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
        max_connections: 3,
        method: 'fallback'  // 🚀 OPTIMIZATION: Use fallback for category expansion (faster)
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
            background: '#28a745',
            border: '#1e7e34'
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

    // 🎯 RADIAL/CIRCULAR LAYOUT - Posts cluster around their categories
    // Works for both 'hierarchical' and 'unified' views
    if (currentGraph === 'hierarchical' || currentGraph === 'unified') {
      return {
        ...baseOptions,
        layout: {
          improvedLayout: false,  // DISABLE - it was overriding our settings!
          randomSeed: undefined
        },
        physics: {
          enabled: true,  // Enable for initial layout
          stabilization: {
            enabled: true,
            iterations: 5000,  // Layout calculation
            updateInterval: 100,
            fit: true,
            onlyDynamicEdges: false
          },
          forceAtlas2Based: {
            gravitationalConstant: -62,  // Reduced by 87.5% total (from original -500)
            centralGravity: 0.008,  // Strong pull to keep nodes very close
            springLength: 50,  // Reduced by 87.5% total (from original 400)
            springConstant: 0.08,  // Very strong springs for ultra-tight clustering
            damping: 0.4,
            avoidOverlap: 0.1  // Minimal overlap avoidance for very compact layout
          },
          solver: 'forceAtlas2Based',
          timestep: 0.35,
          adaptiveTimestep: true
        },
        interaction: {
          ...baseOptions.interaction,
          dragNodes: true,
          dragView: true,
          zoomView: true
        }
      };
    }

    // Standard physics for other layouts - optimized for many nodes
    return {
      ...baseOptions,
      physics: {
        enabled: physicsEnabled,
        stabilization: {
          enabled: physicsEnabled,
          iterations: physicsEnabled ? 2000 : 0,  // More iterations for 109 posts
          updateInterval: 50,  // Less frequent updates = smoother
          fit: true  // Auto-fit after stabilization
        },
        barnesHut: {
          gravitationalConstant: -15000,  // Strong repulsion = better spacing
          centralGravity: 0.05,  // Very little central pull = spread out
          springLength: 200,  // Long springs = lots of space between nodes
          springConstant: 0.01,  // Loose springs = flexible positioning
          damping: 0.2,  // High damping = faster stabilization
          avoidOverlap: 0.8  // Strong overlap avoidance
        },
        solver: 'barnesHut',  // Best for many nodes
        timestep: 0.5  // Larger timestep = faster simulation
      },
      layout: {
        improvedLayout: true,
        clusterThreshold: 200  // Better clustering for many nodes
      },
      interaction: {
        ...baseOptions.interaction,
        dragNodes: true,
        dragView: true,
        zoomView: true
      }
    };
  }, [currentGraph, physicsEnabled]);

  // 🚀 OPTIMIZATION: Fetch graph data with controlled GNN usage
  // GNN is only used when actually needed (focus_post, AI similarity features)
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
          max_posts: 200,  // 🎯 PHASE 1: Show ALL posts by default (was 20)
          max_connections: 5,
          personalized: personalized,  // Pass personalization to post network
          method: 'fallback'  // 🚀 OPTIMIZATION: Use fallback by default (faster loading)
        };

        // Add focus_post_id if available
        if (focusPostId) {
          params.focus_post_id = focusPostId;
          // 🧠 Only use GNN when focusing on specific post (AI-enhanced similarity)
          params.method = 'gnn';
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
        isInitialized.current = false; // Reset initialization flag
      }

    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(`Failed to load ${graphType} network data`);
    } finally {
      setLoading(false);
    }
  }, [focusPostId, focusCategoryId, isPersonalized]);

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
            const distance = 15; // Reduced by 87.5% total (from original ~120 to 15)
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

    // 🔒 AUTO-DISABLE PHYSICS: Freeze nodes after initial stabilization
    // This prevents continuous node movement after the graph layout is complete
    if (currentGraph === 'hierarchical' || currentGraph === 'unified') {
      networkInstance.current.once('stabilizationIterationsDone', () => {
        console.log('✅ Stabilization complete - disabling physics to freeze nodes');
        if (networkInstance.current) {
          networkInstance.current.setOptions({ physics: { enabled: false } });
          console.log('🔒 Physics disabled - nodes frozen in place');
        }
      });

      // Fallback: Also listen to stabilized event (fires when nodes stop moving)
      networkInstance.current.once('stabilized', (params) => {
        console.log('✅ Graph stabilized after', params.iterations, 'iterations');
        if (networkInstance.current) {
          networkInstance.current.setOptions({ physics: { enabled: false } });
          console.log('🔒 Physics disabled via stabilized event');
        }
      });
    }

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
              background: '#ff8c00', // Bright orange for focused post
              border: '#e67e00',
              highlight: {
                background: '#ffa500',
                border: '#e67e00'
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
            scale: 0.375,  // Reduced by 75% total from original 1.5
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
            scale: 0.375,  // Reduced by 75% total from original 1.5
            animation: {
              duration: 500,
              easingFunction: 'easeInOutQuad'
            }
          });
        }
      } else {
        // Normal zoom when no focus post
        networkInstance.current.moveTo({
          scale: 0.375,  // Reduced by 75% total from original 1.5
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

    // Minimal DataSet event listeners for critical debugging only
    nodes.on('add', (event, properties) => {
      if (properties.items.length > 1) {
        console.log('📊 DataSet bulk ADD:', properties.items.length, 'nodes');
      }
    });

    edges.on('add', (event, properties) => {
      if (properties.items.length > 1) {
        console.log('🔗 DataSet bulk EDGE ADD:', properties.items.length, 'edges');
      }
    });

    // Ensure DataSet is fully loaded before proceeding
    console.log('📊 DataSet initialization complete. Nodes:', nodes.length, 'Edges:', edges.length);

    // Add event listeners
    networkInstance.current.on('click', (params) => {
      console.log('👆 LEFT-CLICK params:', params);

      if (params.nodes.length === 0) {
        console.log('👆 LEFT-CLICK on empty space');
        return;
      }

      const nodeId = params.nodes[0];

      try {
        const node = nodes.get(nodeId);
        if (!node) {
          console.warn('Node not found in DataSet:', nodeId);
          return;
        }

        console.log('👆 LEFT-CLICK on node:', node.label, '(id:', nodeId, 'type:', node.type, ')');

        // Handle post nodes directly - open post detail overlay
        if (currentGraph === 'unified' && node?.type === 'post') {
          console.log('📄 Post node clicked - opening detail overlay');
          handlePostNodeClick(node);
        }

      } catch (error) {
        console.error('Error accessing node data:', error);
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

          // Node menu removed - no need to check visibility

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

    // Clean up - no right-click handlers needed anymore
  }, [graphData, networkOptions, currentGraph, expandedNodes]);

  // Log when useEffect runs to debug re-rendering issues
  console.log('🔄 useEffect [initializeNetwork] running. Trigger:', {
    graphDataNodes: graphData?.nodes?.length,
    currentGraph,
    expandedNodesSize: expandedNodes.size
  });

  // Click outside handler removed - no node menu needed

  // Handle graph type change
  const handleGraphTypeChange = (newType) => {
    setCurrentGraph(newType);
    setExpandedNodes(new Set()); // Reset expanded nodes when changing graph types

    // Clear similarity highlighting when changing graph types
    clearSimilarityHighlighting();

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
        networkInstance.current = null;
        isInitialized.current = false;
      }
    };
  }, [currentGraph, fetchGraphData, isPersonalized, focusPostId, focusCategoryId]);

  // Initialize network when data is loaded (only for initial load, not for dynamic updates)
  useEffect(() => {
    console.log('🔄 useEffect [initializeNetwork] triggered. Conditions:', {
      hasNodes: graphData.nodes.length > 0,
      hasContainer: !!networkRef.current,
      noInstance: !networkInstance.current,
      shouldInit: graphData.nodes.length > 0 && networkRef.current && !networkInstance.current
    });

    if (graphData.nodes.length > 0 && networkRef.current && !networkInstance.current && !isInitialized.current) {
      console.log('🔄 Initializing network for the first time');
      isInitialized.current = true;
      initializeNetwork();

      // Auto-scroll to graph if focus_post or focus_category parameter is present
      if ((focusPostId || focusCategoryId) && networkRef.current) {
        setTimeout(() => {
          if (networkRef.current) {
            networkRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            console.log('📍 Auto-scrolled to graph canvas for focused item');
          }
        }, 100); // Small delay to ensure network is rendered
      }

      // Auto-trigger similar posts if find_similar parameter is present
      if (autoFindSimilar && focusPostId) {
        console.log('🔄 Auto-triggering similar posts for focus post:', focusPostId);
        setTimeout(() => {
          handleFindSimilarPosts(focusPostId);
          setAutoFindSimilar(false); // Prevent repeated triggers
        }, 1500); // Wait for graph to stabilize before finding similar posts
      }
    }
  }, [graphData, initializeNetwork, focusPostId, focusCategoryId, autoFindSimilar]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Small delay to allow DOM to update, then fit the network to new container size
    setTimeout(() => {
      if (networkInstance.current) {
        networkInstance.current.fit();
      }
    }, 100);
  };

  // Auto-hide success message after 6 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Global click listener removed - no node menu needed

  return (
    <div
      className="content-container"
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'white',
        padding: '1rem',
        overflow: 'auto'
      } : {}}
    >
      {!isFullscreen && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>Network Visualizations</h1>
        </div>
      )}

      <div
        className="visualization-container"
        style={isFullscreen ? {
          textAlign: 'center',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        } : {
          textAlign: 'center'
        }}
      >
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
                {isStabilizing ? '⚡ Stabilizing...' : physicsEnabled ? '🔧 Turn Off Physics' : '⚡ Turn On Physics'}
              </button>

              <button
                onClick={toggleFullscreen}
                className={`btn btn-sm ${isFullscreen ? 'btn-success' : 'btn-outline-success'}`}
              >
                {isFullscreen ? '🪟 Exit Fullscreen' : '⛶ Fullscreen'}
              </button>

            </div>
          )}

          {/* Graph Description - only show in normal mode */}
          {!isFullscreen && (
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
              {physicsEnabled && (
                <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  ⚡ Physics Mode: Automatic layout with force-directed positioning.
                </div>
              )}
            </div>
          )}

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
          <div
            ref={networkRef}
            className="visualization-canvas"
            style={isFullscreen ? {
              flex: 1,
              height: 'calc(100vh - 100px)', // More space in fullscreen
              minHeight: '600px'
            } : {}}
          />
        )}

        {/* Floating Exit Fullscreen Button */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 10000
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            🪟 Exit Fullscreen
          </button>
        )}
      </div>

      {/* Controls Info */}
      {!isFullscreen && (
        <div className="text-center mt-3" style={{ fontSize: '0.8rem', color: '#6c757d' }}>
          <strong>Controls:</strong> Drag to pan • Scroll to zoom • Click nodes for details • Hover for information
          {currentGraph === 'unified' && (
            <span> • <strong>Double-click expandable nodes</strong> to reveal subcategories • <strong>Click post nodes</strong> for details</span>
          )}
          {!physicsEnabled && (
            <span> • <strong>Drag nodes</strong> to reposition them manually (Manual Mode)</span>
          )}
          {physicsEnabled && (
            <span> • <strong>Physics active</strong> - nodes auto-position with forces</span>
          )}
        </div>
      )}

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
                    const postId = selectedPost.post_id;
                    console.log('🔍 Finding similar posts for:', postId);
                    closePostModal();
                    handleFindSimilarPosts(postId);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  🔍 Find Similar Posts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {successMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#28a745',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxWidth: '400px',
            fontSize: '0.9rem',
            fontWeight: '500',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          {successMessage}
          <button
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.2rem',
              cursor: 'pointer',
              marginLeft: '1rem',
              padding: '0'
            }}
          >
            ✕
          </button>
        </div>
      )}


      {/* Node menu removed - using overlay buttons instead */}
    </div>
  );
};

export default Visualization;