import React, { useState, useMemo } from 'react'
import styles from './Table.module.css'

/**
 * Table Component
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions: [{ key, label, sortable, render }]
 * @param {Array} props.data - Array of data objects
 * @param {string} props.variant - Table variant: 'default' | 'compact' | 'comfortable' | 'striped'
 * @param {boolean} props.hoverable - Whether rows have hover effect
 * @param {boolean} props.bordered - Whether table has borders
 * @param {Function} props.onRowClick - Row click handler
 * @param {string} props.emptyMessage - Message to show when no data
 * @param {boolean} props.loading - Whether table is loading
 */
const Table = ({ 
  columns = [],
  data = [],
  variant = 'default',
  hoverable = true,
  bordered = false,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === bValue) return 0

      const comparison = aValue > bValue ? 1 : -1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [data, sortConfig])

  // Handle sort
  const handleSort = (columnKey) => {
    let direction = 'asc'
    
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc'
    }

    setSortConfig({ key: columnKey, direction })
  }

  const tableClasses = [
    styles.tableWrapper,
    bordered ? styles.tableBordered : ''
  ].filter(Boolean).join(' ')

  const tableVariantClass = styles[`table${variant.charAt(0).toUpperCase() + variant.slice(1)}`]

  return (
    <div className={tableClasses}>
      <div className={styles.tableContainer}>
        <table className={`${styles.table} ${tableVariantClass}`}>
          <thead className={styles.tableHead}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    ${styles.tableHeader}
                    ${column.sortable ? styles.sortable : ''}
                    ${sortConfig.key === column.key ? styles.sorted : ''}
                  `}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  role={column.sortable ? 'button' : undefined}
                  tabIndex={column.sortable ? 0 : undefined}
                >
                  <div className={styles.headerContent}>
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className={styles.sortIcon}>
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading...</p>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`
                    ${styles.tableRow}
                    ${hoverable ? styles.rowHoverable : ''}
                    ${onRowClick ? styles.rowClickable : ''}
                  `}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={styles.tableCell}>
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table
