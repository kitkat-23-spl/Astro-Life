import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-head center">
      <p className="eyebrow">404</p>
      <h1>This star isn’t on our map</h1>
      <p className="lede">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="btn primary">Back home</Link>
    </div>
  )
}
