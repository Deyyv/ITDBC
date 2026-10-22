import { ShoppingBasket, Coffee, BookOpen } from 'lucide-react'

export const STORES = [
  {
    id: 'ecomarket',
    code: 'ECM',
    name: 'EcoMarket',
    tagline: 'Supermercado ecológico',
    desc: 'Alimentos y productos sostenibles de la comunidad.',
    Icon: ShoppingBasket,
    fg: '#1C3B2C',
    bgSoft: 'bg-fibra/50',
  },
  {
    id: 'verdecafe',
    code: 'VCF',
    name: 'VerdeCafé',
    tagline: 'Cafetería y panadería',
    desc: 'Café de origen y panes artesanales del barrio.',
    Icon: Coffee,
    fg: '#C9993B',
    bgSoft: 'bg-lavada',
  },
  {
    id: 'ecoschool',
    code: 'ECS',
    name: 'EcoSchool',
    tagline: 'Papelería y útiles escolares',
    desc: 'Cuadernos, lápices y material escolar reciclado.',
    Icon: BookOpen,
    fg: '#47724F',
    bgSoft: 'bg-follaje/[0.05]',
  },
]