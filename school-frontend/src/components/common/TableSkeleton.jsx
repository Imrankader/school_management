import React from 'react';

export const TableSkeleton = ({
  columns = 5,
  rows = 5,
  colWidths = [],
}) => {
  const defaultWidths = ['20%', '30%', '15%', '20%', '15%'];

  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={`skeleton-row-${rIdx}`} style={{ borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
          {Array.from({ length: columns }).map((_, cIdx) => {
            const width = colWidths[cIdx] || defaultWidths[cIdx % defaultWidths.length] || '20%';
            return (
              <td key={`skeleton-col-${rIdx}-${cIdx}`} style={{ padding: '0.875rem 1rem' }}>
                <div
                  className="skeleton"
                  style={{
                    height: '14px',
                    width: width,
                    borderRadius: '4px',
                  }}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};
