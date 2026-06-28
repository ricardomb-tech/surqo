'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface RuixenCardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  badge?: { text: string; variant: 'pink' | 'indigo' | 'orange' };
  href?: string;
  step?: string;
}

const cards: RuixenCardProps[] = [
  {
    step: '01',
    title: 'Instala el nodo en tu finca',
    subtitle: 'ESP32 con sensores DHT22 y capacitivo de suelo. Una batería dura semanas con deep sleep.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    badge: { text: 'Hardware', variant: 'indigo' },
    href: '/como-funciona#pasos',
  },
  {
    step: '02',
    title: 'Datos en tiempo real',
    subtitle: 'Cada 15 minutos el nodo envía lecturas vía MQTT TLS. Stream en vivo en el dashboard.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80',
    badge: { text: 'IoT', variant: 'orange' },
    href: '/como-funciona#pasos',
  },
  {
    step: '03',
    title: 'IA analiza y recomienda',
    subtitle: 'Llama 3.3 70B cruza tus datos con pronóstico de 7 días y genera recomendaciones en español.',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80',
    badge: { text: 'IA', variant: 'pink' },
    href: '/como-funciona#pasos',
  },
  {
    step: '04',
    title: 'Alertas cuando importa',
    subtitle: 'Estrés hídrico, temperatura fuera de rango o riesgo de hongos — te avisamos antes.',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=600&q=80',
    badge: { text: 'Alertas', variant: 'orange' },
    href: '/como-funciona#pasos',
  },
  {
    step: '05',
    title: 'Decide con datos',
    subtitle: 'KPIs del día, historial de humedad, análisis IA y alertas — todo en un panel, 24/7.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80',
    badge: { text: 'Dashboard', variant: 'indigo' },
    href: '/como-funciona#pasos',
  },
];

const badgeColors = {
  pink: 'bg-pink-600 text-white',
  indigo: 'bg-indigo-600 text-white',
  orange: 'bg-orange-500 text-white',
};

export default function Slider_01() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const shift = (direction: 'next' | 'prev') => {
    setCurrentIndex((prev) =>
      direction === 'next'
        ? (prev + 1) % cards.length
        : (prev - 1 + cards.length) % cards.length
    );
  };

  useEffect(() => {
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      let position = i - currentIndex;
      if (position < -Math.floor(cards.length / 2)) position += cards.length;
      else if (position > Math.floor(cards.length / 2)) position -= cards.length;

      const x = position * 300;
      const y = position === 0 ? 20 : 0;
      const scale = position === 0 ? 1.04 : 0.94;
      const zIndex = position === 0 ? 10 : Math.max(0, 5 - Math.abs(position));

      if (Math.abs(position) > 2) {
        gsap.set(card, { x, y, scale, zIndex });
      } else {
        gsap.to(card, { x, y, scale, zIndex, duration: 0.55, ease: 'power2.out' });
      }
    });
  }, [currentIndex]);

  return (
    <div className="w-full relative px-6 py-16 overflow-hidden bg-surqo-bg">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-3">
          Resumen del proceso
        </p>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-surqo-text">
          5 pasos, del campo a la decisión
        </h2>
      </div>

      {/* Carousel */}
      <div className="relative flex items-center justify-center h-[380px]">
        {cards.map((card, index) => (
          <div
            key={index}
            ref={(el) => { cardRefs.current[index] = el; }}
            className="absolute"
            style={{ zIndex: index === currentIndex ? 10 : 1 }}
          >
            <Link
              href={card.href ?? '#'}
              className="relative block overflow-hidden rounded-2xl shadow-xl border border-zinc-200 bg-white transition-all duration-300 hover:scale-[1.02] w-[260px]"
            >
              {/* Image */}
              <div className="relative h-[220px] w-[260px]">
                <Image
                  src={card.image ?? ''}
                  alt={card.title ?? ''}
                  fill
                  className="object-cover"
                  sizes="260px"
                />
                {/* Step number overlay */}
                <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xs font-black text-white">{card.step}</span>
                </div>
              </div>

              {/* Badge */}
              {card.badge && (
                <div className="absolute top-4 -left-8 transform -rotate-45">
                  <div className={cn('px-4 py-0.5 text-xs font-bold shadow-md', badgeColors[card.badge.variant])}>
                    {card.badge.text}
                  </div>
                </div>
              )}

              {/* Text */}
              <div className="p-4">
                <h3 className="text-sm font-black text-zinc-900 mb-1 leading-tight">{card.title}</h3>
                <p className="text-xs text-zinc-500 leading-snug mb-3">{card.subtitle}</p>
                <div className="flex justify-end">
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-surqo-green/10 border border-surqo-green/30 transition-all duration-300 hover:scale-110">
                    <ArrowUpRight className="w-3.5 h-3.5 text-surqo-green" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4 mb-4">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === currentIndex ? 'w-6 bg-surqo-green' : 'w-1.5 bg-zinc-300'
            )}
          />
        ))}
      </div>

      {/* Arrows */}
      <div className="flex justify-center gap-3 mt-2">
        <button
          onClick={() => shift('prev')}
          className="p-2.5 rounded-full border border-zinc-200 bg-white hover:border-surqo-green hover:scale-110 transition shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-600" />
        </button>
        <button
          onClick={() => shift('next')}
          className="p-2.5 rounded-full border border-zinc-200 bg-white hover:border-surqo-green hover:scale-110 transition shadow-sm"
        >
          <ChevronRight className="w-5 h-5 text-zinc-600" />
        </button>
      </div>
    </div>
  );
}
