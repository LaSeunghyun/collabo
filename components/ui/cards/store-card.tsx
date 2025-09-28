import Image from 'next/image';
import type { StoreItem } from '@/app/api/store/route';

interface StoreCardProps {
  product: StoreItem;
}

export function StoreCard({ product }: StoreCardProps) {
  const finalPrice = product.discount 
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
      <div className="relative h-48 w-full">
        <Image src={product.image} alt={product.title} fill className="object-cover" />
        {product.discount ? (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            -{product.discount}%
          </span>
        ) : null}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">품절</span>
          </div>
        )}
      </div>
      <div className="space-y-2 p-5">
        <h3 className="text-base font-semibold text-white">{product.title}</h3>
        {product.description && (
          <p className="text-xs text-white/60 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{finalPrice.toLocaleString()}₩</p>
          {product.discount && (
            <p className="text-xs text-white/60 line-through">{product.price.toLocaleString()}₩</p>
          )}
        </div>
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/70">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
