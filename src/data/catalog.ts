import { CatalogSection } from '../types';

export const CATALOG: CatalogSection[] = [
  {
    id: 'body',
    name: 'Body',
    icon: '🚗',
    image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=120&q=70',
    subsections: [
      { id: 'body-front',   name: 'Front Bumper & Fascia',  icon: '🔲' },
      { id: 'body-hood',    name: 'Hood & Frunk',           icon: '🔼' },
      { id: 'body-doors',   name: 'Doors & Handles',        icon: '🚪' },
      { id: 'body-rear',    name: 'Rear Bumper & Trunk',    icon: '🔲' },
      { id: 'body-mirrors', name: 'Mirrors',                icon: '🪞' },
      { id: 'body-roof',    name: 'Roof & Spoilers',        icon: '🏎️' },
    ],
  },
  {
    id: 'interior',
    name: 'Interior',
    icon: '🪑',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=120&q=70',
    subsections: [
      { id: 'int-dash',    name: 'Dashboard & Trim',      icon: '🖥️' },
      { id: 'int-console', name: 'Center Console',        icon: '📦' },
      { id: 'int-seats',   name: 'Seats & Upholstery',   icon: '🪑' },
      { id: 'int-floor',   name: 'Floor & Cargo',         icon: '🧹' },
      { id: 'int-lighting',name: 'Interior Lighting',     icon: '💡' },
    ],
  },
  {
    id: 'chassis',
    name: 'Chassis',
    icon: '⚙️',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=120&q=70',
    subsections: [
      { id: 'ch-front-susp', name: 'Front Suspension', icon: '🔩' },
      { id: 'ch-rear-susp',  name: 'Rear Suspension',  icon: '🔩' },
      { id: 'ch-brakes',     name: 'Brakes',            icon: '🛑' },
      { id: 'ch-wheels',     name: 'Wheels & Tires',    icon: '🛞' },
    ],
  },
  {
    id: 'charging',
    name: 'Charging',
    icon: '🔋',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=120&q=70',
    subsections: [
      { id: 'chg-home',     name: 'Home Charging',        icon: '🏠' },
      { id: 'chg-mobile',   name: 'Mobile Connectors',    icon: '📱' },
      { id: 'chg-adapters', name: 'Adapters & Cables',    icon: '🔌' },
    ],
  },
  {
    id: 'powertrain',
    name: 'Powertrain',
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=120&q=70',
    subsections: [
      { id: 'pt-motor',   name: 'Motor & Drivetrain',   icon: '🔧' },
      { id: 'pt-battery', name: 'Battery & HV System',  icon: '🔋' },
    ],
  },
  {
    id: 'hvac',
    name: 'HVAC',
    icon: '❄️',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=120&q=70',
    subsections: [
      { id: 'hvac-filters', name: 'Cabin Filters',   icon: '🌬️' },
      { id: 'hvac-ac',      name: 'AC & Heating',    icon: '🌡️' },
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: '📡',
    image: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=120&q=70',
    subsections: [
      { id: 'elec-cameras', name: 'Cameras & Sensors', icon: '📷' },
      { id: 'elec-display', name: 'Display & Audio',   icon: '🔊' },
    ],
  },
];
