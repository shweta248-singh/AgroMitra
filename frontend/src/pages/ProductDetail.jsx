import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import '../components/landing.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      console.log("Product ID:", id);
      console.log("Product Data:", data);
      
      if (data) {
        setProduct(data);
      } else if (error) {
        console.error("Error fetching product:", error.message);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!product) return; // Cart Logic Fix
    setAdding(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        alert(t('product.login_buyer'));
        return;
      }

      const { data: existingItem } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        await supabase
          .from('cart')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
      } else {
        await supabase.from('cart').insert({
          user_id: user.id,
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
          image: image,
        });
      }

      alert(t('product.added_cart'));
    } catch (error) {
      alert(error.message || t('product.add_failed'));
    } finally {
      setAdding(false);
    }
  }

  // Conditional Rendering Fix
  if (loading) return <div>{t('productsPage.loading')}</div>;
  if (!product) return <div className="products-empty-pro"><h2>{t('productsPage.not_found')}</h2></div>;

  const image =
    product?.image ||
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80';

  return (
    <section className="products-page-pro">
      <div className="products-container-pro" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '40px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: '1' }}>
            <img 
              src={image} 
              alt={product.name} 
              style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '1/1' }} 
            />
          </div>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="shop-tag" style={{ display: 'inline-block', marginBottom: '10px' }}>
              {product.category || 'Agriculture'}
            </span>
            <h1 style={{ fontSize: '28px', color: '#1f2937', marginBottom: '15px' }}>{product.name}</h1>
            
            <div className="shop-price" style={{ fontSize: '24px', marginBottom: '20px' }}>
              <span>₹{product.price} / {t(`common.units.${product.unit || 'piece'}`)}</span>
              <del style={{ fontSize: '16px', marginLeft: '10px' }}>₹{Number(product.price) + 100}</del>
            </div>
            
            <p style={{ color: '#4b5563', marginBottom: '25px', lineHeight: '1.6' }}>
              {product.description || t('product.default_desc')}
            </p>
            
            <p className="shop-pack" style={{ marginBottom: '30px' }}>
              {t('product.in_stock')}: {product.stock || 0}
            </p>
            
            <button 
              onClick={handleAddToCart} 
              disabled={adding}
              style={{ 
                background: '#10b981', 
                color: 'white', 
                padding: '12px 24px', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '16px', 
                fontWeight: 'bold',
                cursor: adding ? 'not-allowed' : 'pointer',
                opacity: adding ? 0.7 : 1
              }}
            >
              {adding ? t('productsPage.loading') : t('productsPage.addToCart')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
