import React from 'react'
import './Table.css'

const Table = ({ columns, data, onEdit, onDelete }) => {
  const getStockStatus = (stock) => {
    if (stock < 10) return 'low-stock'
    if (stock < 30) return 'medium-stock'
    return 'high-stock'
  }

  const getExpiryStatus = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return { status: 'expired', days: daysUntilExpiry }
    if (daysUntilExpiry <= 30) return { status: 'expiring-soon', days: daysUntilExpiry }
    if (daysUntilExpiry <= 90) return { status: 'expiring-medium', days: daysUntilExpiry }
    return { status: 'good', days: daysUntilExpiry }
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="no-data">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row._id || row.id}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.key === 'stock' ? (
                      <span className={`badge ${getStockStatus(row[column.key])}`}>
                        {row[column.key]}
                      </span>
                    ) : column.key === 'expiryDate' ? (
                      <span className={`badge ${getExpiryStatus(row[column.key]).status}`}>
                        {new Date(row[column.key]).toLocaleDateString()}
                      </span>
                    ) : (
                      column.render ? column.render(row[column.key], row) : row[column.key]
                    )}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td>
                    <div className="action-buttons">
                      {onEdit && (
                        <button 
                          className="btn-icon btn-edit" 
                          onClick={() => onEdit(row._id || row.id)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => onDelete(row._id || row.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
