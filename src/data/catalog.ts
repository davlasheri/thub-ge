import { CatalogSection } from '../types';

export const CATALOG: CatalogSection[] = [
  // ── GROUP 10: BODY ─────────────────────────────────────────────────────────
  {
    id: 'body',
    name: 'Body',
    nameGe: 'სხეული',
    icon: '🚗',
    image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=120&q=70',
    subsections: [
      { id: 'bumper-fascia', name: 'Bumper & Fascia',        nameGe: 'ბამპერი და ფასცია',    icon: '🔲' },
      { id: 'body-panels',   name: 'Body Panels & Glass',    nameGe: 'კარკასი და შუშა',      icon: '🪟' },
    ],
  },

  // ── GROUP 11: CLOSURE COMPONENTS ───────────────────────────────────────────
  {
    id: 'closure',
    name: 'Closure Components',
    nameGe: 'კარები და სახურავები',
    icon: '🚪',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=120&q=70',
    subsections: [
      { id: 'hood-trunk',    name: 'Hood, Frunk & Trunk',        nameGe: 'კაპოტი, ფრანქი და ბაგაჟი', icon: '🔼' },
      { id: 'door-handles',  name: 'Exterior Door Handles',      nameGe: 'კარის სახელური',             icon: '🖐️' },
      { id: 'glass-reg',     name: 'Door Glass & Regulators',    nameGe: 'კარის შუშა',                 icon: '🪟' },
      { id: 'seals',         name: 'Seals & Weatherstrips',      nameGe: 'ბუჟები და სარეზინო',         icon: '🟤' },
    ],
  },

  // ── GROUP 12: EXTERIOR FITTINGS ────────────────────────────────────────────
  {
    id: 'ext-fit',
    name: 'Exterior Fittings',
    nameGe: 'გარე სამაგრები',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca2d04?w=120&q=70',
    subsections: [
      { id: 'ext-mirrors',   name: 'Exterior Mirrors',           nameGe: 'გარე სარკები',               icon: '🪞' },
      { id: 'ext-trim',      name: 'Exterior Trim & Spoilers',   nameGe: 'გარე გაფორმება',             icon: '🏎️' },
      { id: 'arch-liners',   name: 'Wheel Arch Liners & Undertray', nameGe: 'ეკრანები და ქვეტანი',    icon: '🛡️' },
      { id: 'badges',        name: 'Badges, Films & License Plates', nameGe: 'ბეიჯები და ნომრები',   icon: '🔖' },
    ],
  },

  // ── GROUP 13: SEATS ────────────────────────────────────────────────────────
  {
    id: 'seats',
    name: 'Seats',
    nameGe: 'სავარძლები',
    icon: '🪑',
    image: 'https://images.unsplash.com/photo-1547038577-da80abbc4f19?w=120&q=70',
    subsections: [
      { id: 'front-seats',   name: 'Front Seat Assemblies',      nameGe: 'წინა სავარძლები',            icon: '🪑' },
      { id: 'rear-seats',    name: 'Rear Seat Assemblies',       nameGe: 'უკანა სავარძლები',           icon: '🪑' },
      { id: 'seat-covers',   name: 'Seat Covers & Upholstery',   nameGe: 'სავარძლის საფარები',         icon: '🧵' },
    ],
  },

  // ── GROUP 14: INSTRUMENT PANEL ─────────────────────────────────────────────
  {
    id: 'inst-panel',
    name: 'Instrument Panel',
    nameGe: 'საჩვენებელი პანელი',
    icon: '🖥️',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=120&q=70',
    subsections: [
      { id: 'dash-console',  name: 'Dashboard & Center Console', nameGe: 'ტაბლო და კონსოლი',          icon: '📦' },
      { id: 'ip-trim',       name: 'Panel Trim & Décor',         nameGe: 'პანელის გაფორმება',          icon: '🪵' },
    ],
  },

  // ── GROUP 15: INTERIOR TRIM ────────────────────────────────────────────────
  {
    id: 'int-trim',
    name: 'Interior Trim',
    nameGe: 'ინტერიერი',
    icon: '🏠',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=70',
    subsections: [
      { id: 'door-panels',   name: 'Door Panels & Pillars',      nameGe: 'კარის პანელები',             icon: '🚪' },
      { id: 'headliner',     name: 'Headliner & Carpet',         nameGe: 'ჭერი და ხალიჩა',             icon: '🧶' },
      { id: 'floor-mats',    name: 'Floor Mats & Cargo Liners',  nameGe: 'სალონის ხალიჩები',           icon: '🧹' },
      { id: 'int-lighting',  name: 'Interior Lighting',          nameGe: 'სალონის განათება',           icon: '💡' },
    ],
  },

  // ── GROUP 16: HV BATTERY ───────────────────────────────────────────────────
  {
    id: 'hv-battery',
    name: 'HV Battery System',
    nameGe: 'HV ბატარეა',
    icon: '🔋',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=120&q=70',
    subsections: [
      { id: 'battery-pack',    name: 'Battery Pack & Modules',   nameGe: 'ბატარეის პაკეტი',           icon: '⚡' },
      { id: 'battery-protect', name: 'Battery Protection & Shields', nameGe: 'ბატარეის დაცვა',        icon: '🛡️' },
    ],
  },

  // ── GROUP 17: ELECTRICAL ───────────────────────────────────────────────────
  {
    id: 'electrical',
    name: 'Electrical',
    nameGe: 'ელექტრიკა',
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=120&q=70',
    subsections: [
      { id: 'charging',      name: 'Charge Port & Charging Equipment', nameGe: 'დამტენი სისტემა',     icon: '🔌' },
      { id: 'wiring',        name: 'Wiring Harnesses & Modules',  nameGe: 'გაყვანილობა',              icon: '🔧' },
    ],
  },

  // ── GROUP 18: THERMAL MANAGEMENT ──────────────────────────────────────────
  {
    id: 'thermal',
    name: 'Thermal Management',
    nameGe: 'სითბოს მართვა',
    icon: '🌡️',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=120&q=70',
    subsections: [
      { id: 'hvac-cabin',    name: 'Cabin HVAC & Filters',        nameGe: 'კაბინის კლიმატი',           icon: '❄️' },
      { id: 'coolant',       name: 'Coolant System & Pumps',      nameGe: 'გამაცივებელი სისტემა',      icon: '💧' },
    ],
  },

  // ── GROUP 19: SUSPENSION, STEERING & BRAKES ───────────────────────────────
  {
    id: 'susp-brakes',
    name: 'Suspension, Steering & Brakes',
    nameGe: 'საკიდი და მუხრუჭები',
    icon: '⚙️',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=120&q=70',
    subsections: [
      { id: 'front-susp',    name: 'Front Suspension',            nameGe: 'წინა საკიდი',                icon: '🔩' },
      { id: 'rear-susp',     name: 'Rear Suspension',             nameGe: 'უკანა საკიდი',               icon: '🔩' },
      { id: 'steering',      name: 'Steering',                    nameGe: 'საჭის სისტემა',              icon: '🎯' },
      { id: 'brakes',        name: 'Brakes',                      nameGe: 'მუხრუჭები',                  icon: '🛑' },
      { id: 'wheels',        name: 'Wheels & Tires',              nameGe: 'დისკები და საბურავები',       icon: '🛞' },
    ],
  },

  // ── GROUP 20: SAFETY & RESTRAINT ──────────────────────────────────────────
  {
    id: 'safety',
    name: 'Safety & Restraint',
    nameGe: 'უსაფრთხოება',
    icon: '🛡️',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=120&q=70',
    subsections: [
      { id: 'airbags',       name: 'Airbag System',               nameGe: 'ერთგული ბალიშები',           icon: '💨' },
      { id: 'seatbelts',     name: 'Seatbelts',                   nameGe: 'უსაფრთხოების სარტყელი',      icon: '🔒' },
    ],
  },

  // ── GROUP 21: INFOTAINMENT ─────────────────────────────────────────────────
  {
    id: 'infotainment',
    name: 'Infotainment',
    nameGe: 'ინფოტეინმენტი',
    icon: '📡',
    image: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=120&q=70',
    subsections: [
      { id: 'cameras',       name: 'Cameras & Sensors',           nameGe: 'კამერები და სენსორები',      icon: '📷' },
      { id: 'display',       name: 'Displays & Audio',            nameGe: 'ეკრანი და აუდიო',            icon: '🔊' },
      { id: 'autopilot',     name: 'Autopilot & FSD Hardware',    nameGe: 'ავტოპილოტი',                icon: '🤖' },
    ],
  },

  // ── DRIVETRAIN (extra) ─────────────────────────────────────────────────────
  {
    id: 'drivetrain',
    name: 'Drivetrain',
    nameGe: 'ამძრავი სისტემა',
    icon: '🔄',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=120&q=70',
    subsections: [
      { id: 'drive-units',   name: 'Drive Units & Motors',        nameGe: 'ამძრავი ბლოკი',             icon: '⚡' },
      { id: 'inverters',     name: 'Inverters & DC-DC',           nameGe: 'ინვერტორები',               icon: '🔧' },
    ],
  },
];
