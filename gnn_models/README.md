# GNN Models - Graph Neural Networks for TopicsLoop

**Status:** 🟡 **Code Ready, Model Not Trained**
**Last Updated:** 2025-11-17

---

## 📊 Current Status

### ✅ What We Have

**1. GNN Architecture (463 lines)**
- `PostGraphConv` - GNN for learning post embeddings from graph structure
- `CategoryGraphConv` - GNN for category relationships
- `UserInterestGNN` - GNN for user interest modeling
- Supports: GCN, GAT, GraphSAGE layers

**2. Training Pipeline (395 lines)**
- Complete training loop with validation
- Checkpoint saving/loading
- Hyperparameter configuration
- Performance metrics logging

**3. Integration Layer (731 lines)**
- Seamless integration with Django models
- Automatic fallback to sentence-transformers when GNN unavailable
- API support via `?method=gnn` parameter

**4. Embeddings Manager (333 lines)**
- Sentence-transformers integration (`all-MiniLM-L6-v2`)
- Caching layer (Django cache, 1 hour TTL)
- Batch processing support

---

### ❌ What We DON'T Have

**Missing:**
- ❌ **Trained GNN model checkpoint** (no `.pth` file)
- ❌ **Training data** (need 200+ posts with relationships)
- ❌ **Evaluation benchmarks** (comparing GNN vs. sentence-transformers)

**Why Not Trained Yet:**
- Original implementation was prepared for future use
- Not enough quality data to train (had only ~100 sample posts)
- Sentence-transformers working well enough for MVP
- Training requires 1-2 hours + hyperparameter tuning

---

## 🔄 Current Behavior

### What Happens When You Use GNN Endpoints?

```bash
# User requests GNN similarity
GET /api/posts/42/similar/?method=gnn&threshold=0.7
```

**Backend Flow:**
```
1. API receives request with method=gnn
   ↓
2. gnn_manager.calculate_post_similarity_gnn(...)
   ↓
3. Check: Is GNN model trained?
   ❌ No trained model found!
   ↓
4. FALLBACK to sentence-transformers
   ↓
5. Calculate cosine similarity using embeddings
   ↓
6. Return similar posts (using sentence-transformers, NOT GNN!)
```

**Response includes:**
```json
{
  "similar_posts": [...],
  "method_used": "semantic_embeddings",  // ← Fallback was used!
  "search_params": {
    "method": "gnn"  // ← User requested GNN...
  }
}
```

**So:** Even if you pass `?method=gnn`, it **still uses sentence-transformers** because no trained GNN model exists!

---

## 🎯 Why Use GNN? (Future Enhancement)

### Sentence-Transformers (Current - Text Only)

```
Post A: "Neural Networks Introduction"
  → Embedding based on: TEXT ONLY
  → [0.5, 0.3, 0.8, ...] (384 dims)

Post B: "Deep Learning Basics"
  → Embedding based on: TEXT ONLY
  → [0.6, 0.2, 0.9, ...] (384 dims)

Similarity = cosine(A, B) = 0.87
```

**What it considers:** Title, content, tags (text features)
**What it IGNORES:** Categories, connections, user engagement, author expertise

---

### GNN (Future - Graph-Aware)

```
Post A: "Neural Networks Introduction"
  + Text: "neural networks intro..."
  + Category: Computer Science > AI > Machine Learning
  + Connected to: Post C (CNNs), Post D (Backprop)
  + User engagement: 10 likes, 3 comments
  + Author: john_doe (ML expert, 50 posts in ML)

  → Graph embedding: [0.52, 0.31, 0.83, ...] (128 dims)
     ^ Considers text + graph structure!

Post B: "Deep Learning Basics"
  + Text: "deep learning basics..."
  + Category: Computer Science > AI > Machine Learning  # ← SAME!
  + Connected to: Post A, Post E (Transfer Learning)
  + User engagement: 15 likes, 8 comments
  + Author: jane_smith (ML expert, 80 posts in ML)

  → Graph embedding: [0.54, 0.29, 0.85, ...] (128 dims)

GNN Similarity = 0.92  # ← Higher! Graph structure helped!
```

**What GNN considers:**
- ✅ Text (like sentence-transformers)
- ✅ Category hierarchy (both in same category path)
- ✅ Post-post connections (already linked as similar)
- ✅ User interactions (both have high engagement)
- ✅ Author expertise (both authors are ML experts)

**Expected Improvement:** +5-15% similarity quality (fewer false positives, better ranking)

---

## 🚀 How to Activate GNN (Future)

### Prerequisites

1. **Data:** 200+ posts with:
   - Rich category assignments (primary + additional)
   - Existing similarity connections
   - User engagement data (likes, comments, views)

2. **Compute:** GPU recommended (training ~1-2 hours on CPU, ~15 min on GPU)

### Training Steps

```bash
# 1. Prepare training data
python manage.py prepare_gnn_data --min-posts 200

# 2. Train GNN models
python manage.py train_gnn_models \
  --model post \
  --epochs 100 \
  --batch-size 32 \
  --learning-rate 0.001

# 3. Evaluate performance
python manage.py evaluate_gnn --compare-baseline

# 4. If better than baseline → Deploy!
# Model auto-activates when checkpoint exists
```

### Expected Timeline

| Phase | Time | Status |
|-------|------|--------|
| Import 200+ articles | 2-4 hours | 🟡 In progress |
| Generate embeddings | 10-30 min | ⏸️ Waiting |
| Prepare GNN training data | 30 min | ⏸️ Waiting |
| Train GNN model | 1-2 hours | ⏸️ Waiting |
| Evaluate & compare | 30 min | ⏸️ Waiting |
| **Total** | **~5-8 hours** | ⏸️ Post-MVP |

---

## 🏗️ Architecture Overview

### Model Architectures

**1. PostGraphConv**
```python
Input: Post text embedding (384 dims from sentence-transformers)
Layers:
  - GCN/GAT Layer 1: 384 → 256 dims
  - GCN/GAT Layer 2: 256 → 128 dims
  - GCN/GAT Layer 3: 128 → 128 dims
Output: Graph-aware post embedding (128 dims)

Graph Edges:
  - Post ↔ Category (belongs to)
  - Post ↔ Post (similar content)
  - Post ↔ User (authored by)
  - Post ↔ Tag (tagged with)
```

**2. CategoryGraphConv**
```python
Input: Category name embedding
Layers: Similar to PostGraphConv
Output: Graph-aware category embedding

Graph Edges:
  - Category ↔ Category (parent-child hierarchy)
  - Category ↔ Post (contains)
```

**3. UserInterestGNN**
```python
Input: User favorite categories + interaction history
Layers: Similar architecture
Output: User interest embedding

Graph Edges:
  - User ↔ Category (follows)
  - User ↔ Post (liked, commented, viewed)
```

---

## 🔬 Training Strategy

### Task: Link Prediction

**Goal:** Predict if two posts should be connected (similar)

**Training Data:**
```
Positive examples: Existing similarity edges (cosine > 0.7)
Negative examples: Random pairs of unrelated posts

Loss: Binary cross-entropy
Optimizer: Adam
Learning rate: 0.001
Batch size: 32
Epochs: 100-200
```

**Validation:**
```
Metrics:
  - Precision@10 (of top 10 similar posts, how many are relevant?)
  - Recall@10 (of all relevant posts, how many in top 10?)
  - Mean Average Precision (MAP)
  - Compare vs. sentence-transformers baseline
```

---

## 📈 Success Criteria

### When to Deploy GNN?

**Metrics to beat sentence-transformers baseline:**

| Metric | Baseline (S-T) | Target (GNN) | Status |
|--------|----------------|--------------|--------|
| Precision@10 | ~0.75 | > 0.80 | ⏸️ Not measured |
| Recall@10 | ~0.60 | > 0.70 | ⏸️ Not measured |
| MAP | ~0.65 | > 0.75 | ⏸️ Not measured |
| User preference | N/A | > 60% prefer GNN | ⏸️ A/B test needed |

**Decision Rule:**
- If GNN improves metrics by **< 5%** → Stay with sentence-transformers (simpler!)
- If GNN improves metrics by **5-10%** → Consider deployment (cost vs. benefit)
- If GNN improves metrics by **> 10%** → Deploy GNN! (worth the complexity)

---

## 🛠️ Development Roadmap

### Phase 1: Data Collection (Current)
- [x] Implement sentence-transformers embeddings
- [x] Build auto-categorization
- [ ] **Import 200+ real articles** ⬅️ **IN PROGRESS**
- [ ] Generate embeddings for all posts
- [ ] Build similarity graph (cosine > 0.7)

### Phase 2: GNN Training (Post-MVP)
- [ ] Prepare training dataset
- [ ] Train PostGraphConv model
- [ ] Evaluate vs. baseline
- [ ] Hyperparameter tuning
- [ ] Save best checkpoint

### Phase 3: Integration (Future)
- [ ] A/B test: GNN vs. sentence-transformers
- [ ] Measure user preference
- [ ] Deploy if significant improvement
- [ ] Monitor performance in production

### Phase 4: Enhancement (Long-term)
- [ ] Multi-modal GNN (text + images)
- [ ] Temporal GNN (time-aware recommendations)
- [ ] User-personalized GNN
- [ ] Explainable GNN (attention weights → why similar?)

---

## 🐛 Known Issues & Limitations

### Current Limitations

**1. No Trained Model**
- GNN code exists but never trained
- All requests fall back to sentence-transformers
- Users don't know GNN isn't active (API says `gnn_enabled: true`)

**2. Training Data Requirements**
- Need 200+ posts minimum (currently have ~100)
- Need diverse category distribution
- Need quality ground truth (verified similarities)

**3. Computational Cost**
- GNN inference slower than sentence-transformers (~5x)
- Need to cache GNN embeddings (like we do for S-T)
- Training requires GPU for reasonable speed

### Future Challenges

**1. Cold Start Problem**
- New posts have no connections → GNN can't help
- Solution: Use sentence-transformers for new posts, switch to GNN after connections build

**2. Graph Size Scalability**
- 10,000+ posts → large graph → slow inference
- Solution: Use mini-batch sampling, not full graph

**3. Explainability**
- GNN is "black box" - hard to explain WHY similar
- Solution: Use attention weights, GNNExplainer library

---

## 📚 References

**Code Locations:**
- GNN Models: [gnn_models/models.py](models.py)
- Training: [gnn_models/training.py](training.py)
- Integration: [gnn_models/integration.py](integration.py)
- Embeddings: [gnn_models/embeddings.py](embeddings.py)

**Documentation:**
- AI Architecture: [docs/AI_ARCHITECTURE.md](../docs/AI_ARCHITECTURE.md)
- Project Backlog (Section 4.5): [project_backlog.md](../project_backlog.md)

**External Resources:**
- [PyTorch Geometric Docs](https://pytorch-geometric.readthedocs.io/)
- [GNN Tutorial](https://distill.pub/2021/gnn-intro/)
- [Link Prediction with GNN](https://pytorch-geometric.readthedocs.io/en/latest/notes/colabs.html)

---

## 🎯 Quick FAQ

### Q: Is GNN running now?
**A:** No. Code exists, but no trained model. Using sentence-transformers fallback.

### Q: When will GNN be ready?
**A:** After importing 200+ articles, training (~5-8 hours work), and evaluation.

### Q: Can I use GNN endpoints?
**A:** Yes! `?method=gnn` works, but falls back to sentence-transformers.

### Q: Why keep GNN code if not using?
**A:** Future enhancement. Code is ready, just need to train. Easy to activate later.

### Q: How much better will GNN be?
**A:** Expected +5-15% similarity quality. Need to measure after training.

### Q: Should I delete GNN code?
**A:** No! It's 463 lines of good architecture. Keep for future use.

---

**Document Status:** ✅ Complete
**Maintained By:** Development Team
**Next Review:** After 200 articles imported

**Questions?** Check [docs/AI_ARCHITECTURE.md](../docs/AI_ARCHITECTURE.md) or [project_backlog.md](../project_backlog.md) Section 4.5.
