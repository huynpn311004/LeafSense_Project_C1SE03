import React, { useState, useEffect } from 'react'
import './ProductRecommendations.css'

const ProductRecommendations = ({ diseaseType, onProductSelect }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const API_BASE_URL = 'http://localhost:8000/api'

  useEffect(() => {
    if (diseaseType) {
      fetchRecommendations(diseaseType)
    }
  }, [diseaseType])

  const fetchRecommendations = async (disease) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}/shop/recommendations?disease=${disease}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }
      
      const data = await response.json()
      setRecommendations(data)
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError('Failed to load product recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (product) => {
    if (onProductSelect) {
      onProductSelect(product)
    }
  }

  if (!diseaseType) {
    return null
  }

  if (loading) {
    return (
      <div className="recommendations-container">
        <h3>Recommended Products for {diseaseType}</h3>
        <div className="loading-spinner"></div>
        <p>Loading recommendations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recommendations-container">
        <h3>Recommended Products for {diseaseType}</h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-container">
        <h3>Recommended Products for {diseaseType}</h3>
        <div className="no-recommendations">
          <p>No specific products found for {diseaseType}.</p>
          <p>Please consult with a plant specialist for treatment options.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recommendations-container">
      <h3>Recommended Products for {diseaseType}</h3>
      <p className="recommendations-subtitle">
        Based on the detected disease, here are some products that may help:
      </p>
      
      <div className="recommendations-grid">
        {recommendations.map(product => (
          <div 
            key={product.id} 
            className="recommendation-card"
            onClick={() => handleProductClick(product)}
          >
            <div className="recommendation-image">
              <img 
                src={product.image_url || '/api/placeholder/150/150'} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = '/api/placeholder/150/150'
                }}
              />
            </div>
            
            <div className="recommendation-info">
              <h4 className="recommendation-name">{product.name}</h4>
              <p className="recommendation-description">{product.description}</p>
              <div className="recommendation-price">${parseFloat(product.price).toFixed(2)}</div>
              
              {product.stock > 0 ? (
                <div className="recommendation-stock">In Stock ({product.stock})</div>
              ) : (
                <div className="recommendation-stock out-of-stock">Out of Stock</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductRecommendations
