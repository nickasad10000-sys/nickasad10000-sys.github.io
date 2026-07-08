// TITAN PRO · V8 — 404 page.

import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

export default function NotFound() {
  return (
    <div className="page page--notfound">
      <h1>404</h1>
      <p>Halaman ini tidak ada di data Spartan.</p>
      <Link to="/" className="tm-btn tm-btn--primary"><Icon name="arrowLeft" size={12} /> Kembali ke Beranda</Link>
    </div>
  );
}
