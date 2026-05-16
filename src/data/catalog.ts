import { CatalogSection } from '../types';

export const CATALOG: CatalogSection[] = [
  {
    id: 'body',
    name: 'Body',
    icon: '🚗',
    subsections: [
      { id: 'body-front', name: 'Front Bumper & Fascia', icon: '🔲' },
      { id: 'body-hood', name: 'Hood & Frunk', icon: '🔼' },
      { id: 'body-doors', name: 'Doors & Handles', icon: '🚪' },
      { id: 'body-rear', name: 'Rear Bumper & Trunk', icon: '🔲' },
      { id: 'body-mirrors', name: 'Mirrors', icon: '🪞' },
      { id: 'body-roof', name: 'Roof & Spoilers', icon: '🏎️' },
    ],
  },
  {
    id: 'interior',
    name: 'Interior',
    icon: '🪑',
    subsections: [
      { id: 'int-dash', name: 'Dashboard & Trim', icon: '🖥️' },
      { id: 'int-console', name: 'Center Console', icon: '📦' },
      { id: 'int-seats', name: 'Seats & Upholstery', icon: '🪑' },
      { id: 'int-floor', name: 'Floor & Cargo', icon: '🧹' },
      { id: 'int-lighting', name: 'Interior Lighting', icon: '💡' },
    ],
  },
  {
    id: 'chassis',
    name: 'Chassis',
    icon: '⚙️',
    subsections: [
      { id: 'ch-front-susp', name: 'Front Suspension', icon: '🔩' },
      { id: 'ch-rear-susp', name: 'Rear Suspension', icon: '🔩' },
      { id: 'ch-brakes', name: 'Brakes', icon: '🛑' },
      { id: 'ch-wheels', name: 'Wheels & Tires', icon: '🛞' },
    ],
  },
  {
    id: 'charging',
    name: 'Charging',
    icon: '🔋',
    subsections: [
      { id: 'chg-home', name: 'Home Charging', icon: '🏠' },
      { id: 'chg-mobile', name: 'Mobile Connectors', icon: '📱' },
      { id: 'chg-adapters', name: 'Adapters & Cables', icon: '🔌' },
    ],
  },
  {
    id: 'powertrain',
    name: 'Powertrain',
    icon: '⚡',
    subsections: [
      { id: 'pt-motor', name: 'Motor & Drivetrain', icon: '🔧' },
      { id: 'pt-battery', name: 'Battery & HV System', icon: '🔋' },
    ],
  },
  {
    id: 'hvac',
    name: 'HVAC',
    icon: '❄️',
    subsections: [
      { id: 'hvac-filters', name: 'Cabin Filters', icon: '🌬️' },
      { id: 'hvac-ac', name: 'AC & Heating', icon: '🌡️' },
    ],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: '📡',
    subsections: [
      { id: 'elec-cameras', name: 'Cameras & Sensors', icon: '📷' },
      { id: 'elec-display', name: 'Display & Audio', icon: '🔊' },
    ],
  },
];
