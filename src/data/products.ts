import { Product } from '../types';

const IMG = {
  body:     'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=600&q=80',
  interior: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80',
  brakes:   'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80',
  wheels:   'https://images.unsplash.com/photo-1558618047-3c8c76ca2d04?w=600&q=80',
  charging: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&q=80',
  cargo:    'https://images.unsplash.com/photo-1547038577-da80abbc4f19?w=600&q=80',
  camera:   'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=600&q=80',
  susp:     'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80',
  filter:   'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&q=80',
  mats:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
};

export const products: Product[] = [
  // ── BODY › FRONT BUMPER ─────────────────────────────────────────────────
  {
    id: 'b-f01', partNumber: '1494822-00-F',
    name: 'Front Bumper Cover', nameGe: 'წინა ბამპერის საფარი',
    sectionId: 'body', subsectionId: 'body-front',
    price: 1850, currency: 'GEL', image: IMG.body,
    description: 'OEM-spec front bumper cover. Supplied primed, ready for paint. Includes all mounting clips.',
    fits: { M3: { from: 2017, to: 2022 }, MY: { from: 2020, to: 2023 } },
    inStock: true, badge: 'popular', rating: 4.8, reviews: 67,
  },
  {
    id: 'b-f02', partNumber: '1494822-00-G',
    name: 'Front Bumper Cover (2023+)', nameGe: 'წინა ბამპერი (2023+)',
    sectionId: 'body', subsectionId: 'body-front',
    price: 1980, currency: 'GEL', image: IMG.body,
    description: 'Updated front bumper for Highland Model 3 facelift. Primed for paint.',
    fits: { M3: { from: 2023, to: 2024 } },
    inStock: true, badge: 'new', rating: 4.9, reviews: 14,
  },
  {
    id: 'b-f03', partNumber: '1059780-00-C',
    name: 'Fog Light Bezel Set', nameGe: 'სამანათო ბეზელი',
    sectionId: 'body', subsectionId: 'body-front',
    price: 290, currency: 'GEL', image: IMG.body,
    description: 'Pair of left and right fog light bezels. Direct OEM replacement, no modification needed.',
    fits: { M3: { from: 2017, to: 2022 }, MY: { from: 2020, to: 2023 }, MS: { from: 2021, to: 2024 }, MX: { from: 2021, to: 2024 } },
    inStock: true, rating: 4.6, reviews: 41,
  },
  {
    id: 'b-f04', partNumber: '1125398-00-B',
    name: 'License Plate Bracket — Front', nameGe: 'ნომრის ჩარჩო — წინა',
    sectionId: 'body', subsectionId: 'body-front',
    price: 95, currency: 'GEL', image: IMG.body,
    description: 'Front license plate bracket with all hardware. Snaps into existing bumper holes.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2012, to: 2024 }, MX: { from: 2015, to: 2024 } },
    inStock: true, rating: 4.5, reviews: 128,
  },

  // ── BODY › HOOD & FRUNK ─────────────────────────────────────────────────
  {
    id: 'b-h01', partNumber: '1515718-00-A',
    name: 'Hood Latch Assembly', nameGe: 'კაპოტის საკეტი',
    sectionId: 'body', subsectionId: 'body-hood',
    price: 340, currency: 'GEL', image: IMG.body,
    description: 'Replacement hood latch with striker. Restores proper hood engagement and pop-up function.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 53,
  },
  {
    id: 'b-h02', partNumber: '1059831-00-D',
    name: 'Frunk Liner', nameGe: 'წინა საბარგულის საფარი',
    sectionId: 'body', subsectionId: 'body-hood',
    price: 215, currency: 'GEL', image: IMG.cargo,
    description: 'Molded plastic frunk liner with felt surface. Protects the frunk floor and improves water drainage.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 89,
  },
  {
    id: 'b-h03', partNumber: '6008309-00-A',
    name: 'Hood Strut Set (2 pcs)', nameGe: 'კაპოტის ამძრავები (2 ც.)',
    sectionId: 'body', subsectionId: 'body-hood',
    price: 175, currency: 'GEL', image: IMG.body,
    description: 'Pair of front hood gas struts. Keeps hood open securely. Replaces weak OEM struts.',
    fits: { MS: { from: 2012, to: 2020 }, MX: { from: 2015, to: 2020 } },
    inStock: true, rating: 4.6, reviews: 37,
  },

  // ── BODY › DOORS & HANDLES ──────────────────────────────────────────────
  {
    id: 'b-d01', partNumber: '1109631-00-E',
    name: 'Exterior Door Handle', nameGe: 'გარე კარის სახელური',
    sectionId: 'body', subsectionId: 'body-doors',
    price: 385, currency: 'GEL', image: IMG.body,
    description: 'Single door handle with button micro-switch. Primed for paint. Specify left/right in order notes.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.9, reviews: 201,
  },
  {
    id: 'b-d02', partNumber: '1109632-00-D',
    name: 'Door Weatherstrip Seal', nameGe: 'კარის სარეზინო',
    sectionId: 'body', subsectionId: 'body-doors',
    price: 165, currency: 'GEL', image: IMG.body,
    description: 'Full-length door perimeter seal. Eliminates wind noise and water ingress.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2016, to: 2024 }, MX: { from: 2016, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 156,
  },
  {
    id: 'b-d03', partNumber: '1550827-00-A',
    name: 'Falcon Door Seal Kit (MX)', nameGe: 'ფალკონ კარის სარეზინო',
    sectionId: 'body', subsectionId: 'body-doors',
    price: 890, currency: 'GEL', image: IMG.body,
    description: 'Complete seal kit for Model X Falcon Wing doors. Stops water intrusion, reduces road noise. Set of 4.',
    fits: { MX: { from: 2015, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 44,
  },

  // ── BODY › REAR BUMPER & TRUNK ──────────────────────────────────────────
  {
    id: 'b-r01', partNumber: '1494856-00-E',
    name: 'Rear Bumper Cover', nameGe: 'უკანა ბამპერის საფარი',
    sectionId: 'body', subsectionId: 'body-rear',
    price: 1650, currency: 'GEL', image: IMG.body,
    description: 'Rear bumper cover, primed. Includes diffuser cutouts and sensor grommets.',
    fits: { M3: { from: 2017, to: 2022 }, MY: { from: 2020, to: 2023 } },
    inStock: true, rating: 4.7, reviews: 48,
  },
  {
    id: 'b-r02', partNumber: '1059773-00-G',
    name: 'Trunk Lid Seal', nameGe: 'ბაგაჟნიკის სარეზინო',
    sectionId: 'body', subsectionId: 'body-rear',
    price: 145, currency: 'GEL', image: IMG.body,
    description: 'Rubber trunk perimeter seal. Eliminates rattles and prevents water ingress.',
    fits: { M3: { from: 2017, to: 2024 }, MS: { from: 2012, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 93,
  },

  // ── BODY › MIRRORS ──────────────────────────────────────────────────────
  {
    id: 'b-m01', partNumber: '1059794-00-F',
    name: 'Side Mirror Glass (Heated)', nameGe: 'სარკის შუშა (გათბობით)',
    sectionId: 'body', subsectionId: 'body-mirrors',
    price: 195, currency: 'GEL', image: IMG.body,
    description: 'Heated side mirror glass replacement. Convex, auto-dimming. Specify left or right in notes.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2016, to: 2024 }, MX: { from: 2016, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 77,
  },
  {
    id: 'b-m02', partNumber: '1059795-00-D',
    name: 'Mirror Housing Cap (Gloss Black)', nameGe: 'სარკის კორპუსი (შავი)',
    sectionId: 'body', subsectionId: 'body-mirrors',
    price: 275, currency: 'GEL', image: IMG.body,
    description: 'Gloss black painted mirror housing cap. Popular visual upgrade.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, badge: 'sale', rating: 4.6, reviews: 112,
  },

  // ── BODY › ROOF & SPOILERS ──────────────────────────────────────────────
  {
    id: 'b-rs01', partNumber: '1015601-00-B',
    name: 'Carbon Fiber Rear Spoiler', nameGe: 'კარბონის სპოილერი',
    sectionId: 'body', subsectionId: 'body-roof',
    price: 1290, currency: 'GEL', image: IMG.body,
    description: 'Real carbon fiber trunk spoiler. Reduces drag by ~12%. Pre-drilled mounting. Tape-on or bolt-on install.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.9, reviews: 124,
  },

  // ── INTERIOR › DASHBOARD ─────────────────────────────────────────────────
  {
    id: 'i-d01', partNumber: '1550884-00-B',
    name: 'Main Screen Protector (Matte)', nameGe: 'ეკრანის დამცავი',
    sectionId: 'interior', subsectionId: 'int-dash',
    price: 125, currency: 'GEL', image: IMG.interior,
    description: 'Anti-glare matte tempered glass protector for the 15.4" center display. 9H hardness, oleophobic coating.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.8, reviews: 389,
  },
  {
    id: 'i-d02', partNumber: '1550885-00-A',
    name: 'Dashboard Sunshade', nameGe: 'დეშბორდის მზის ფარი',
    sectionId: 'interior', subsectionId: 'int-dash',
    price: 180, currency: 'GEL', image: IMG.interior,
    description: 'Custom-fit dashboard sunshade. Reduces cabin temperature by up to 15°C when parked.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 145,
  },
  {
    id: 'i-d03', partNumber: '1059893-00-C',
    name: 'Interior Wood Trim Panel Set', nameGe: 'ხის ინტერიერის პანელები',
    sectionId: 'interior', subsectionId: 'int-dash',
    price: 680, currency: 'GEL', image: IMG.interior,
    description: 'Real walnut dashboard and door trim panel set. OEM replacement. Set of 5 pieces.',
    fits: { MS: { from: 2016, to: 2021 }, MX: { from: 2016, to: 2021 } },
    inStock: false, rating: 4.9, reviews: 28,
  },

  // ── INTERIOR › CENTER CONSOLE ───────────────────────────────────────────
  {
    id: 'i-c01', partNumber: '1550795-00-A',
    name: 'Center Console Organizer Tray', nameGe: 'კონსოლის ორგანაიზერი',
    sectionId: 'interior', subsectionId: 'int-console',
    price: 145, currency: 'GEL', image: IMG.interior,
    description: 'Drop-in ABS organizer tray with alcantara-lined compartments. Perfect fit in Model 3/Y console bin.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.8, reviews: 445,
  },
  {
    id: 'i-c02', partNumber: '1115595-00-B',
    name: 'Wireless Charger Pad (15W Dual)', nameGe: 'უკაბელო დამტენი პადი',
    sectionId: 'interior', subsectionId: 'int-console',
    price: 380, currency: 'GEL', image: IMG.interior,
    description: '15W dual Qi wireless charger pad. Drop-in fit for Model 3/Y console. MagSafe-compatible.',
    fits: { M3: { from: 2021, to: 2024 }, MY: { from: 2021, to: 2024 } },
    inStock: true, badge: 'new', rating: 4.7, reviews: 198,
  },
  {
    id: 'i-c03', partNumber: '1079658-00-C',
    name: 'Console Armrest Lid (Black Leather)', nameGe: 'კონსოლის სახურავი',
    sectionId: 'interior', subsectionId: 'int-console',
    price: 220, currency: 'GEL', image: IMG.interior,
    description: 'Replacement console lid in black leather. Fixes worn, cracked, or sticky OEM lid.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.6, reviews: 167,
  },

  // ── INTERIOR › SEATS ────────────────────────────────────────────────────
  {
    id: 'i-s01', partNumber: '1550742-00-A',
    name: 'Front Seat Cover Set (Vegan Leather)', nameGe: 'სავარძლის საფარი — წინა',
    sectionId: 'interior', subsectionId: 'int-seats',
    price: 590, currency: 'GEL', image: IMG.interior,
    description: 'Precision-fit vegan leather front seat covers. Airbag-safe side seams. Protects OEM upholstery.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 234,
  },
  {
    id: 'i-s02', partNumber: '1550743-00-A',
    name: 'Rear Seat Cover Set', nameGe: 'სავარძლის საფარი — უკანა',
    sectionId: 'interior', subsectionId: 'int-seats',
    price: 420, currency: 'GEL', image: IMG.interior,
    description: 'Rear bench and backrest cover in vegan leather. Protects against wear and spills.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 189,
  },

  // ── INTERIOR › FLOOR & CARGO ────────────────────────────────────────────
  {
    id: 'i-f01', partNumber: '1550762-00-C',
    name: 'All-Weather Floor Mat Set (5-pc)', nameGe: 'ყველა-ამინდო საფარები (5 ც.)',
    sectionId: 'interior', subsectionId: 'int-floor',
    price: 380, currency: 'GEL', image: IMG.mats,
    description: 'Custom-fit TPE all-weather mats for front, rear, and trunk. 1.5 cm raised lip, waterproof, odorless.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2016, to: 2024 }, MX: { from: 2016, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.9, reviews: 312,
  },
  {
    id: 'i-f02', partNumber: '1550763-00-A',
    name: 'Cargo Mat — Trunk', nameGe: 'ბაგაჟნიკის საფარი',
    sectionId: 'interior', subsectionId: 'int-floor',
    price: 185, currency: 'GEL', image: IMG.cargo,
    description: 'Waterproof molded rubber trunk mat. Precise subwoofer cutout. Protects trunk floor.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 204,
  },
  {
    id: 'i-f03', partNumber: '1079721-00-B',
    name: 'Trunk Cargo Net', nameGe: 'ბარგის ბადე',
    sectionId: 'interior', subsectionId: 'int-floor',
    price: 85, currency: 'GEL', image: IMG.cargo,
    description: 'Elastic cargo net prevents items from sliding. Hooks to trunk anchor points.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2016, to: 2024 } },
    inStock: true, badge: 'sale', rating: 4.5, reviews: 178,
  },
  {
    id: 'i-f04', partNumber: '1551410-00-A',
    name: 'Frunk Organizer Bag', nameGe: 'წინა საბარგულის ჩანთა',
    sectionId: 'interior', subsectionId: 'int-floor',
    price: 195, currency: 'GEL', image: IMG.cargo,
    description: 'Custom organizer for the front trunk. Multiple zippered compartments, waterproof base.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: false, rating: 4.7, reviews: 134,
  },

  // ── INTERIOR › LIGHTING ──────────────────────────────────────────────────
  {
    id: 'i-l01', partNumber: '1059812-00-A',
    name: 'Ambient LED Light Strip Kit', nameGe: 'ამბიენტ LED სინათლე',
    sectionId: 'interior', subsectionId: 'int-lighting',
    price: 240, currency: 'GEL', image: IMG.interior,
    description: 'RGB LED ambient lighting with app control. Fits under dashboard and door panels. 16M colors.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, badge: 'new', rating: 4.6, reviews: 97,
  },

  // ── CHASSIS › BRAKES ─────────────────────────────────────────────────────
  {
    id: 'c-b01', partNumber: '1044059-00-D',
    name: 'Front Brake Pads', nameGe: 'წინა სამუხრუჭე ბალიშები',
    sectionId: 'chassis', subsectionId: 'ch-brakes',
    price: 420, currency: 'GEL', image: IMG.brakes,
    description: 'OEM-grade front brake pads. Higher thermal threshold, low-dust formula. Fits standard trims.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.8, reviews: 189,
  },
  {
    id: 'c-b02', partNumber: '1044060-00-D',
    name: 'Rear Brake Pads', nameGe: 'უკანა სამუხრუჭე ბალიშები',
    sectionId: 'chassis', subsectionId: 'ch-brakes',
    price: 380, currency: 'GEL', image: IMG.brakes,
    description: 'OEM-spec rear brake pads. Compatible with the integrated electric parking brake motor.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2016, to: 2024 }, MX: { from: 2016, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 143,
  },
  {
    id: 'c-b03', partNumber: '1044061-00-B',
    name: 'Performance Front Brake Pads', nameGe: 'სპორტ-სამუხრუჭე (წინა)',
    sectionId: 'chassis', subsectionId: 'ch-brakes',
    price: 620, currency: 'GEL', image: IMG.brakes,
    description: 'Track-grade front pads for Performance models. Excellent fade resistance up to 650°C.',
    fits: { M3: { from: 2018, to: 2024 }, MY: { from: 2021, to: 2024 }, MS: { from: 2021, to: 2024 } },
    inStock: true, rating: 4.9, reviews: 89,
  },
  {
    id: 'c-b04', partNumber: '6012034-00-A',
    name: 'Front Brake Rotor', nameGe: 'წინა სამუხრუჭე დისკი',
    sectionId: 'chassis', subsectionId: 'ch-brakes',
    price: 540, currency: 'GEL', image: IMG.brakes,
    description: 'Slotted and cross-drilled front rotor. 320 mm diameter for standard M3/MY. Sold individually.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 62,
  },

  // ── CHASSIS › SUSPENSION ─────────────────────────────────────────────────
  {
    id: 'c-s01', partNumber: '1044089-00-C',
    name: 'Front Sway Bar End Links', nameGe: 'საბალანსო ბარის ბმები',
    sectionId: 'chassis', subsectionId: 'ch-front-susp',
    price: 285, currency: 'GEL', image: IMG.susp,
    description: 'Upgraded polyurethane sway bar end links. Eliminates clunking, improves cornering.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 54,
  },
  {
    id: 'c-s02', partNumber: '1044091-00-B',
    name: 'Front Wheel Bearing Hub', nameGe: 'წინა თვლის საკისარი',
    sectionId: 'chassis', subsectionId: 'ch-front-susp',
    price: 485, currency: 'GEL', image: IMG.susp,
    description: 'Front wheel bearing and hub assembly. Resolves rumbling noises at speed. Plug-and-play.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2016, to: 2024 }, MX: { from: 2016, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.8, reviews: 103,
  },
  {
    id: 'c-s03', partNumber: '1044095-00-A',
    name: 'Rear Shock Mount', nameGe: 'უკანა ამორტიზატორის სადგამი',
    sectionId: 'chassis', subsectionId: 'ch-rear-susp',
    price: 320, currency: 'GEL', image: IMG.susp,
    description: 'Rear shock absorber upper mount. Resolves clunking over bumps. Includes bump stop.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.6, reviews: 38,
  },

  // ── CHASSIS › WHEELS ────────────────────────────────────────────────────
  {
    id: 'c-w01', partNumber: '1050000-00-E',
    name: 'Aero Wheel Cover Set 18" (4 pcs)', nameGe: 'აერო საფარი 18" (4 ც.)',
    sectionId: 'chassis', subsectionId: 'ch-wheels',
    price: 480, currency: 'GEL', image: IMG.wheels,
    description: 'OEM aero wheel covers. Snap-on fit, improves range by ~3%. Set of 4.',
    fits: { M3: { from: 2017, to: 2024 } },
    inStock: true, badge: 'sale', rating: 4.6, reviews: 201,
  },
  {
    id: 'c-w02', partNumber: '1051000-00-B',
    name: 'Forged 21" Sport Wheels (Set of 4)', nameGe: 'ნაჭედი 21" დისკები',
    sectionId: 'chassis', subsectionId: 'ch-wheels',
    price: 3800, currency: 'GEL', image: IMG.wheels,
    description: 'Lightweight forged 21" alloy wheels. 15% lighter than OEM cast. Satin Black. Set of 4 with caps.',
    fits: { MS: { from: 2021, to: 2024 }, MX: { from: 2021, to: 2024 } },
    inStock: true, badge: 'new', rating: 4.9, reviews: 34,
  },
  {
    id: 'c-w03', partNumber: '1050001-00-A',
    name: 'Wheel Center Cap Set (4 pcs)', nameGe: 'ცენტრალური სახელგები',
    sectionId: 'chassis', subsectionId: 'ch-wheels',
    price: 95, currency: 'GEL', image: IMG.wheels,
    description: 'OEM Tesla "T" center cap set for 18"–21" wheels.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2012, to: 2024 }, MX: { from: 2015, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 445,
  },
  {
    id: 'c-w04', partNumber: '1034602-00-B',
    name: 'Lug Nut Set M14×1.5 (20 pcs)', nameGe: 'თვლის თხილები M14 (20 ც.)',
    sectionId: 'chassis', subsectionId: 'ch-wheels',
    price: 145, currency: 'GEL', image: IMG.wheels,
    description: 'Black anodized M14×1.5 lug nuts. Set of 20 with socket adapter. Torque to 175 Nm.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2012, to: 2024 }, MX: { from: 2015, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 267,
  },

  // ── CHARGING ─────────────────────────────────────────────────────────────
  {
    id: 'chg-01', partNumber: '1457252-00-E',
    name: 'Wall Connector Gen 3 (11.5 kW)', nameGe: 'კედლის კონექტორი Gen 3',
    sectionId: 'charging', subsectionId: 'chg-home',
    price: 890, currency: 'GEL', image: IMG.charging,
    description: 'Tesla Wall Connector Gen 3. Adds up to 75 km range/hr. Wi-Fi enabled. 7.3 m cable.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2012, to: 2024 }, MX: { from: 2015, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.9, reviews: 567,
  },
  {
    id: 'chg-02', partNumber: '1457253-00-B',
    name: 'Mobile Connector Gen 2', nameGe: 'მობილური კონექტორი Gen 2',
    sectionId: 'charging', subsectionId: 'chg-mobile',
    price: 420, currency: 'GEL', image: IMG.charging,
    description: 'Portable Tesla Mobile Connector with 7.3 m cable. Up to 12A on a standard outlet.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2012, to: 2024 }, MX: { from: 2015, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 389,
  },
  {
    id: 'chg-03', partNumber: '1462857-00-A',
    name: 'EU Schuko Adapter', nameGe: 'EU შუკო ადაპტერი',
    sectionId: 'charging', subsectionId: 'chg-adapters',
    price: 145, currency: 'GEL', image: IMG.charging,
    description: 'EU Type F (Schuko) adapter for the Tesla Mobile Connector. Up to 8A / 1.8 kW.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2012, to: 2024 }, MX: { from: 2015, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 234,
  },
  {
    id: 'chg-04', partNumber: '1462858-00-A',
    name: 'Type 2 (IEC 62196) Adapter', nameGe: 'Type 2 ადაპტერი',
    sectionId: 'charging', subsectionId: 'chg-adapters',
    price: 320, currency: 'GEL', image: IMG.charging,
    description: 'Type 2 adapter for public AC stations. Charges up to 16A.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2012, to: 2024 }, MX: { from: 2015, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 178,
  },

  // ── POWERTRAIN ───────────────────────────────────────────────────────────
  {
    id: 'pt-01', partNumber: '1047989-00-B',
    name: 'Underbody Aero Shield', nameGe: 'ქვედა სამსხვრევი ფარი',
    sectionId: 'powertrain', subsectionId: 'pt-battery',
    price: 520, currency: 'GEL', image: IMG.body,
    description: 'Front underbody aero shield / belly pan. Protects battery from road debris. OEM replacement.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 58,
  },
  {
    id: 'pt-02', partNumber: '1044322-00-A',
    name: 'Drive Unit Mount Bush Set', nameGe: 'ძრავის სადგამის ბუქსები',
    sectionId: 'powertrain', subsectionId: 'pt-motor',
    price: 245, currency: 'GEL', image: IMG.susp,
    description: 'Polyurethane drive unit mounting bushings. Eliminates drivetrain clunk, reduces NVH.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2021, to: 2024 } },
    inStock: true, rating: 4.6, reviews: 42,
  },

  // ── HVAC ─────────────────────────────────────────────────────────────────
  {
    id: 'hv-01', partNumber: '1550627-00-B',
    name: 'Cabin Air Filter', nameGe: 'კაბინის ჰაერის ფილტრი',
    sectionId: 'hvac', subsectionId: 'hvac-filters',
    price: 95, currency: 'GEL', image: IMG.filter,
    description: 'Replacement cabin air filter. Filters pollen, dust, bacteria. Replace every 2 years / 40,000 km.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, badge: 'popular', rating: 4.8, reviews: 512,
  },
  {
    id: 'hv-02', partNumber: '1550628-00-A',
    name: 'HEPA + Activated Carbon Filter', nameGe: 'HEPA + ნახშირის ფილტრი',
    sectionId: 'hvac', subsectionId: 'hvac-filters',
    price: 245, currency: 'GEL', image: IMG.filter,
    description: 'Premium HEPA filter removes 99.97% of particles ≥0.3µm. Activated carbon eliminates gases and odors.',
    fits: { MS: { from: 2017, to: 2024 }, MX: { from: 2017, to: 2024 } },
    inStock: true, rating: 4.9, reviews: 198,
  },
  {
    id: 'hv-03', partNumber: '1550629-00-A',
    name: 'Cabin Filter — Model Y Rear Unit', nameGe: 'ფილტრი — Model Y უკანა',
    sectionId: 'hvac', subsectionId: 'hvac-filters',
    price: 115, currency: 'GEL', image: IMG.filter,
    description: 'Model Y-specific rear HVAC cabin filter. Covers the separate rear climate zone unit.',
    fits: { MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 234,
  },

  // ── ELECTRICAL ───────────────────────────────────────────────────────────
  {
    id: 'el-01', partNumber: '1089852-00-C',
    name: 'Front Autopilot Camera', nameGe: 'წინა ავტოპილოტის კამერა',
    sectionId: 'electrical', subsectionId: 'elec-cameras',
    price: 850, currency: 'GEL', image: IMG.camera,
    description: 'Replacement front-facing Autopilot camera. Fixes "Camera Unavailable" errors. Plug-and-play.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 } },
    inStock: true, rating: 4.8, reviews: 67,
  },
  {
    id: 'el-02', partNumber: '1089855-00-B',
    name: 'Side Repeater Camera', nameGe: 'გვერდითი კამერა',
    sectionId: 'electrical', subsectionId: 'elec-cameras',
    price: 620, currency: 'GEL', image: IMG.camera,
    description: 'B-pillar side repeater camera replacement. Specify left or right in order notes.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2021, to: 2024 }, MX: { from: 2021, to: 2024 } },
    inStock: true, rating: 4.7, reviews: 44,
  },
  {
    id: 'el-03', partNumber: '1550901-00-A',
    name: '4K Dual Dashcam (Sentry Boost)', nameGe: 'დეშქემი Sentry-სთვის',
    sectionId: 'electrical', subsectionId: 'elec-cameras',
    price: 750, currency: 'GEL', image: IMG.camera,
    description: '4K front + rear dashcam integrating with Sentry mode via USB. Built-in GPS and Wi-Fi.',
    fits: { M3: { from: 2017, to: 2024 }, MY: { from: 2020, to: 2024 }, MS: { from: 2016, to: 2024 }, MX: { from: 2016, to: 2024 } },
    inStock: true, badge: 'new', rating: 4.5, reviews: 67,
  },
  {
    id: 'el-d01', partNumber: '1550906-00-A',
    name: 'Steering Wheel Button Set', nameGe: 'საჭის ღილაკები',
    sectionId: 'electrical', subsectionId: 'elec-display',
    price: 185, currency: 'GEL', image: IMG.interior,
    description: 'Left and right scroll button and audio control set. Resolves unresponsive controls.',
    fits: { M3: { from: 2017, to: 2022 }, MY: { from: 2020, to: 2022 } },
    inStock: true, rating: 4.7, reviews: 93,
  },
];

export function getProductById(id: string) {
  return products.find(p => p.id === id);
}

export function filterByVehicle(modelId: string, year: number) {
  return products.filter(p => {
    const range = p.fits[modelId as keyof typeof p.fits];
    return range && year >= range.from && year <= range.to;
  });
}

export function filterByVehicleAndSubsection(modelId: string, year: number, subsectionId: string) {
  return filterByVehicle(modelId, year).filter(p => p.subsectionId === subsectionId);
}
