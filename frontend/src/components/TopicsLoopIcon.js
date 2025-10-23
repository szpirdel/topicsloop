import React from 'react';

const TopicsLoopIcon = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left side - Hierarchical tree structure */}
      <g className="tree-side">
        {/* Vertical line */}
        <line x1="15" y1="25" x2="15" y2="75" stroke="#667eea" strokeWidth="3" strokeLinecap="round" />

        {/* Top branch */}
        <line x1="15" y1="35" x2="35" y2="35" stroke="#667eea" strokeWidth="3" strokeLinecap="round" />
        <circle cx="38" cy="35" r="3" fill="#667eea" />

        {/* Middle branch (longer) */}
        <line x1="15" y1="50" x2="30" y2="50" stroke="#667eea" strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="50" x2="30" y2="60" stroke="#667eea" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="30" y1="60" x2="40" y2="60" stroke="#667eea" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="43" cy="60" r="2.5" fill="#667eea" />

        {/* Bottom branch */}
        <line x1="15" y1="65" x2="32" y2="65" stroke="#667eea" strokeWidth="3" strokeLinecap="round" />
        <circle cx="35" cy="65" r="3" fill="#667eea" />
      </g>

      {/* Center divider line */}
      <line x1="50" y1="20" x2="50" y2="80" stroke="#e9ecef" strokeWidth="2" strokeLinecap="round" />

      {/* Right side - Network graph */}
      <g className="graph-side">
        {/* Center node (like a "nose" position) */}
        <circle cx="70" cy="50" r="6" fill="#764ba2" />

        {/* Top-left node (like "left eye") */}
        <circle cx="62" cy="35" r="4.5" fill="#2ecc71" />
        <line x1="65" y1="38" x2="68" y2="46" stroke="#667eea" strokeWidth="2" opacity="0.6" />

        {/* Top-right node (like "right eye") */}
        <circle cx="78" cy="35" r="4.5" fill="#2ecc71" />
        <line x1="76" y1="38" x2="72" y2="46" stroke="#667eea" strokeWidth="2" opacity="0.6" />

        {/* Bottom-left node */}
        <circle cx="62" cy="65" r="4" fill="#3498db" />
        <line x1="64" y1="62" x2="68" y2="54" stroke="#667eea" strokeWidth="1.5" opacity="0.5" />

        {/* Bottom-right node */}
        <circle cx="78" cy="65" r="4" fill="#3498db" />
        <line x1="76" y1="62" x2="72" y2="54" stroke="#667eea" strokeWidth="1.5" opacity="0.5" />

        {/* Connection between top nodes */}
        <line x1="66" y1="35" x2="74" y2="35" stroke="#667eea" strokeWidth="1.5" opacity="0.4" strokeDasharray="2,2" />
      </g>
    </svg>
  );
};

export default TopicsLoopIcon;
