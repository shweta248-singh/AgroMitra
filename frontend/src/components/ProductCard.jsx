import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import './landing.css'

export default function ProductCard({ product }) {
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const { t } = useLanguage()

  const image =
    product?.image ||
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80'

  const unit = product?.unit || 'piece'
  const price = Number(product?.price || 0)
  const stock = product?.stock || 0

  async function handleAddToCart(e) {
    e.stopPropagation()

    if (adding) return

    setAdding(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError

      const user = userData?.user

      if (!user) {
        alert('Please login as buyer first.')
        navigate('/buyer-login')
        return
      }

      const { data: existingItem, error: fetchError } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existingItem) {
        const { error: updateError } = await supabase
          .from('cart')
          .update({
            quantity: Number(existingItem.quantity || 0) + 1,
          })
          .eq('id', existingItem.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('cart').insert({
          user_id: user.id,
          product_id: product.id,
          product_name: product.name,
          price,
          quantity: 1,
          image,
        })

        if (insertError) throw insertError
      }

      window.dispatchEvent(new Event('cartUpdated'))

      alert('Added to cart')
    } catch (error) {
      console.error('Add to cart error:', error)
      alert(error.message || 'Add to cart failed')
    } finally {
      setAdding(false)
    }
  }

  function handleProductClick() {
    navigate(`/product/${product.id}`)
  }

  return (
    <div className="shop-card" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
      <div className="shop-img-box">
        <img src={image} alt={product?.name || 'Product'} />

        <button type="button" onClick={handleAddToCart} disabled={adding}>
          {adding ? 'Adding...' : t('productsPage.addToCart') || 'ADD'}
        </button>
      </div>

      <div className="shop-info">
        <div className="shop-price">
          <span>
            ₹{price} / {t(`common.units.${unit}`)}
          </span>
          <del>₹{price + 100}</del>
        </div>

        <p className="shop-off">₹50 {t('product.off')}</p>

        <h3>{product?.name}</h3>

        <p className="shop-pack">
          1 {t('product.pack')} ({stock} {t('product.in_stock')})
        </p>

        <span className="shop-tag">{product?.category || 'Agriculture'}</span>

        <p className="shop-rating">⭐ 4.8</p>
      </div>
    </div>
  )
}