# 🧠 TopicsLoop - AI-Powered Knowledge Discovery Platform

**Modern social knowledge sharing platform with advanced AI-powered semantic analysis and intelligent content discovery.**

![TopicsLoop](https://img.shields.io/badge/TopicsLoop-AI%20Platform-blue)
![Django](https://img.shields.io/badge/Django-4.2+-green)
![React](https://img.shields.io/badge/React-19-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Overview

TopicsLoop combines traditional social content sharing with cutting-edge AI technologies to create an intelligent knowledge discovery platform. Users can share content, discover connections between topics, and leverage AI-powered recommendations for enhanced learning experiences.

### ✨ Key Features

#### 🤖 **AI-Powered Intelligence**
- **Semantic Content Analysis** - Sentence-transformers for deep content understanding
- **Auto-Categorization** - Intelligent category suggestions based on content analysis
- **Similar Content Discovery** - Find related posts using semantic similarity
- **Personalized Recommendations** - AI-driven content suggestions

#### 🕸️ **Advanced Visualizations**
- **Interactive Knowledge Graphs** - Vis.js powered network visualizations
- **Category Relationship Networks** - See how topics connect
- **User Interest Networks** - Visualize community connections
- **AI Semantic Networks** - Real-time semantic relationship mapping

#### 👥 **Social Features**
- **User Profiles** with favorite categories and personalized preferences
- **Multi-Category Posts** - Primary and additional category assignments
- **Tag System** - Flexible content organization
- **Personalized Content Filtering** - View posts from selected interest categories

#### 🎨 **Professional Interface**
- **Modern React UI** - Clean, responsive design optimized for all devices
- **Professional Navigation** - Intuitive user experience
- **Real-time Updates** - Seamless state management with React Context
- **Interactive Components** - Expandable posts, filtered views, smooth animations

## 🏗️ Architecture

### Backend (Django + AI)
```
topicsloop/
├── 🔐 accounts/           # User authentication & profiles
├── 📡 api/               # REST API endpoints
├── 📝 blog/              # Content management (posts, categories, tags)
├── 🤖 ai_models/         # AI embeddings and similarity models
├── 🧠 gnn_models/        # Graph Neural Networks & semantic analysis
│   ├── embeddings.py     # Sentence-transformers integration
│   ├── integration.py    # AI model integration layer
│   ├── auto_categorization.py # Smart categorization engine
│   └── management/commands/ # AI data generation tools
└── ⚙️ topicsloop/        # Django settings & configuration
```

### Frontend (React)
```
frontend/
├── 🎨 src/
│   ├── components/       # React components (Login, PostList, Visualization, etc.)
│   ├── contexts/         # Global state management (AuthContext)
│   ├── services/         # API integration layer
│   └── App.css          # Professional styling system
└── 📦 public/           # Static assets
```

## 🛠️ Tech Stack

### 🧠 AI & Machine Learning
- **PyTorch 2.0+** - Deep learning framework
- **PyTorch Geometric** - Graph neural networks
- **Sentence-Transformers** - Semantic text analysis (all-MiniLM-L6-v2)
- **Transformers** - Hugging Face model integration
- **NumPy** - Numerical computing

### ⚡ Backend
- **Django 4.2+** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL 17** - Primary database
- **JWT Authentication** - Secure token-based auth
- **Djoser** - Authentication endpoints
- **CORS Headers** - Cross-origin support

### 🎨 Frontend
- **React 19** - Modern UI framework
- **React Router DOM 7.1.5** - Client-side routing
- **Axios 1.7.9** - HTTP client with interceptors
- **Vis.js** - Interactive network visualizations
- **Context API** - Global state management

### 🐳 Infrastructure
- **Docker & Docker Compose** - Containerization
- **PostgreSQL** - Persistent data storage
- **Node.js** - Frontend build environment

## 🚦 Quick Start

### Prerequisites
- **Docker & Docker Compose** (required)
- **Git** for version control

### 🔧 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd topicsloop
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Platform**
   ```bash
   docker-compose up --build
   ```

4. **Initialize AI Models** (First run only)
   ```bash
   docker-compose exec web python manage.py migrate
   docker-compose exec web python manage.py generate_sample_posts
   docker-compose exec web python manage.py generate_embeddings
   ```

### 🌐 Access Points
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/
- **Database**: PostgreSQL on localhost:5432

## 🎯 Core Functionality

### 🤖 **AI-Powered Features**

#### Semantic Content Analysis
- Real-time content embedding using sentence-transformers
- Cosine similarity calculations for content relationships
- Automatic category suggestions based on content analysis

#### Smart Categorization
```python
# Auto-categorization API endpoint
POST /api/ai/auto-categorize/
{
  "title": "Machine Learning Basics",
  "content": "Introduction to neural networks..."
}
# Returns: Suggested categories with confidence scores
```

#### Similarity Discovery
```python
# Find similar posts
GET /api/posts/{post_id}/similar/
# Returns: Semantically similar posts with similarity scores
```

### 📊 **Visualization Networks**

#### Category Networks
- **Standard Network**: Category connections based on shared posts
- **AI Semantic Network**: AI-powered semantic relationships between categories
- **User Networks**: Community connections based on shared interests

#### Interactive Features
- **Zoom & Pan** - Navigate large networks easily
- **Node Details** - Click nodes for detailed information
- **Real-time Stats** - Live network statistics and metrics

### 👤 **Personalized Experience**

#### Smart Content Filtering
- **Interest-Based Filtering** - See posts from selected favorite categories
- **Manual Category Selection** - Choose specific categories to view
- **"Show All" Mode** - Toggle between personalized and global content
- **Real-time Updates** - Instant filtering without page reloads

#### User Profiles
- **Favorite Categories** - Set and manage topic interests
- **Activity Statistics** - View engagement metrics
- **Personalized Recommendations** - AI-suggested content based on preferences

## 📡 API Documentation

### Authentication Endpoints
```
POST /api/token/          # Login
POST /auth/users/         # Register
POST /api/token/refresh/  # Refresh token
```

### Content Management
```
GET  /api/posts/              # List posts (with filtering)
POST /api/posts/              # Create post
GET  /api/posts/{id}/         # Get post details
PUT  /api/posts/{id}/         # Update post
DELETE /api/posts/{id}/       # Delete post
```

### AI-Enhanced Endpoints
```
GET  /api/posts/{id}/similar/           # Similar posts
POST /api/ai/auto-categorize/           # Auto-categorization
GET  /api/ai/embeddings/                # Generate embeddings
GET  /api/recommendations/              # Personalized recommendations
```

### Visualization Data
```
GET /api/viz/category-network/          # Category network data
GET /api/viz/semantic-category-network/ # AI semantic network
GET /api/viz/user-network/              # User connection network
```

## 🔮 AI Model Details

### Embedding Model
- **Model**: `all-MiniLM-L6-v2` (384-dimensional embeddings)
- **Performance**: Optimized for semantic similarity tasks
- **Languages**: Multi-language support
- **Speed**: Real-time inference on CPU

### Similarity Algorithms
- **Cosine Similarity** for content relationships
- **Threshold-based filtering** (configurable similarity thresholds)
- **Batch processing** for efficient large-scale analysis

### Auto-Categorization Engine
- **Content Analysis** - Title + content semantic analysis
- **Category Matching** - Similarity with existing category embeddings
- **Confidence Scoring** - Multi-factor confidence calculation
- **Batch Processing** - Bulk categorization capabilities

## 🎨 UI/UX Highlights

### Professional Design System
- **Consistent Color Palette** - Modern blue/gray theme
- **Typography** - System fonts optimized for readability
- **Responsive Grid** - Mobile-first design approach
- **Interactive Components** - Smooth animations and transitions

### User Experience Features
- **Expandable Posts** - Click to read full content
- **Real-time Filtering** - Instant content updates
- **Professional Navigation** - Context-aware menu system
- **Loading States** - Smooth loading indicators
- **Error Handling** - User-friendly error messages

## 🚀 Development

### Adding New AI Models
1. Extend `gnn_models/embeddings.py`
2. Update model configurations
3. Run migrations and generate embeddings

### Frontend Development
```bash
cd frontend
npm install
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

### Backend Development
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
python manage.py test
```

## 📈 Performance Optimization

### AI Model Optimization
- **Caching Strategy** - Embeddings cached in database
- **Batch Processing** - Efficient bulk operations
- **Lazy Loading** - On-demand model initialization

### Frontend Performance
- **Code Splitting** - Optimized bundle sizes
- **Memoization** - React.memo and useMemo optimization
- **Efficient State Management** - Context API with selective updates

### Database Optimization
- **Indexing** - Optimized queries for embeddings
- **Prefetch Relations** - Reduced N+1 queries
- **Connection Pooling** - Efficient database connections

## 🛡️ Security

- **JWT Authentication** with secure refresh token rotation
- **CORS Configuration** for secure cross-origin requests
- **Input Validation** on all API endpoints
- **SQL Injection Protection** via Django ORM
- **XSS Protection** with React's built-in sanitization

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

For questions, suggestions, or collaboration opportunities, please open an issue or reach out via the repository.

---

**TopicsLoop** - Where AI meets knowledge discovery 🧠✨