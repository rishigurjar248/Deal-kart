import { ArrowLeft, Check, MessageCircle, ShoppingCart } from "lucide-react";
import SEO, { SITE_URL, productPath, productSchema } from "./SEO";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function ProductPage({ product, onAdd, onBack, related = [] }) {
  if (!product) {
    return (
      <>
        <SEO
          title="Product Not Found | DealKart"
          description="The DealKart product you requested could not be found."
          path={window.location.pathname}
          noindex
        />
        <main className="seo-product-page">
          <h1>Product not found</h1>
          <p>This deal may have been removed or is no longer active.</p>
          <button onClick={onBack}>Back to DealKart</button>
        </main>
      </>
    );
  }

  const canonicalPath = productPath(product);
  const images = [product.image, ...(product.galleryImages || [])].filter(Boolean);
  const relatedProducts = related.filter((p) => p.id !== product.id).slice(0, 4);
  const whatsapp = `https://wa.me/919244335428?text=${encodeURIComponent(`Hi DealKart 👋 I want ${product.name} for ${money(product.price)}.`)}`;

  return (
    <>
      <SEO
        title={`${product.name} | DealKart`}
        description={`${product.name}${product.brand ? ` by ${product.brand}` : ""} — shop this DealKart offer at ${money(product.price)} with Pan India delivery.`}
        path={canonicalPath}
        image={product.image || "/og-image.jpg"}
        type="product"
        schema={productSchema(product)}
      />
      <main className="seo-product-page">
        <nav className="seo-breadcrumb" aria-label="Breadcrumb">
          <a href="/" onClick={onBack}>DealKart</a>
          <span>/</span>
          <a href="/#products">{product.category || "Deals"}</a>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
        <article className="seo-product">
          <div className="seo-product-media">
            <img src={images[0] || "/og-image.jpg"} alt={`${product.name} product image`} width="720" height="720" fetchPriority="high" />
            {images.slice(1, 5).map((src, i) => (
              <img key={src} src={src} alt={`${product.name} product view ${i + 2}`} width="180" height="180" loading="lazy" decoding="async" />
            ))}
          </div>
          <div className="seo-product-copy">
            <p className="kicker">{product.brand || "DEALKART DEAL"}</p>
            <h1>{product.name}</h1>
            <p className="seo-product-description">{product.description}</p>
            <div className="seo-product-price">
              <strong>{money(product.price)}</strong>
              {product.oldPrice > product.price && <del>{money(product.oldPrice)}</del>}
            </div>
            <ul className="seo-key-points">
              {(product.keyPoints || product.specs || []).filter(Boolean).slice(0, 4).map((point) => (
                <li key={point}><Check size={16} />{point}</li>
              ))}
            </ul>
            <div className="seo-product-actions">
              <button onClick={() => onAdd(product)}><ShoppingCart size={17} /> Add to cart</button>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Buy on WhatsApp</a>
            </div>
          </div>
        </article>

        <section className="seo-related" aria-labelledby="related-products-heading">
          <div>
            <p className="kicker">KEEP SHOPPING</p>
            <h2 id="related-products-heading">More deals you may like</h2>
          </div>
          <div className="seo-related-grid">
            {relatedProducts.map((p) => (
              <a href={productPath(p)} key={p.id} className="seo-related-card">
                <img src={p.image || "/og-image.jpg"} alt={p.name} width="240" height="240" loading="lazy" decoding="async" />
                <span>{p.brand}</span>
                <strong>{p.name}</strong>
                <b>{money(p.price)}</b>
              </a>
            ))}
          </div>
        </section>
        <a className="seo-back-link" href="/#products">← Browse all DealKart deals</a>
      </main>
    </>
  );
}
