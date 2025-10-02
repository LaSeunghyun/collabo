import Image from 'next/image';

import type { StoreItem } from '@/app/api/store/route';

interface StoreCardProps {
  product: StoreItem;
}

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

const formatPrice = (value: number) => currencyFormatter.format(value);

export function StoreCard({ product }: StoreCardProps) {
  const finalPrice = product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
      <div className="relative h-48 w-full">
        <Image src={product.image} alt={product.title} fill className="object-cover" />
        {product.discount ? (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            -{product.discount}%
          </span>
        ) : null}
        {!product.isAvailable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white font-semibold">Sold Out</span>
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-5">
        <h3 className="text-base font-semibold text-white">{product.title}</h3>
        {product.description ? (
          <p className="line-clamp-2 text-xs text-white/60">{product.description}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white">{formatPrice(finalPrice)}</p>
          {product.discount ? (
            <p className="text-xs text-white/60 line-through">{formatPrice(product.price)}</p>
          ) : null}
        </div>
        {product.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
