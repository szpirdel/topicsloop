import React from 'react';

const Pagination = ({ pagination, onPageChange, currentFilters = {} }) => {
  if (!pagination || pagination.total_pages <= 1) {
    return null; // Don't show pagination if only one page
  }

  const { current_page, total_pages, has_next, has_previous } = pagination;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage, endPage;

    if (total_pages <= maxVisiblePages) {
      startPage = 1;
      endPage = total_pages;
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      if (current_page <= halfVisible) {
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (current_page + halfVisible >= total_pages) {
        startPage = total_pages - maxVisiblePages + 1;
        endPage = total_pages;
      } else {
        startPage = current_page - halfVisible;
        endPage = current_page + halfVisible;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handlePageClick = (page) => {
    if (page !== current_page) {
      onPageChange({ ...currentFilters, page });
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '2rem',
      padding: '1rem'
    }}>
      {/* Previous Button */}
      <button
        onClick={() => handlePageClick(current_page - 1)}
        disabled={!has_previous}
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid #dee2e6',
          backgroundColor: has_previous ? 'white' : '#f8f9fa',
          color: has_previous ? '#007bff' : '#6c757d',
          cursor: has_previous ? 'pointer' : 'not-allowed',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}
      >
        ← Previous
      </button>

      {/* First page if not visible */}
      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => handlePageClick(1)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #dee2e6',
              backgroundColor: 'white',
              color: '#007bff',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span style={{ color: '#6c757d' }}>...</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map(page => (
        <button
          key={page}
          onClick={() => handlePageClick(page)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #dee2e6',
            backgroundColor: page === current_page ? '#007bff' : 'white',
            color: page === current_page ? 'white' : '#007bff',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '0.9rem',
            fontWeight: page === current_page ? 'bold' : 'normal'
          }}
        >
          {page}
        </button>
      ))}

      {/* Last page if not visible */}
      {pageNumbers[pageNumbers.length - 1] < total_pages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < total_pages - 1 && (
            <span style={{ color: '#6c757d' }}>...</span>
          )}
          <button
            onClick={() => handlePageClick(total_pages)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #dee2e6',
              backgroundColor: 'white',
              color: '#007bff',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            {total_pages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => handlePageClick(current_page + 1)}
        disabled={!has_next}
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid #dee2e6',
          backgroundColor: has_next ? 'white' : '#f8f9fa',
          color: has_next ? '#007bff' : '#6c757d',
          cursor: has_next ? 'pointer' : 'not-allowed',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}
      >
        Next →
      </button>

      {/* Page info */}
      <div style={{
        marginLeft: '1rem',
        color: '#6c757d',
        fontSize: '0.9rem'
      }}>
        Page {current_page} of {total_pages}
      </div>
    </div>
  );
};

export default Pagination;