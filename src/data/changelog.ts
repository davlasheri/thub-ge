// Site version and change history.
// Bump APP_VERSION and add an entry at the TOP for every released change.

export const APP_VERSION = '1.2';

export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2',
    date: '2026-07-04',
    changes: [
      'SEO ოპტიმიზაცია: რეალური მისამართები (#-ის გარეშე)',
      'sitemap, robots.txt, სოციალური ბარათები, სტრუქტურირებული მონაცემები',
      'თითო გვერდს თავისი სათაური და აღწერა',
    ],
  },
  {
    version: '1.1',
    date: '2026-07-04',
    changes: [
      'პროდუქტის დამატებისას კატეგორია ავტომატურად განისაზღვრება პარტ-ნომრით',
    ],
  },
  {
    version: '1.0',
    date: '2026-07-04',
    changes: [
      'პირველი სრული ვერსია',
      'კატალოგი Tesla-ს ოფიციალური ჯგუფებით (10–60)',
      'ონლაინ მაღაზია, ავტომობილები, სერვისი',
      'POS სისტემა: გაყიდვები, მარაგი, სალარო, დაბრუნებები',
      'თანამშრომლები და როლები, გაერთიანებული ავტორიზაცია',
      'სტატისტიკის დაფა და რეპორტები',
      'PWA — დაყენებადი აპლიკაცია',
      'მუქი/ღია თემა, 3 ენა (ქარ/ინგ/რუს)',
      'ავტომატური ბექაფები და ვერსიების ისტორია',
    ],
  },
];
