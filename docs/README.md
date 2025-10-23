# TopicsLoop Documentation

**Last Updated:** 2025-10-15

This folder contains strategic and planning documents for TopicsLoop development.

---

## 📚 Document Index

### **[PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md)** - Complete Product Strategy
**Read this for the big picture!**

This comprehensive document combines:
- Product vision ("Topic GPS for the Internet")
- Target users and personas
- User journeys (The Feed Explorer, The Visual Explorer)
- Core value propositions
- Founding principles and design philosophy
- Success metrics and anti-patterns
- UI components needed
- Implementation priorities

**Sections include:**
- The Big Idea & Problem/Solution
- Competitive positioning
- Primary & Secondary user journeys
- Success metrics
- Anti-patterns to avoid
- Brand personality
- Origin story and lessons learned
- Long-term vision (5+ years)

**Who should read:** Everyone involved in the project - this is our North Star

---

### **[API.md](API.md)** - Complete API Documentation
**Reference for all backend endpoints**

Comprehensive API documentation covering:
- Authentication (JWT tokens)
- Posts API (CRUD, similar posts)
- Categories API (flat list, tree structure, hierarchical paths)
- AI Features API (auto-categorization, embeddings, recommendations)
- Visualization API (network data for graphs)
- User Management API (profiles, following)
- Tags API
- Error handling, rate limiting, pagination

**Sections include:**
- All endpoint specifications
- Request/response examples
- Query parameters
- Authentication requirements
- Error responses
- Performance tips
- API changelog

**Who should read:** Frontend developers, API consumers, backend developers

---

## 🗺️ How to Use These Docs

### **If you're new to the project:**
1. Read [PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md) - Understand what we're building and why
2. Review [API.md](API.md) - Understand the backend capabilities
3. Check [../project_backlog.md](../project_backlog.md) - See what we're building next

### **If you're starting development:**
1. Check [../project_backlog.md](../project_backlog.md) for current sprint tasks
2. Reference [API.md](API.md) for endpoint specifications
3. Refer back to [PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md) when making design decisions

### **If you're making product decisions:**
1. Use [PRODUCT_STRATEGY.md](PRODUCT_STRATEGY.md) as North Star
2. Validate against user needs defined in the strategy
3. Check [../project_backlog.md](../project_backlog.md) for prioritization

---

## 📋 Document Maintenance

### **When to update:**

**PRODUCT_STRATEGY.md**
- Update: When strategic direction changes or user feedback reveals new patterns
- Review: Quarterly or when major pivots occur
- Owner: Product owner

**API.md**
- Update: When new endpoints are added or existing ones change significantly
- Review: With each release that includes API changes
- Owner: Backend team

---

## 🔗 Related Documentation

**In Root Directory:**
- [README.md](../README.md) - Project overview, setup instructions, and architecture
- [CHANGELOG.md](../CHANGELOG.md) - Version history and release notes
- [project_backlog.md](../project_backlog.md) - Current sprint tasks and long-term roadmap
- [LICENSE](../LICENSE) - MIT license

---

## 📝 Documentation Structure Policy

⚠️ **IMPORTANT:** Before creating, modifying, or deleting any .md files:

1. **Always ask for approval first**
2. **Discuss the purpose and placement** with the project owner
3. **Consider if the content fits into existing documents**
4. **Avoid creating new files without explicit agreement**

This policy prevents documentation sprawl and maintains a clean, organized structure.

---

## ❓ Questions?

If these documents don't answer your questions:
1. Check the main [README.md](../README.md)
2. Review [project_backlog.md](../project_backlog.md) for current work
3. Open a GitHub issue for clarification

---

**"Clear documentation = Clear direction"**
