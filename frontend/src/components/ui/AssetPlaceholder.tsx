import React from 'react'

function AssetPlaceholder({ label = 'Loading asset...' }: { label?: string }) {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '14px'
      }}
    >
      {label}
    </div>
  )
}

export default AssetPlaceholder


