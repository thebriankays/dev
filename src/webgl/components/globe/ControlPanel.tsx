import React from 'react'
import type { FilterOptions, Destination } from './types'

interface ControlPanelProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  destinations: Destination[]
}

export function ControlPanel({ filters, onFiltersChange, destinations }: ControlPanelProps) {
  const categories = ['city', 'beach', 'mountain', 'historic', 'nature']
  
  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handleMinVisitorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    onFiltersChange({ ...filters, minVisitors: value * 1000000 })
  }

  const handleShowRoutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, showRoutes: e.target.checked })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchQuery: e.target.value })
  }

  return (
    <div className="globe-control-panel">
      <h3>Filter Destinations</h3>
      
      {/* Category filters */}
      <div className="filter-section">
        <h4>Categories</h4>
        {categories.map(category => (
          <label key={category} className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.categories.includes(category)}
              onChange={() => handleCategoryChange(category)}
            />
            <span className="category-label">{category}</span>
            <span className="category-count">
              ({destinations.filter(d => d.category === category).length})
            </span>
          </label>
        ))}
      </div>

      {/* Visitor count filter */}
      <div className="filter-section">
        <h4>Minimum Visitors</h4>
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="50"
            value={filters.minVisitors / 1000000}
            onChange={handleMinVisitorsChange}
          />
          <span className="slider-value">
            {(filters.minVisitors / 1000000).toFixed(0)}M+
          </span>
        </div>
      </div>

      {/* Routes toggle */}
      <div className="filter-section">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.showRoutes}
            onChange={handleShowRoutesChange}
          />
          <span>Show Flight Routes</span>
        </label>
      </div>

      {/* Search */}
      <div className="filter-section">
        <h4>Search</h4>
        <input
          type="text"
          placeholder="Search destinations..."
          value={filters.searchQuery || ''}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <style jsx>{`
        .globe-control-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          padding: 20px;
          border-radius: 12px;
          color: white;
          min-width: 250px;
          max-width: 300px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          z-index: 100;
        }

        h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: #4ECDC4;
        }

        h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 500;
          color: #cccccc;
        }

        .filter-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .filter-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .filter-checkbox {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .filter-checkbox:hover {
          opacity: 0.8;
        }

        .filter-checkbox input {
          margin-right: 8px;
          cursor: pointer;
        }

        .category-label {
          text-transform: capitalize;
          flex: 1;
        }

        .category-count {
          font-size: 12px;
          color: #888;
          margin-left: 8px;
        }

        .slider-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        input[type="range"] {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
          border-radius: 2px;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #4ECDC4;
          cursor: pointer;
          border-radius: 50%;
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #4ECDC4;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }

        .slider-value {
          min-width: 50px;
          text-align: right;
          font-size: 14px;
          color: #4ECDC4;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: #4ECDC4;
        }

        @media (max-width: 768px) {
          .globe-control-panel {
            top: 10px;
            right: 10px;
            padding: 15px;
            min-width: 200px;
            max-width: 250px;
          }

          h3 {
            font-size: 16px;
            margin-bottom: 15px;
          }

          h4 {
            font-size: 13px;
          }

          .filter-section {
            margin-bottom: 15px;
            padding-bottom: 15px;
          }
        }
      `}</style>
    </div>
  )
}