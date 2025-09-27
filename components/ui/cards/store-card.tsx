import Image from 'next/image';

interface StoreCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    discount?: number;
    image: string;
  };
}

export function StoreCard({ product }: StoreCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="relative h-48 w-full">
        <Image src={product.image} alt={product.title} fill className="object-cover" />
        {product.discount ? (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            -{product.discount}%
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-5">
        <h3 className="text-base font-semibold text-white">{product.title}</h3>
        <p className="text-sm text-white/60">{product.price.toLocaleString()}₩</p>
      </div>
    </article>
  );
}
