import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../components/landing.css'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { init() }, [])

  async function init() {
    const { data: userData } = await supabase.auth.getUser()
    const u = userData?.user
    if (!u) { navigate('/buyer-login'); return }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', u.id)
      .single()

    if (error) {
      setError('Could not load profile.')
    } else {
      setProfile({ ...data, email: u.email })
      setForm({ full_name: data.full_name || '', phone: data.phone || '' })
    }
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name, phone: form.phone })
      .eq('id', profile.id)

    if (error) {
      setError(error.message)
    } else {
      setMessage('Profile updated successfully!')
      setProfile((prev) => ({ ...prev, ...form }))
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  if (loading) return <div className="profile-loading">Loading profile...</div>

  const initials = (profile?.full_name || profile?.email || 'U').slice(0, 2).toUpperCase()

  return (
    <section className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <span>My Account</span>
          <h1>My Profile</h1>
          <p>Manage your personal information.</p>
        </div>

        <div className="profile-layout">
          {/* Avatar card */}
          <div className="profile-avatar-card">
            <div className="profile-avatar">{initials}</div>
            <h2>{profile?.full_name || 'User'}</h2>
            <p>{profile?.email}</p>
            <div className="profile-role-badge">
              {profile?.role === 'seller' ? '🌾 Seller' : '🛒 Buyer'}
            </div>
            {profile?.aadhaar_verified && (
              <div className="profile-verified-badge">✅ Aadhaar Verified</div>
            )}
          </div>

          {/* Edit form */}
          <div className="profile-form-card">
            <h2 className="profile-form-title">Edit Profile</h2>

            {message && <div className="profile-success">{message}</div>}
            {error && <div className="profile-error">{error}</div>}

            <form onSubmit={handleSave} className="profile-form">
              <div className="profile-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div className="profile-form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="9876543210"
                />
              </div>
              <div className="profile-form-group">
                <label>Email (read-only)</label>
                <input type="email" value={profile?.email || ''} disabled className="profile-input-disabled" />
              </div>
              <div className="profile-form-group">
                <label>Role (read-only)</label>
                <input type="text" value={profile?.role || ''} disabled className="profile-input-disabled" />
              </div>
              <button type="submit" className="profile-save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
