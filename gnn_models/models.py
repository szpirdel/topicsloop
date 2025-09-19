import numpy as np
from typing import List, Tuple, Optional, Dict, Any

# Conditional imports for PyTorch and PyTorch Geometric
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torch_geometric.nn import GCNConv, GATConv, SAGEConv, global_mean_pool
    from torch_geometric.data import Data, Batch
    PYTORCH_AVAILABLE = True
except ImportError:
    # Create dummy classes when PyTorch is not available
    PYTORCH_AVAILABLE = False

    class nn:
        class Module:
            pass
        class Linear:
            def __init__(self, *args, **kwargs):
                pass
        class ModuleList:
            def __init__(self, *args, **kwargs):
                pass
        class BatchNorm1d:
            def __init__(self, *args, **kwargs):
                pass
        class LayerNorm:
            def __init__(self, *args, **kwargs):
                pass
        class Dropout:
            def __init__(self, *args, **kwargs):
                pass

    class torch:
        class Tensor:
            pass
        @staticmethod
        def FloatTensor(*args, **kwargs):
            return None
        @staticmethod
        def LongTensor(*args, **kwargs):
            return None
        @staticmethod
        def cat(*args, **kwargs):
            return None
        @staticmethod
        def save(*args, **kwargs):
            pass
        @staticmethod
        def empty(*args, **kwargs):
            return None

    # Dummy classes for PyTorch Geometric
    class GCNConv:
        def __init__(self, *args, **kwargs):
            pass

    class GATConv:
        def __init__(self, *args, **kwargs):
            pass

    class SAGEConv:
        def __init__(self, *args, **kwargs):
            pass

    class Data:
        def __init__(self, *args, **kwargs):
            pass

    class F:
        @staticmethod
        def relu(*args, **kwargs):
            return None
        @staticmethod
        def pairwise_distance(*args, **kwargs):
            return None
        @staticmethod
        def binary_cross_entropy_with_logits(*args, **kwargs):
            return None
        @staticmethod
        def mse_loss(*args, **kwargs):
            return None


class PostGraphConv(nn.Module):
    """
    Graph Convolutional Network for post embeddings
    Learns representations based on post relationships (categories, tags, similarities)
    """

    def __init__(
        self,
        input_dim: int = 768,  # Input feature dimension (e.g., from text embeddings)
        hidden_dim: int = 256,
        output_dim: int = 128,
        num_layers: int = 3,
        dropout: float = 0.1,
        conv_type: str = 'GCN'
    ):
        super().__init__()

        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim
        self.num_layers = num_layers
        self.dropout = dropout

        # Input projection
        self.input_proj = nn.Linear(input_dim, hidden_dim)

        # Graph convolution layers
        self.convs = nn.ModuleList()
        self.norms = nn.ModuleList()

        for i in range(num_layers):
            in_channels = hidden_dim
            out_channels = hidden_dim if i < num_layers - 1 else output_dim

            if conv_type == 'GCN':
                conv = GCNConv(in_channels, out_channels)
            elif conv_type == 'GAT':
                conv = GATConv(in_channels, out_channels, heads=4, concat=False)
            elif conv_type == 'SAGE':
                conv = SAGEConv(in_channels, out_channels)
            else:
                raise ValueError(f"Unknown conv_type: {conv_type}")

            self.convs.append(conv)

            # Batch normalization (except for last layer)
            if i < num_layers - 1:
                self.norms.append(nn.BatchNorm1d(out_channels))

        self.dropout_layer = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, batch: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Forward pass through the GNN

        Args:
            x: Node features [num_nodes, input_dim]
            edge_index: Graph connectivity [2, num_edges]
            batch: Batch vector for batched graphs [num_nodes]

        Returns:
            Node embeddings [num_nodes, output_dim]
        """
        # Input projection
        x = self.input_proj(x)
        x = F.relu(x)
        x = self.dropout_layer(x)

        # Graph convolution layers
        for i, conv in enumerate(self.convs):
            x = conv(x, edge_index)

            # Apply normalization and activation (except last layer)
            if i < len(self.convs) - 1:
                x = self.norms[i](x)
                x = F.relu(x)
                x = self.dropout_layer(x)

        return x


class CategoryGraphConv(nn.Module):
    """
    Specialized GNN for category relationships
    Models how categories relate through shared posts and semantic similarity
    """

    def __init__(
        self,
        input_dim: int = 512,
        hidden_dim: int = 128,
        output_dim: int = 64,
        num_heads: int = 4
    ):
        super().__init__()

        self.input_proj = nn.Linear(input_dim, hidden_dim)

        # Multi-head attention for category relationships
        self.attention = GATConv(
            hidden_dim,
            output_dim,
            heads=num_heads,
            concat=False,
            dropout=0.1
        )

        self.norm = nn.LayerNorm(output_dim)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """
        Forward pass for category embedding

        Args:
            x: Category features [num_categories, input_dim]
            edge_index: Category relationships [2, num_edges]

        Returns:
            Category embeddings [num_categories, output_dim]
        """
        x = self.input_proj(x)
        x = F.relu(x)

        x = self.attention(x, edge_index)
        x = self.norm(x)

        return x


class UserInterestGNN(nn.Module):
    """
    GNN for modeling user interests based on interaction graphs
    Learns user embeddings from post interactions, category preferences, etc.
    """

    def __init__(
        self,
        post_dim: int = 128,
        category_dim: int = 64,
        hidden_dim: int = 256,
        output_dim: int = 128,
        num_layers: int = 2
    ):
        super().__init__()

        # Project different node types to same dimension
        self.post_proj = nn.Linear(post_dim, hidden_dim)
        self.category_proj = nn.Linear(category_dim, hidden_dim)
        self.user_proj = nn.Linear(hidden_dim, hidden_dim)  # Users start with learned features

        # Graph convolutions
        self.convs = nn.ModuleList()
        for i in range(num_layers):
            out_dim = hidden_dim if i < num_layers - 1 else output_dim
            self.convs.append(SAGEConv(hidden_dim, out_dim))

        self.dropout = nn.Dropout(0.1)

    def forward(
        self,
        post_features: torch.Tensor,
        category_features: torch.Tensor,
        user_features: torch.Tensor,
        edge_index: torch.Tensor,
        node_types: torch.Tensor
    ) -> Dict[str, torch.Tensor]:
        """
        Forward pass for heterogeneous user-post-category graph

        Args:
            post_features: Post node features [num_posts, post_dim]
            category_features: Category node features [num_categories, category_dim]
            user_features: User node features [num_users, hidden_dim]
            edge_index: Graph connectivity [2, num_edges]
            node_types: Node type indicators [num_nodes] (0=user, 1=post, 2=category)

        Returns:
            Dictionary with embeddings for each node type
        """
        # Project all node types to same dimension
        num_users = user_features.size(0)
        num_posts = post_features.size(0)
        num_categories = category_features.size(0)

        user_x = self.user_proj(user_features)
        post_x = self.post_proj(post_features)
        category_x = self.category_proj(category_features)

        # Concatenate all node features
        x = torch.cat([user_x, post_x, category_x], dim=0)

        # Apply graph convolutions
        for i, conv in enumerate(self.convs):
            x = conv(x, edge_index)
            if i < len(self.convs) - 1:
                x = F.relu(x)
                x = self.dropout(x)

        # Split back to node types
        user_embeddings = x[:num_users]
        post_embeddings = x[num_users:num_users + num_posts]
        category_embeddings = x[num_users + num_posts:]

        return {
            'users': user_embeddings,
            'posts': post_embeddings,
            'categories': category_embeddings
        }


class GraphEmbeddingGenerator:
    """
    Utility class for generating embeddings using trained GNN models
    Integrates with Django models and provides easy-to-use interface
    """

    def __init__(self, device: str = 'cpu'):
        self.device = device
        self.post_model = None
        self.category_model = None
        self.user_model = None

    def load_models(self, model_paths: Dict[str, str]):
        """Load trained GNN models from file paths"""
        if 'post' in model_paths:
            self.post_model = PostGraphConv()
            self.post_model.load_state_dict(torch.load(model_paths['post'], map_location=self.device))
            self.post_model.eval()

        if 'category' in model_paths:
            self.category_model = CategoryGraphConv()
            self.category_model.load_state_dict(torch.load(model_paths['category'], map_location=self.device))
            self.category_model.eval()

        if 'user' in model_paths:
            self.user_model = UserInterestGNN()
            self.user_model.load_state_dict(torch.load(model_paths['user'], map_location=self.device))
            self.user_model.eval()

    def generate_post_embeddings(
        self,
        post_features: np.ndarray,
        edge_index: np.ndarray
    ) -> np.ndarray:
        """
        Generate embeddings for posts using trained GNN

        Args:
            post_features: Initial post features [num_posts, feature_dim]
            edge_index: Graph connectivity [2, num_edges]

        Returns:
            Post embeddings [num_posts, embedding_dim]
        """
        if self.post_model is None:
            raise ValueError("Post model not loaded")

        # Convert to tensors
        x = torch.FloatTensor(post_features).to(self.device)
        edge_index = torch.LongTensor(edge_index).to(self.device)

        with torch.no_grad():
            embeddings = self.post_model(x, edge_index)

        return embeddings.cpu().numpy()

    def generate_category_embeddings(
        self,
        category_features: np.ndarray,
        edge_index: np.ndarray
    ) -> np.ndarray:
        """Generate embeddings for categories"""
        if self.category_model is None:
            raise ValueError("Category model not loaded")

        x = torch.FloatTensor(category_features).to(self.device)
        edge_index = torch.LongTensor(edge_index).to(self.device)

        with torch.no_grad():
            embeddings = self.category_model(x, edge_index)

        return embeddings.cpu().numpy()

    def calculate_gnn_similarity(
        self,
        embeddings1: np.ndarray,
        embeddings2: np.ndarray,
        method: str = 'cosine'
    ) -> float:
        """
        Calculate similarity between GNN-generated embeddings

        Args:
            embeddings1: First embedding vector
            embeddings2: Second embedding vector
            method: Similarity method ('cosine', 'euclidean', 'dot')

        Returns:
            Similarity score
        """
        if method == 'cosine':
            # Cosine similarity
            dot_product = np.dot(embeddings1, embeddings2)
            norm1 = np.linalg.norm(embeddings1)
            norm2 = np.linalg.norm(embeddings2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            return float(dot_product / (norm1 * norm2))

        elif method == 'euclidean':
            # Euclidean distance (converted to similarity)
            distance = np.linalg.norm(embeddings1 - embeddings2)
            return float(1.0 / (1.0 + distance))

        elif method == 'dot':
            # Dot product similarity
            return float(np.dot(embeddings1, embeddings2))

        else:
            raise ValueError(f"Unknown similarity method: {method}")


def create_post_graph_data(posts_data: List[Dict], similarities: List[Tuple]) -> Data:
    """
    Create PyTorch Geometric Data object from posts and similarities

    Args:
        posts_data: List of post dictionaries with features
        similarities: List of (post1_idx, post2_idx, similarity_score) tuples

    Returns:
        PyTorch Geometric Data object
    """
    # Extract features
    features = []
    for post in posts_data:
        # Combine different post features
        feature_vector = []

        # Basic features
        feature_vector.extend([
            len(post.get('title', '')),
            len(post.get('content', '')),
            len(post.get('tags', [])),
            post.get('category_id', 0)
        ])

        # Add embedding if available
        if 'embedding' in post:
            feature_vector.extend(post['embedding'])
        else:
            # Placeholder embedding
            feature_vector.extend([0.0] * 768)

        features.append(feature_vector)

    # Create node features tensor
    x = torch.FloatTensor(features)

    # Create edge index from similarities
    edge_indices = []
    edge_weights = []

    for post1_idx, post2_idx, score in similarities:
        if score > 0.1:  # Only include significant similarities
            edge_indices.append([post1_idx, post2_idx])
            edge_indices.append([post2_idx, post1_idx])  # Undirected
            edge_weights.extend([score, score])

    if edge_indices:
        edge_index = torch.LongTensor(edge_indices).t()
        edge_attr = torch.FloatTensor(edge_weights)
    else:
        edge_index = torch.empty((2, 0), dtype=torch.long)
        edge_attr = torch.empty((0,), dtype=torch.float)

    return Data(x=x, edge_index=edge_index, edge_attr=edge_attr)