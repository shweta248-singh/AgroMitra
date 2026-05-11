import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import '../components/landing.css'

export default function CategoryProducts() {
  const { categorySlug } = useParams()
  const [products, setProducts] = useState([])
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCategoryProducts()
  }, [categorySlug])

  async function fetchCategoryProducts() {
    setLoading(true)
    setError(null)

    // Using categorySlug directly as the category name/value
    setCategoryName(categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1))

    // Fetch products for this category using the 'category' field
    const { data: prodData, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('category', categorySlug)
      .order('created_at', { ascending: false })

    console.log("FETCHED CATEGORY PRODUCTS:", prodData)

    if (prodErr) {
      setError('Failed to load products.')
    } else {
      setProducts(prodData || [])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <section className="products-page-pro">
        <div className="products-container-pro">
           <div className="products-loading">
             <div className="loader-spinner"></div>
             <p>Loading {categorySlug} products...</p>
           </div>
        </div>
      </section>
    )
  }

  return (
    <section className="products-page-pro">
      <div className="products-container-pro">
        
        <div className="category-products-header">
          <Link to="/products" className="back-link">← Back to All Products</Link>
          <div className="category-section-head mt-4">
            <h2>{categoryName} Products</h2>
            <span>{products.length} Items</span>
          </div>
        </div>

        {error ? (
          <div className="products-error-pro">
            <h2>Oops!</h2>
            <p>{error}</p>
            <button onClick={fetchCategoryProducts} className="retry-btn">Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="products-empty-pro">
            <h2>No products found</h2>
            <p>Check back later for new arrivals in {categoryName}.</p>
          </div>
        ) : (
          <div className="shop-products-row">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
