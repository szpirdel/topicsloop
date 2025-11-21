import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import axios from '../api/axios';
import { fetchPostNetwork, fetchSimilarPosts, fetchSimilarCategories } from '../services/api';

const Visualization = () => {
  const networkRef = useRef(null);
  const networkInstance = useRef(null);
  const isInitialized = useRef(false);

  // Cache for different visibility levels
  const currentVisibilityLevelRef = useRef(1); // Track current level using ref for immediate updates
  const savedL2NodesRef = useRef([]); // Cache L2 (subcategories) nodes
  const savedL2EdgesRef = useRef([]); // Cache L2 edges
  const savedL3NodesRef = useRef([]); // Cache L3 (sub-subcategories) nodes
  const savedL3EdgesRef = useRef([]); // Cache L3 edges
  const savedPostNodesRef = useRef([]); // Cache post nodes
  const savedPostEdgesRef = useRef([]); // Cache post edges

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
  const [currentZoomLevel, setCurrentZoomLevel] = useState(0.25); // Track current zoom level - start very zoomed out
  const [currentVisibilityLevel, setCurrentVisibilityLevel] = useState(1); // Track what's currently visible: 1=L1, 2=L1+L2, 3=L1+L2+L3, 4=all+posts

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
        threshold: 0.25,  // Lower threshold for semantic embeddings (typical range: 0.3-0.5)
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


  // 🎯 CIRCULAR LAYOUT: Arrange nodes in circles by category
  const arrangeNodesInCircles = useCallback((nodes) => {
    // Separuj typy nodów
    const categoryNodes = nodes.filter(n => n.type === 'category');
    const postNodes = nodes.filter(n => n.type === 'post');

    // Grupuj kategorie według poziomu
    const l0Nodes = categoryNodes.filter(n => n.level === 0); // Main categories
    const l1Nodes = categoryNodes.filter(n => n.level === 1); // Subcategories
    const l2Nodes = categoryNodes.filter(n => n.level === 2); // Sub-subcategories

    console.log(`🔵 Arranging circles: L0=${l0Nodes.length}, L1=${l1Nodes.length}, L2=${l2Nodes.length}, posts=${postNodes.length}`);

    // Promienie okręgów
    const L0_RADIUS = 400;  // Główne kategorie - duży okrąg
    const L1_RADIUS = 150;  // Podkategorie wokół rodzica
    const L2_RADIUS = 80;   // Sub-podkategorie wokół rodzica
    const POST_RADIUS = 50; // Posty wokół kategorii

    // 1. Rozmieść L0 (główne kategorie) w dużym okręgu
    l0Nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / l0Nodes.length;
      node.x = L0_RADIUS * Math.cos(angle);
      node.y = L0_RADIUS * Math.sin(angle);
      node.fixed = { x: true, y: true };
    });

    // Mapa pozycji kategorii dla dzieci
    const categoryPositions = {};
    l0Nodes.forEach(n => {
      categoryPositions[n.id] = { x: n.x, y: n.y };
    });

    // 2. Rozmieść L1 (podkategorie) wokół ich rodziców L0
    // Grupuj L1 według rodzica
    const l1ByParent = {};
    l1Nodes.forEach(node => {
      const parentId = node.parent_id ? `category_${node.parent_id}` : null;
      if (parentId && categoryPositions[parentId]) {
        if (!l1ByParent[parentId]) l1ByParent[parentId] = [];
        l1ByParent[parentId].push(node);
      }
    });

    Object.entries(l1ByParent).forEach(([parentId, children]) => {
      const parentPos = categoryPositions[parentId];
      children.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / children.length;
        node.x = parentPos.x + L1_RADIUS * Math.cos(angle);
        node.y = parentPos.y + L1_RADIUS * Math.sin(angle);
        node.fixed = { x: true, y: true };
        categoryPositions[node.id] = { x: node.x, y: node.y };
      });
    });

    // 3. Rozmieść L2 wokół ich rodziców L1
    const l2ByParent = {};
    l2Nodes.forEach(node => {
      const parentId = node.parent_id ? `category_${node.parent_id}` : null;
      if (parentId && categoryPositions[parentId]) {
        if (!l2ByParent[parentId]) l2ByParent[parentId] = [];
        l2ByParent[parentId].push(node);
      }
    });

    Object.entries(l2ByParent).forEach(([parentId, children]) => {
      const parentPos = categoryPositions[parentId];
      children.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / children.length;
        node.x = parentPos.x + L2_RADIUS * Math.cos(angle);
        node.y = parentPos.y + L2_RADIUS * Math.sin(angle);
        node.fixed = { x: true, y: true };
        categoryPositions[node.id] = { x: node.x, y: node.y };
      });
    });

    // 4. Rozmieść posty wokół ich kategorii
    const postsByCategory = {};
    postNodes.forEach(node => {
      const catId = node.category_id ? `category_${node.category_id}` : null;
      if (catId && categoryPositions[catId]) {
        if (!postsByCategory[catId]) postsByCategory[catId] = [];
        postsByCategory[catId].push(node);
      }
    });

    Object.entries(postsByCategory).forEach(([catId, posts]) => {
      const catPos = categoryPositions[catId];
      posts.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / posts.length;
        node.x = catPos.x + POST_RADIUS * Math.cos(angle);
        node.y = catPos.y + POST_RADIUS * Math.sin(angle);
        node.fixed = { x: true, y: true };
      });
    });

    console.log(`✅ Circular layout complete`);
    return nodes;
  }, []);

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
            iterations: 500,  // 🚀 REDUCED from 5000 to 500 for faster loading
            updateInterval: 25,  // 🚀 REDUCED from 100 to 25 for faster updates
            fit: true,
            onlyDynamicEdges: false
          },
          forceAtlas2Based: {
            gravitationalConstant: -40,  // Less repulsion = more compact (was -62)
            centralGravity: 0.03,  // Stronger central pull = tighter cluster (was 0.008)
            springLength: 25,  // Shorter springs = nodes closer together (was 50)
            springConstant: 0.12,  // Stronger springs = tighter grouping (was 0.08)
            damping: 0.6,  // 🚀 INCREASED from 0.4 to 0.6 for faster stabilization
            avoidOverlap: 0.15  // Slight overlap avoidance for compact yet readable layout (was 0.1)
          },
          solver: 'forceAtlas2Based',
          timestep: 0.7,  // 🚀 INCREASED from 0.35 to 0.7 for faster simulation
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
          iterations: physicsEnabled ? 500 : 0,  // 🚀 REDUCED from 2000 to 500 for faster loading
          updateInterval: 25,  // 🚀 REDUCED from 50 to 25 = more frequent updates = faster
          fit: true  // Auto-fit after stabilization
        },
        barnesHut: {
          gravitationalConstant: -15000,  // Strong repulsion = better spacing
          centralGravity: 0.05,  // Very little central pull = spread out
          springLength: 200,  // Long springs = lots of space between nodes
          springConstant: 0.01,  // Loose springs = flexible positioning
          damping: 0.3,  // 🚀 INCREASED from 0.2 to 0.3 = faster stabilization
          avoidOverlap: 0.8  // Strong overlap avoidance
        },
        solver: 'barnesHut',  // Best for many nodes
        timestep: 0.8  // 🚀 INCREASED from 0.5 to 0.8 = faster simulation
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

        // ⏱️ TIMING: Measure API fetch time
        const fetchStart = performance.now();
        data = await fetchPostNetwork(params);
        const fetchEnd = performance.now();
        console.log(`⏱️ API fetch time: ${(fetchEnd - fetchStart).toFixed(0)}ms (cached: ${data.stats?.cached})`);

        // Fetching unified network with posts
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


  // Initialize network
  const initializeNetwork = useCallback(() => {
    if (!networkRef.current) return;

    // ⏱️ TIMING: Measure vis.js rendering time
    const renderStart = performance.now();

    // 🎯 Apply circular layout before creating DataSet
    const arrangedNodes = arrangeNodesInCircles([...graphData.nodes]);

    const nodes = new DataSet(arrangedNodes);
    const edges = new DataSet(graphData.edges);

    const data = { nodes, edges };

    networkInstance.current = new Network(networkRef.current, data, networkOptions);

    const renderEnd = performance.now();
    console.log(`⏱️ Vis.js initial render: ${(renderEnd - renderStart).toFixed(0)}ms`);

    // 🔒 AUTO-DISABLE PHYSICS: Freeze nodes after initial stabilization
    // This prevents continuous node movement after the graph layout is complete
    if (currentGraph === 'hierarchical' || currentGraph === 'unified') {
      const stabilizationStart = performance.now();
      networkInstance.current.once('stabilizationIterationsDone', () => {
        const stabilizationEnd = performance.now();
        console.log(`✅ Stabilization complete in ${(stabilizationEnd - stabilizationStart).toFixed(0)}ms - disabling physics to freeze nodes`);
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
      console.log('🔍 ========== NETWORK DRAWING COMPLETED ==========');
      console.log('🎯 STARTING INITIAL LOAD - Progressive removal');

      const allNodes = nodes.get();
      const allEdges = edges.get();

      console.log(`📊 Total nodes from API: ${allNodes.length}`);

      // 🔍 DEBUG: Check what we got from API
      const categoryNodes = allNodes.filter(node => node.type === 'category');
      const postNodes = allNodes.filter(node => node.type === 'post');

      console.log(`📂 Category nodes: ${categoryNodes.length}`);
      console.log(`📄 Post nodes: ${postNodes.length}`);

      const nodesWithoutLevel = categoryNodes.filter(n =>n.level === undefined || n.level === null);console.log(`❌ Categories WITHOUT level: ${nodesWithoutLevel.length}`);
        if (nodesWithoutLevel.length > 0) {
      console.log(`❌ Sample nodes without level:`, nodesWithoutLevel.slice(0, 5).map(n => n.label));}

      // Group by level
      const l0Nodes = categoryNodes.filter(n => n.level === 0);
      const l1Nodes = categoryNodes.filter(n => n.level === 1);
      const l2Nodes = categoryNodes.filter(n => n.level === 2);
      const undefinedLevel = categoryNodes.filter(n => n.level === undefined);

      console.log(`📊 Level breakdown:`);
      console.log(`  - L0 (main): ${l0Nodes.length} nodes`);
      console.log(`  - L1 (sub): ${l1Nodes.length} nodes`);
      console.log(`  - L2 (sub-sub): ${l2Nodes.length} nodes`);
      console.log(`  - Undefined level: ${undefinedLevel.length} nodes`);

      // Sample categories with their properties
      console.log(`📋 Sample categories:`);
      categoryNodes.slice(0, 5).forEach(node => {
        console.log(`  - ${node.label}: level=${node.level}, post_count=${node.post_count}, size=${node.size}`);
      });

      // Helper function to save and remove nodes
      const saveAndRemove = (nodesToRemove, savedNodesRef, savedEdgesRef) => {
        if (nodesToRemove.length === 0) return;

        const nodeIds = nodesToRemove.map(n => n.id);
        const positions = networkInstance.current.getPositions(nodeIds);

        // Save nodes with positions
        savedNodesRef.current = nodesToRemove.map(node => ({
          ...node,
          x: positions[node.id]?.x || 0,
          y: positions[node.id]?.y || 0,
          fixed: { x: true, y: true }
        }));

        // Save edges
        savedEdgesRef.current = allEdges.filter(edge =>
          nodeIds.includes(edge.from) || nodeIds.includes(edge.to)
        );

        // Remove from graph
        if (savedEdgesRef.current.length > 0) {
          edges.remove(savedEdgesRef.current.map(e => e.id));
        }
        nodes.remove(nodeIds);

        console.log(`💾 Initial save: ${nodesToRemove.length} nodes, ${savedEdgesRef.current.length} edges`);
      };

      // Remove L2 categories (level 1)
      const l2NodesToRemove = allNodes.filter(node => node.type === 'category' && node.level === 1);
      console.log(`🗑️ Removing L2 nodes: ${l2NodesToRemove.length}`);
      saveAndRemove(l2NodesToRemove, savedL2NodesRef, savedL2EdgesRef);

      // Remove L3 categories (level 2)
      const l3NodesToRemove = allNodes.filter(node => node.type === 'category' && node.level === 2);
      console.log(`🗑️ Removing L3 nodes: ${l3NodesToRemove.length}`);
      saveAndRemove(l3NodesToRemove, savedL3NodesRef, savedL3EdgesRef);

      // Remove posts
      const postNodesToRemove = allNodes.filter(node => node.type === 'post');
      console.log(`🗑️ Removing post nodes: ${postNodesToRemove.length}`);
      saveAndRemove(postNodesToRemove, savedPostNodesRef, savedPostEdgesRef);

      console.log(`✅ Initial load complete - showing only L1 categories`);
      console.log(`📊 Remaining nodes: ${nodes.get().length}`);
      currentVisibilityLevelRef.current = 1;
      setCurrentVisibilityLevel(1);

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
            scale: 0.25,  // Very zoomed out - show only L1 categories
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
            scale: 0.25,  // Very zoomed out - show only L1 categories
            animation: {
              duration: 500,
              easingFunction: 'easeInOutQuad'
            }
          });
        }
      } else {
        // Normal zoom when no focus post
        networkInstance.current.moveTo({
          scale: 0.25,  // Very zoomed out - show only L1 categories
          animation: {
            duration: 500,
            easingFunction: 'easeInOutQuad'
          }
        });
      }

      // 🔓 Odmroź L0 nody po 1 sekundzie żeby można było je przeciągać
      setTimeout(() => {
        const l0Nodes = nodes.get().filter(n => n.type === 'category' && n.level === 0);
        const unfreezeUpdates = l0Nodes.map(node => ({
          id: node.id,
          fixed: { x: false, y: false }
        }));
        nodes.update(unfreezeUpdates);
        console.log(`🔓 Unfroze ${l0Nodes.length} L0 nodes - now draggable`);
      }, 1000);
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

        // === UNIFIED GRAPH DOUBLE-CLICK HANDLING ===
        if (currentGraph === 'unified') {
          console.log(`🎯 Double-clicked node: ${node?.label} (id: ${nodeId}) type: ${node?.type}`);

          // Handle post nodes in unified graph - focus on this post
          if (node?.type === 'post') {
            console.log('📄 Post double-clicked in unified graph - focusing on this post');
            setFocusPostId(node.post_id);
            fetchGraphData('unified'); // Reload with new focus
            return;
          }

          // Category double-click - no expansion logic anymore
          if (node?.type === 'category') {
            console.log('📂 Category double-clicked - zoom-based loading will handle posts display');
            return;
          }
        }
      } else {
        console.log(`⚠️ Double-click on empty space`);
      }
    });

    networkInstance.current.on('hoverNode', (params) => {
      console.log('Node hovered:', params.node);
    });

    // 🔍 PROGRESSIVE LOADING: Show L1 → L1+L2 → L1+L2+L3 → all+posts based on zoom
    networkInstance.current.on('zoom', (params) => {
      const zoomLevel = params.scale;
      setCurrentZoomLevel(zoomLevel);

      // 🎯 Zoom thresholds for progressive disclosure
      const THRESHOLD_L2 = 0.35;  // Show L2 (subcategories)
      const THRESHOLD_L3 = 0.55;  // Show L3 (sub-subcategories)
      const THRESHOLD_POSTS = 0.75; // Show posts

      // Determine target visibility level
      let targetLevel;
      if (zoomLevel < THRESHOLD_L2) {
        targetLevel = 1; // Only L1
      } else if (zoomLevel < THRESHOLD_L3) {
        targetLevel = 2; // L1 + L2
      } else if (zoomLevel < THRESHOLD_POSTS) {
        targetLevel = 3; // L1 + L2 + L3
      } else {
        targetLevel = 4; // L1 + L2 + L3 + posts
      }

      // Only update if visibility level changed
      const currentLevel = currentVisibilityLevelRef.current;

      if (targetLevel !== currentLevel) {
        console.log(`🔍 Zoom ${zoomLevel.toFixed(2)} → Level ${targetLevel} (L1${targetLevel >= 2 ? '+L2' : ''}${targetLevel >= 3 ? '+L3' : ''}${targetLevel >= 4 ? '+posts' : ''}) [from level ${currentLevel}]`);

        currentVisibilityLevelRef.current = targetLevel;
        setCurrentVisibilityLevel(targetLevel);

        const allNodes = nodes.get();
        const allEdges = edges.get();

        // Helper function to save and remove nodes
        const saveAndRemove = (nodesToRemove, savedNodesRef, savedEdgesRef) => {
          if (nodesToRemove.length === 0) return;

          const nodeIds = nodesToRemove.map(n => n.id);
          const positions = networkInstance.current.getPositions(nodeIds);

          // Save nodes with positions
          savedNodesRef.current = nodesToRemove.map(node => ({
            ...node,
            x: positions[node.id].x,
            y: positions[node.id].y,
            fixed: { x: true, y: true }
          }));

          // Save edges
          savedEdgesRef.current = allEdges.filter(edge =>
            nodeIds.includes(edge.from) || nodeIds.includes(edge.to)
          );

          // Remove from graph
          edges.remove(savedEdgesRef.current.map(e => e.id));
          nodes.remove(nodeIds);

          console.log(`🗑️ Removed ${nodesToRemove.length} nodes, ${savedEdgesRef.current.length} edges`);
        };

        // Helper function to restore nodes with circular layout around parents
        const restore = (savedNodesRef, savedEdgesRef) => {
          if (savedNodesRef.current.length === 0) return;

          // 🔍 Check for duplicates before adding
          const currentNodes = nodes.get();
          const currentNodeIds = new Set(currentNodes.map(n => n.id));

          const nodesToAdd = savedNodesRef.current.filter(node => !currentNodeIds.has(node.id));

          if (nodesToAdd.length === 0) {
            console.log(`⚠️ All nodes already exist - skipping restore`);
            return;
          }

          // 🎯 Oblicz pozycje kołowe wokół rodziców
          const RADIUS_L1 = 150;
          const RADIUS_L2 = 80;
          const RADIUS_POST = 50;

          // Pobierz pozycje rodziców (nodów które są już widoczne)
          const parentPositions = {};
          currentNodes.forEach(n => {
            const pos = networkInstance.current.getPositions([n.id])[n.id];
            if (pos) parentPositions[n.id] = pos;
          });

          // 🎯 Użyj EDGES żeby znaleźć rodziców (relacje są w krawędziach!)
          const allSavedEdges = [
            ...savedL2EdgesRef.current,
            ...savedL3EdgesRef.current,
            ...savedPostEdgesRef.current
          ];

          // Grupuj nody według rodzica używając edges
          const byParent = {};
          nodesToAdd.forEach(node => {
            // Znajdź edge który łączy ten node z rodzicem (from = parent, to = child)
            const parentEdge = allSavedEdges.find(edge =>
              edge.to === node.id && parentPositions[edge.from]
            );

            if (parentEdge) {
              const parentId = parentEdge.from;
              if (!byParent[parentId]) byParent[parentId] = [];
              byParent[parentId].push(node);
            }
          });

          console.log('🔍 DEBUG: Found parents for', Object.keys(byParent).length, 'groups');

          // Ustaw pozycje w okręgach wokół rodziców
          Object.entries(byParent).forEach(([parentId, children]) => {
            const parentPos = parentPositions[parentId];
            const radius = children[0]?.type === 'post' ? RADIUS_POST :
                          children[0]?.level === 2 ? RADIUS_L2 : RADIUS_L1;

            children.forEach((node, index) => {
              const angle = (2 * Math.PI * index) / children.length;
              node.x = parentPos.x + radius * Math.cos(angle);
              node.y = parentPos.y + radius * Math.sin(angle);
              node.fixed = { x: true, y: true };
            });
          });

          nodes.add(nodesToAdd);

          // Only add edges that don't already exist
          const currentEdges = edges.get();
          const currentEdgeIds = new Set(currentEdges.map(e => e.id));
          const edgesToAdd = savedEdgesRef.current.filter(edge => !currentEdgeIds.has(edge.id));

          if (edgesToAdd.length > 0) {
            edges.add(edgesToAdd);
          }

          console.log(`✅ Restored ${nodesToAdd.length} nodes in circles, ${edgesToAdd.length} edges`);

          // Unfreeze after 500ms
          setTimeout(() => {
            const unfreezeUpdates = nodesToAdd.map(node => ({
              id: node.id,
              fixed: { x: false, y: false }
            }));
            nodes.update(unfreezeUpdates);
            console.log(`🔓 Unfroze ${nodesToAdd.length} restored nodes`);
          }, 500);
        };

        // 📉 ZOOM OUT: Remove higher levels
        if (targetLevel < currentLevel) {
          console.log(`📉 ZOOM OUT: from level ${currentLevel} to ${targetLevel}`);

          // Remove posts if going below level 4
          if (currentLevel >= 4 && targetLevel < 4) {
            const postNodes = allNodes.filter(node => node.type === 'post');
            console.log(`  🗑️ Removing ${postNodes.length} posts`);
            saveAndRemove(postNodes, savedPostNodesRef, savedPostEdgesRef);
          }

          // Remove L3 if going below level 3
          if (currentLevel >= 3 && targetLevel < 3) {
            const l3Nodes = allNodes.filter(node => node.type === 'category' && node.level === 2);
            console.log(`  🗑️ Removing ${l3Nodes.length} L3 nodes`);
            saveAndRemove(l3Nodes, savedL3NodesRef, savedL3EdgesRef);
          }

          // Remove L2 if going below level 2
          if (currentLevel >= 2 && targetLevel < 2) {
            const l2Nodes = allNodes.filter(node => node.type === 'category' && node.level === 1);
            console.log(`  🗑️ Removing ${l2Nodes.length} L2 nodes`);
            saveAndRemove(l2Nodes, savedL2NodesRef, savedL2EdgesRef);
          }
        }

        // 📈 ZOOM IN: Add lower levels
        if (targetLevel > currentLevel) {
          console.log(`📈 ZOOM IN: from level ${currentLevel} to ${targetLevel}`);

          // Add L2 if reaching level 2
          if (currentLevel < 2 && targetLevel >= 2) {
            console.log(`  📦 Restoring L2 nodes`);
            restore(savedL2NodesRef, savedL2EdgesRef);
          }

          // Add L3 if reaching level 3
          if (currentLevel < 3 && targetLevel >= 3) {
            console.log(`  📦 Restoring L3 nodes`);
            restore(savedL3NodesRef, savedL3EdgesRef);
          }

          // Add posts if reaching level 4
          if (currentLevel < 4 && targetLevel >= 4) {
            console.log(`  📦 Restoring posts`);
            restore(savedPostNodesRef, savedPostEdgesRef);
          }
        }
      }
    });

    // Clean up - no right-click handlers needed anymore
  }, [graphData, networkOptions, currentGraph, arrangeNodesInCircles]);

  // Log when useEffect runs to debug re-rendering issues
  console.log('🔄 useEffect [initializeNetwork] running. Trigger:', {
    graphDataNodes: graphData?.nodes?.length,
    currentGraph
  });

  // Click outside handler removed - no node menu needed

  // Handle graph type change
  const handleGraphTypeChange = (newType) => {
    setCurrentGraph(newType);

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
      className={`content-container ${!isFullscreen ? 'visualization-page' : ''}`}
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
      {/* Clean minimal view - no controls, just the graph */}
      <div className="visualization-container" style={{ position: 'relative', height: '100%' }}>

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