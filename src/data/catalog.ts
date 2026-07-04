import { CatalogSection } from '../types';

export const CATALOG: CatalogSection[] = [
  // ── GROUP 10: BODY ─────────────────────────────────────────────────────────
  {
    id: 'body', groupNumber: 10,
    name: 'Body', nameGe: 'ძარა',
    icon: '🚗',
    image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=400&q=70',
    subsections: [
      { id: 'bumper-fascia', name: 'Bumper & Fascia',        nameGe: 'ბამპერი და ფასცია',    icon: '🔲' },
      { id: 'body-panels',   name: 'Body Panels & Glass',    nameGe: 'კარკასი და შუშა',      icon: '🪟' },
    ],
  },

  // ── GROUP 11: CLOSURE COMPONENTS ───────────────────────────────────────────
  {
    id: 'closure', groupNumber: 11,
    name: 'Closure Components', nameGe: 'კარები და სახურავები',
    icon: '🚪',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=70',
    subsections: [
      { id: 'hood-trunk',   name: 'Hood, Frunk & Trunk',        nameGe: 'კაპოტი, ფრანქი და ბაგაჟი', icon: '🔼' },
      { id: 'door-handles', name: 'Exterior Door Handles',      nameGe: 'კარის სახელური',             icon: '🖐️' },
      { id: 'glass-reg',    name: 'Door Glass & Regulators',    nameGe: 'კარის შუშა',                 icon: '🪟' },
      { id: 'seals',        name: 'Seals & Weatherstrips',      nameGe: 'ბუჟები და სარეზინო',         icon: '🟤' },
    ],
  },

  // ── GROUP 12: EXTERIOR FITTINGS ────────────────────────────────────────────
  {
    id: 'ext-fit', groupNumber: 12,
    name: 'Exterior Fittings', nameGe: 'გარე სამაგრები',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca2d04?w=400&q=70',
    subsections: [
      { id: 'ext-mirrors',  name: 'Exterior Mirrors',                nameGe: 'გარე სარკები',           icon: '🪞' },
      { id: 'ext-trim',     name: 'Exterior Trim & Spoilers',        nameGe: 'გარე გაფორმება',         icon: '🏎️' },
      { id: 'arch-liners',  name: 'Wheel Arch Liners & Undertray',   nameGe: 'ეკრანები და ქვეტანი',   icon: '🛡️' },
      { id: 'badges',       name: 'Badges, Films & License Plates',  nameGe: 'ბეიჯები და ნომრები',    icon: '🔖' },
    ],
  },

  // ── GROUP 13: SEATS ────────────────────────────────────────────────────────
  {
    id: 'seats', groupNumber: 13,
    name: 'Seats', nameGe: 'სავარძლები',
    icon: '🪑',
    image: 'https://images.unsplash.com/photo-1547038577-da80abbc4f19?w=400&q=70',
    subsections: [
      { id: 'front-seats',  name: 'Front Seat Assemblies',    nameGe: 'წინა სავარძლები',      icon: '🪑' },
      { id: 'rear-seats',   name: 'Rear Seat Assemblies',     nameGe: 'უკანა სავარძლები',     icon: '🪑' },
      { id: 'seat-covers',  name: 'Seat Covers & Upholstery', nameGe: 'სავარძლის საფარები',   icon: '🧵' },
    ],
  },

  // ── GROUP 14: INSTRUMENT PANEL ─────────────────────────────────────────────
  {
    id: 'inst-panel', groupNumber: 14,
    name: 'Instrument Panel', nameGe: 'საჩვენებელი პანელი',
    icon: '🖥️',
    image: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?w=400&q=70',
    subsections: [
      { id: 'dash-console', name: 'Dashboard & Center Console', nameGe: 'ტაბლო და კონსოლი',  icon: '📦' },
      { id: 'ip-trim',      name: 'Panel Trim & Décor',         nameGe: 'პანელის გაფორმება',  icon: '🪵' },
    ],
  },

  // ── GROUP 15: INTERIOR TRIM ────────────────────────────────────────────────
  {
    id: 'int-trim', groupNumber: 15,
    name: 'Interior Trim', nameGe: 'ინტერიერი',
    icon: '🏠',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70',
    subsections: [
      { id: 'door-panels',  name: 'Door Panels & Pillars',     nameGe: 'კარის პანელები',       icon: '🚪' },
      { id: 'headliner',    name: 'Headliner & Carpet',        nameGe: 'ჭერი და ხალიჩა',       icon: '🧶' },
      { id: 'floor-mats',   name: 'Floor Mats & Cargo Liners', nameGe: 'სალონის ხალიჩები',     icon: '🧹' },
      { id: 'int-lighting', name: 'Interior Lighting',         nameGe: 'სალონის განათება',     icon: '💡' },
    ],
  },

  // ── GROUP 16: HV BATTERY SYSTEM ────────────────────────────────────────────
  {
    id: 'hv-battery', groupNumber: 16,
    name: 'HV Battery System', nameGe: 'HV ბატარეის სისტემა',
    icon: '🔋',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=70',
    subsections: [
      { id: 'battery-pack',    name: 'Battery Pack & Modules',      nameGe: 'ბატარეის პაკეტი',  icon: '⚡' },
      { id: 'battery-protect', name: 'Battery Protection & Shields', nameGe: 'ბატარეის დაცვა',  icon: '🛡️' },
    ],
  },

  // ── GROUP 17: ELECTRICAL ───────────────────────────────────────────────────
  {
    id: 'electrical', groupNumber: 17,
    name: 'Electrical', nameGe: 'ელექტრიკა',
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=400&q=70',
    subsections: [
      { id: 'wiring',     name: 'Wiring Harnesses & Modules', nameGe: 'გაყვანილობა',        icon: '🔧' },
      { id: 'lv-battery', name: '12V Battery & Power Supply', nameGe: '12V კვების სისტემა', icon: '🔋' },
    ],
  },

  // ── GROUP 18: THERMAL MANAGEMENT ──────────────────────────────────────────
  {
    id: 'thermal', groupNumber: 18,
    name: 'Thermal Management', nameGe: 'თერმული მართვა',
    icon: '🌡️',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&q=70',
    subsections: [
      { id: 'hvac-cabin', name: 'Cabin HVAC & Filters',   nameGe: 'კაბინის კლიმატი',        icon: '❄️' },
      { id: 'coolant',    name: 'Coolant System & Pumps', nameGe: 'გამაცივებელი სისტემა',   icon: '💧' },
    ],
  },

  // ── GROUP 19: LABELS ──────────────────────────────────────────────────────
  {
    id: 'labels', groupNumber: 19,
    name: 'Labels', nameGe: 'ეტიკეტები',
    icon: '🏷️',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca2d04?w=400&q=70',
    subsections: [
      { id: 'labels-decals', name: 'Labels & Decals', nameGe: 'ეტიკეტები და სტიკერები', icon: '🏷️' },
    ],
  },

  // ── GROUP 20: SAFETY AND RESTRAINT ────────────────────────────────────────
  {
    id: 'safety', groupNumber: 20,
    name: 'Safety and Restraint', nameGe: 'უსაფრთხოება',
    icon: '🛡️',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=70',
    subsections: [
      { id: 'airbags',   name: 'Airbag System', nameGe: 'უსაფრთხოების ბალიშები',    icon: '💨' },
      { id: 'seatbelts', name: 'Seatbelts',     nameGe: 'უსაფრთხოების სარტყელი',    icon: '🔒' },
    ],
  },

  // ── GROUP 21: INFOTAINMENT ─────────────────────────────────────────────────
  {
    id: 'infotainment', groupNumber: 21,
    name: 'Infotainment', nameGe: 'ინფოტეინმენტი',
    icon: '📡',
    image: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=400&q=70',
    subsections: [
      { id: 'cameras',   name: 'Cameras & Sensors',        nameGe: 'კამერები და სენსორები', icon: '📷' },
      { id: 'display',   name: 'Displays & Audio',          nameGe: 'ეკრანი და აუდიო',       icon: '🔊' },
      { id: 'autopilot', name: 'Autopilot & FSD Hardware',  nameGe: 'ავტოპილოტი',            icon: '🤖' },
    ],
  },

  // ── GROUP 24: ROOF ────────────────────────────────────────────────────────
  {
    id: 'roof', groupNumber: 24,
    name: 'Roof', nameGe: 'სახურავი',
    icon: '🌤️',
    image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=400&q=70',
    subsections: [
      { id: 'glass-roof', name: 'Glass Roof & Sunroof', nameGe: 'მინის სახურავი',        icon: '🪟' },
      { id: 'roof-trim',  name: 'Roof Trim & Rails',    nameGe: 'სახურავის გაფორმება',   icon: '📐' },
    ],
  },

  // ── GROUP 30: CHASSIS ─────────────────────────────────────────────────────
  {
    id: 'chassis', groupNumber: 30,
    name: 'Chassis', nameGe: 'შასი',
    icon: '🔩',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=70',
    subsections: [
      { id: 'subframes', name: 'Subframes & Crossmembers', nameGe: 'სუბჩარჩოები', icon: '🔩' },
    ],
  },

  // ── GROUP 31: SUSPENSION ──────────────────────────────────────────────────
  {
    id: 'suspension', groupNumber: 31,
    name: 'Suspension', nameGe: 'საკიდი',
    icon: '⚙️',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=70',
    subsections: [
      { id: 'front-susp', name: 'Front Suspension', nameGe: 'წინა საკიდი',  icon: '🔩' },
      { id: 'rear-susp',  name: 'Rear Suspension',  nameGe: 'უკანა საკიდი', icon: '🔩' },
    ],
  },

  // ── GROUP 32: STEERING ────────────────────────────────────────────────────
  {
    id: 'steering', groupNumber: 32,
    name: 'Steering', nameGe: 'საჭის სისტემა',
    icon: '🎯',
    image: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?w=400&q=70',
    subsections: [
      { id: 'steering-rack',  name: 'Steering Rack & Column',     nameGe: 'საჭის რეიკა და სვეტი', icon: '🔧' },
      { id: 'steering-wheel', name: 'Steering Wheels & Controls', nameGe: 'საჭეები და მართვა',    icon: '🎯' },
    ],
  },

  // ── GROUP 33: BRAKES ──────────────────────────────────────────────────────
  {
    id: 'brakes-sys', groupNumber: 33,
    name: 'Brakes', nameGe: 'მუხრუჭები',
    icon: '🛑',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=70',
    subsections: [
      { id: 'brakes', name: 'Brake Pads, Discs & Calipers', nameGe: 'ხუნდები, დისკები, სუპორტები', icon: '🛑' },
    ],
  },

  // ── GROUP 34: WHEELS AND TIRES ────────────────────────────────────────────
  {
    id: 'wheels-tires', groupNumber: 34,
    name: 'Wheels and Tires', nameGe: 'დისკები და საბურავები',
    icon: '🛞',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=70',
    subsections: [
      { id: 'wheels', name: 'Wheels & Tires', nameGe: 'დისკები და საბურავები', icon: '🛞' },
      { id: 'tpms',   name: 'TPMS Sensors',   nameGe: 'TPMS სენსორები',        icon: '📶' },
    ],
  },

  // ── GROUP 39: FRONT DRIVE UNIT ────────────────────────────────────────────
  {
    id: 'front-drive', groupNumber: 39,
    name: 'Front Drive Unit', nameGe: 'წინა ამძრავი',
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=70',
    subsections: [
      { id: 'drive-units', name: 'Front Drive Unit & Mounts', nameGe: 'წინა ამძრავი ბლოკი', icon: '⚡' },
    ],
  },

  // ── GROUP 40: REAR DRIVE UNIT ─────────────────────────────────────────────
  {
    id: 'rear-drive', groupNumber: 40,
    name: 'Rear Drive Unit', nameGe: 'უკანა ამძრავი',
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=70',
    subsections: [
      { id: 'rear-drive-unit', name: 'Rear Drive Unit & Mounts', nameGe: 'უკანა ამძრავი ბლოკი', icon: '⚡' },
    ],
  },

  // ── GROUP 44: HIGH VOLTAGE SYSTEM ─────────────────────────────────────────
  {
    id: 'hv-system', groupNumber: 44,
    name: 'High Voltage System', nameGe: 'მაღალი ძაბვის სისტემა',
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=70',
    subsections: [
      { id: 'inverters',   name: 'Inverters & DC-DC',        nameGe: 'ინვერტორები',              icon: '🔧' },
      { id: 'hv-cables',   name: 'HV Cables & Connectors',   nameGe: 'მაღალი ძაბვის კაბელები',   icon: '🔌' },
      { id: 'charge-port', name: 'Charge Port',              nameGe: 'დამტენი პორტი',            icon: '🔋' },
    ],
  },

  // ── GROUP 50: EXTERNAL CHARGING CONNECTORS ────────────────────────────────
  {
    id: 'ext-charging', groupNumber: 50,
    name: 'External Charging Connectors', nameGe: 'გარე დამტენი კონექტორები',
    icon: '🔌',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&q=70',
    subsections: [
      { id: 'charging', name: 'Wall & Mobile Connectors, Adapters', nameGe: 'დამტენები და ადაპტერები', icon: '🔌' },
    ],
  },

  // ── GROUP 60: OWNER INFORMATION ───────────────────────────────────────────
  {
    id: 'owner-info', groupNumber: 60,
    name: 'Owner Information', nameGe: 'მფლობელის ინფორმაცია',
    icon: '📖',
    image: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?w=400&q=70',
    subsections: [
      { id: 'owner-docs', name: 'Manuals & Documentation', nameGe: 'ინსტრუქციები და დოკუმენტები', icon: '📖' },
    ],
  },
];
