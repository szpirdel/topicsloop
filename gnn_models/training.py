import numpy as np
from typing import List, Dict, Tuple, Optional
import logging

# Conditional imports for PyTorch
try:
    import torch
    import torch.nn.functional as F
    from torch_geometric.loader import DataLoader
    from torch.optim import Adam
    from torch.optim.lr_scheduler import ReduceLROnPlateau
    from .models import PostGraphConv, CategoryGraphConv, UserInterestGNN, create_post_graph_data
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False
    # Create dummy classes when PyTorch is not available
    class DataLoader:
        def __init__(self, *args, **kwargs):
            pass

    class Adam:
        def __init__(self, *args, **kwargs):
            pass

    class ReduceLROnPlateau:
        def __init__(self, *args, **kwargs):
            pass

logger = logging.getLogger(__name__)


class GNNTrainer:
    """
    Training pipeline for Graph Neural Networks
    Handles data preparation, training loop, and model evaluation
    """

    def __init__(
        self,
        model_type: str = 'post',
        device: str = 'cpu',
        learning_rate: float = 0.001,
        weight_decay: float = 1e-4
    ):
        self.model_type = model_type
        self.device = device
        self.learning_rate = learning_rate
        self.weight_decay = weight_decay

        self.model = None
        self.optimizer = None
        self.scheduler = None

    def prepare_model(self, **model_kwargs):
        """Initialize the GNN model"""
        if self.model_type == 'post':
            self.model = PostGraphConv(**model_kwargs)
        elif self.model_type == 'category':
            self.model = CategoryGraphConv(**model_kwargs)
        elif self.model_type == 'user':
            self.model = UserInterestGNN(**model_kwargs)
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")

        self.model = self.model.to(self.device)

        # Setup optimizer and scheduler
        self.optimizer = Adam(
            self.model.parameters(),
            lr=self.learning_rate,
            weight_decay=self.weight_decay
        )
        self.scheduler = ReduceLROnPlateau(
            self.optimizer,
            mode='min',
            patience=10,
            factor=0.5
        )

    def contrastive_loss(
        self,
        embeddings: torch.Tensor,
        positive_pairs: torch.Tensor,
        negative_pairs: torch.Tensor,
        margin: float = 1.0
    ) -> torch.Tensor:
        """
        Contrastive loss for learning embeddings
        Brings similar nodes closer, pushes dissimilar nodes apart
        """
        # Positive pairs (should be similar)
        pos_distances = F.pairwise_distance(
            embeddings[positive_pairs[:, 0]],
            embeddings[positive_pairs[:, 1]]
        )

        # Negative pairs (should be dissimilar)
        neg_distances = F.pairwise_distance(
            embeddings[negative_pairs[:, 0]],
            embeddings[negative_pairs[:, 1]]
        )

        # Contrastive loss
        pos_loss = torch.mean(pos_distances ** 2)
        neg_loss = torch.mean(F.relu(margin - neg_distances) ** 2)

        return pos_loss + neg_loss

    def link_prediction_loss(
        self,
        embeddings: torch.Tensor,
        edge_index: torch.Tensor,
        negative_edges: torch.Tensor
    ) -> torch.Tensor:
        """
        Link prediction loss for unsupervised learning
        Predicts existence of edges in the graph
        """
        # Positive edges (existing links)
        pos_edge_embeddings = embeddings[edge_index]
        pos_scores = torch.sum(
            pos_edge_embeddings[0] * pos_edge_embeddings[1],
            dim=1
        )

        # Negative edges (non-existing links)
        neg_edge_embeddings = embeddings[negative_edges]
        neg_scores = torch.sum(
            neg_edge_embeddings[0] * neg_edge_embeddings[1],
            dim=1
        )

        # Binary cross-entropy loss
        pos_loss = F.binary_cross_entropy_with_logits(
            pos_scores,
            torch.ones_like(pos_scores)
        )
        neg_loss = F.binary_cross_entropy_with_logits(
            neg_scores,
            torch.zeros_like(neg_scores)
        )

        return pos_loss + neg_loss

    def train_epoch(
        self,
        data_loader: DataLoader,
        loss_fn: str = 'contrastive'
    ) -> float:
        """Train model for one epoch"""
        self.model.train()
        total_loss = 0
        num_batches = 0

        for batch in data_loader:
            batch = batch.to(self.device)

            self.optimizer.zero_grad()

            # Forward pass
            embeddings = self.model(batch.x, batch.edge_index, batch.batch)

            # Calculate loss based on chosen method
            if loss_fn == 'link_prediction':
                # Generate negative edges for link prediction
                num_nodes = batch.x.size(0)
                negative_edges = self.generate_negative_edges(
                    batch.edge_index,
                    num_nodes,
                    batch.edge_index.size(1)
                )
                loss = self.link_prediction_loss(embeddings, batch.edge_index, negative_edges)

            elif loss_fn == 'contrastive':
                # Generate positive and negative pairs
                positive_pairs, negative_pairs = self.generate_contrastive_pairs(
                    batch.edge_index,
                    batch.x.size(0)
                )
                loss = self.contrastive_loss(embeddings, positive_pairs, negative_pairs)

            else:
                raise ValueError(f"Unknown loss function: {loss_fn}")

            # Backward pass
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()
            num_batches += 1

        return total_loss / num_batches

    def generate_negative_edges(
        self,
        edge_index: torch.Tensor,
        num_nodes: int,
        num_neg_edges: int
    ) -> torch.Tensor:
        """Generate negative edges for link prediction"""
        # Create set of existing edges
        existing_edges = set()
        for i in range(edge_index.size(1)):
            edge = (edge_index[0, i].item(), edge_index[1, i].item())
            existing_edges.add(edge)
            existing_edges.add((edge[1], edge[0]))  # Undirected

        # Sample negative edges
        negative_edges = []
        while len(negative_edges) < num_neg_edges:
            src = torch.randint(0, num_nodes, (1,)).item()
            dst = torch.randint(0, num_nodes, (1,)).item()

            if src != dst and (src, dst) not in existing_edges:
                negative_edges.append([src, dst])

        return torch.LongTensor(negative_edges).t().to(self.device)

    def generate_contrastive_pairs(
        self,
        edge_index: torch.Tensor,
        num_nodes: int
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """Generate positive and negative pairs for contrastive learning"""
        # Positive pairs from existing edges
        positive_pairs = edge_index.t()

        # Negative pairs (random sampling)
        num_neg_pairs = positive_pairs.size(0)
        negative_pairs = []

        existing_edges = set()
        for i in range(edge_index.size(1)):
            edge = (edge_index[0, i].item(), edge_index[1, i].item())
            existing_edges.add(edge)

        while len(negative_pairs) < num_neg_pairs:
            src = torch.randint(0, num_nodes, (1,)).item()
            dst = torch.randint(0, num_nodes, (1,)).item()

            if src != dst and (src, dst) not in existing_edges:
                negative_pairs.append([src, dst])

        negative_pairs = torch.LongTensor(negative_pairs).to(self.device)

        return positive_pairs, negative_pairs

    def evaluate(self, data_loader: DataLoader) -> Dict[str, float]:
        """Evaluate model performance"""
        self.model.eval()
        total_loss = 0
        num_batches = 0

        with torch.no_grad():
            for batch in data_loader:
                batch = batch.to(self.device)

                embeddings = self.model(batch.x, batch.edge_index, batch.batch)

                # Simple reconstruction loss for evaluation
                if batch.edge_index.size(1) > 0:
                    edge_embeddings = embeddings[batch.edge_index]
                    reconstruction_loss = F.mse_loss(
                        torch.sum(edge_embeddings[0] * edge_embeddings[1], dim=1),
                        torch.ones(batch.edge_index.size(1)).to(self.device)
                    )
                    total_loss += reconstruction_loss.item()
                    num_batches += 1

        metrics = {
            'avg_loss': total_loss / max(num_batches, 1),
            'num_batches': num_batches
        }

        return metrics

    def train(
        self,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        num_epochs: int = 100,
        patience: int = 20,
        save_path: Optional[str] = None
    ) -> Dict[str, List[float]]:
        """
        Full training loop with early stopping

        Args:
            train_loader: Training data loader
            val_loader: Validation data loader (optional)
            num_epochs: Maximum number of epochs
            patience: Early stopping patience
            save_path: Path to save best model

        Returns:
            Training history
        """
        history = {
            'train_loss': [],
            'val_loss': []
        }

        best_val_loss = float('inf')
        patience_counter = 0

        logger.info(f"Starting training for {num_epochs} epochs")

        for epoch in range(num_epochs):
            # Training
            train_loss = self.train_epoch(train_loader)
            history['train_loss'].append(train_loss)

            # Validation
            val_loss = 0.0
            if val_loader is not None:
                val_metrics = self.evaluate(val_loader)
                val_loss = val_metrics['avg_loss']
                history['val_loss'].append(val_loss)

                # Learning rate scheduling
                self.scheduler.step(val_loss)

                # Early stopping
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    patience_counter = 0

                    # Save best model
                    if save_path:
                        torch.save(self.model.state_dict(), save_path)
                        logger.info(f"Saved best model to {save_path}")
                else:
                    patience_counter += 1

                if patience_counter >= patience:
                    logger.info(f"Early stopping at epoch {epoch}")
                    break

            # Logging
            if epoch % 10 == 0:
                logger.info(
                    f"Epoch {epoch}: train_loss={train_loss:.4f}, "
                    f"val_loss={val_loss:.4f}, lr={self.optimizer.param_groups[0]['lr']:.6f}"
                )

        logger.info("Training completed")
        return history


def prepare_training_data_from_django():
    """
    Prepare training data from Django models
    Converts database posts and similarities to PyTorch Geometric format
    """
    try:
        from blog.models import Post, Category
        from ai_models.models import PostSimilarity
    except ImportError:
        logger.error("Cannot import Django models. Make sure Django is set up correctly.")
        return None, None

    # Get all posts with their features
    posts = Post.objects.all().prefetch_related('primary_category', 'additional_categories', 'tags')

    posts_data = []
    post_id_to_idx = {}

    for idx, post in enumerate(posts):
        post_id_to_idx[post.id] = idx

        post_data = {
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'category_id': post.primary_category.id if post.primary_category else 0,
            'tags': [tag.name for tag in post.tags.all()],
            # Add embedding if available
            # 'embedding': post.embeddings.first().embedding_vector if post.embeddings.exists() else None
        }
        posts_data.append(post_data)

    # Get similarities
    similarities = PostSimilarity.objects.filter(
        similarity_score__gte=0.3  # Only include meaningful similarities
    ).select_related('post1', 'post2')

    similarity_tuples = []
    for sim in similarities:
        if sim.post1.id in post_id_to_idx and sim.post2.id in post_id_to_idx:
            idx1 = post_id_to_idx[sim.post1.id]
            idx2 = post_id_to_idx[sim.post2.id]
            similarity_tuples.append((idx1, idx2, sim.similarity_score))

    logger.info(f"Prepared {len(posts_data)} posts and {len(similarity_tuples)} similarities")

    return posts_data, similarity_tuples