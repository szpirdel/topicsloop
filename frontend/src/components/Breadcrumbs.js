import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumbs = ({ path = [], currentPage = null }) => {
  if (!path || (path.length === 0 && !currentPage)) {
    return null;
  }

  return (
    <nav
      className="breadcrumbs"
      aria-label="Breadcrumb navigation"
      style={{
        fontSize: '0.9rem',
        color: '#6c757d',
        padding: '0.75rem 0',
        marginBottom: '1rem'
      }}
    >
      <Link
        to="/posts"
        style={{
          color: '#007bff',
          textDecoration: 'none',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.color = '#0056b3'}
        onMouseLeave={(e) => e.target.style.color = '#007bff'}
      >
        Home
      </Link>

      {path.map((category, index) => {
        const isLast = index === path.length - 1 && !currentPage;

        return (
          <span key={category.id}>
            <span style={{ margin: '0 0.5rem', color: '#dee2e6' }}>&gt;</span>

            {isLast ? (
              <span style={{ color: '#2c3e50', fontWeight: '500' }}>
                {category.name}
              </span>
            ) : (
              <Link
                to={`/categories/${category.id}`}
                style={{
                  color: '#007bff',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#0056b3'}
                onMouseLeave={(e) => e.target.style.color = '#007bff'}
              >
                {category.name}
              </Link>
            )}
          </span>
        );
      })}

      {currentPage && (
        <span>
          <span style={{ margin: '0 0.5rem', color: '#dee2e6' }}>&gt;</span>
          <span style={{ color: '#2c3e50', fontWeight: '500' }}>
            {currentPage}
          </span>
        </span>
      )}
    </nav>
  );
};

export default Breadcrumbs;
