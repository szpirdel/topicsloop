import React from 'react';
import { Link } from 'react-router-dom';
import './Breadcrumbs.css';

/**
 * Breadcrumbs Component
 *
 * Shows hierarchical navigation path for categories and posts
 * Example: Home > Technology > Machine Learning > Neural Networks
 *
 * Props:
 * - path: Array of breadcrumb items with { id, name, slug }
 * - currentPage: String - Name of current page (not clickable)
 * - showHome: Boolean - Whether to show "Home" link (default: true)
 */

const Breadcrumbs = ({ path = [], currentPage = null, showHome = true }) => {
  // Don't render if no breadcrumbs to show
  if (!path || (path.length === 0 && !currentPage)) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb navigation">
      <ol className="breadcrumbs-list">
        {/* Home Link */}
        {showHome && (
          <li className="breadcrumb-item">
            <Link to="/posts" className="breadcrumb-link">
              Home
            </Link>
            <span className="breadcrumb-separator">›</span>
          </li>
        )}

        {/* Category Path */}
        {path.map((category, index) => {
          const isLast = index === path.length - 1 && !currentPage;

          return (
            <li key={category.id} className="breadcrumb-item">
              {isLast ? (
                <span className="breadcrumb-current">{category.name}</span>
              ) : (
                <>
                  <Link
                    to={`/categories/${category.id}`}
                    className="breadcrumb-link"
                  >
                    {category.name}
                  </Link>
                  <span className="breadcrumb-separator">›</span>
                </>
              )}
            </li>
          );
        })}

        {/* Current Page (not clickable) */}
        {currentPage && (
          <li className="breadcrumb-item">
            <span className="breadcrumb-current">{currentPage}</span>
          </li>
        )}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
