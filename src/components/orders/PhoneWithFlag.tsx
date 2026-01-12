import { FC, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PhoneWithFlagProps {
  phone: string;
  showCopyButton?: boolean;
}

// Bulgarian Flag SVG component
const BulgarianFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Български телефон"
  >
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#fff" d="M0 0h640v160H0z"/>
      <path fill="#00966e" d="M0 160h640v160H0z"/>
      <path fill="#d62612" d="M0 320h640v160H0z"/>
    </g>
  </svg>
);

// Greek Flag SVG component
const GreekFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Гръцки телефон"
  >
    <rect fill="#0D5EAF" width="640" height="480"/>
    <rect fill="#fff" y="53.3" width="640" height="53.3"/>
    <rect fill="#fff" y="160" width="640" height="53.3"/>
    <rect fill="#fff" y="266.7" width="640" height="53.3"/>
    <rect fill="#fff" y="373.3" width="640" height="53.3"/>
    <rect fill="#0D5EAF" width="266.7" height="266.7"/>
    <rect fill="#fff" x="106.7" width="53.3" height="266.7"/>
    <rect fill="#fff" y="106.7" width="266.7" height="53.3"/>
  </svg>
);

// Romanian Flag SVG component
const RomanianFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Румънски телефон"
  >
    <rect fill="#002B7F" width="213.3" height="480"/>
    <rect fill="#FCD116" x="213.3" width="213.3" height="480"/>
    <rect fill="#CE1126" x="426.6" width="213.4" height="480"/>
  </svg>
);

// German Flag SVG component
const GermanFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Немски телефон"
  >
    <rect fill="#000" width="640" height="160"/>
    <rect fill="#D00" y="160" width="640" height="160"/>
    <rect fill="#FFCE00" y="320" width="640" height="160"/>
  </svg>
);

// UK Flag SVG component
const UKFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Британски телефон"
  >
    <rect fill="#012169" width="640" height="480"/>
    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 302 81 480H0v-60l239-178L0 64V0h75z"/>
    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
  </svg>
);

// Italian Flag SVG component
const ItalianFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Италиански телефон"
  >
    <rect fill="#009246" width="213.3" height="480"/>
    <rect fill="#fff" x="213.3" width="213.3" height="480"/>
    <rect fill="#CE2B37" x="426.6" width="213.4" height="480"/>
  </svg>
);

// French Flag SVG component
const FrenchFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Френски телефон"
  >
    <rect fill="#002395" width="213.3" height="480"/>
    <rect fill="#fff" x="213.3" width="213.3" height="480"/>
    <rect fill="#ED2939" x="426.6" width="213.4" height="480"/>
  </svg>
);

// Spanish Flag SVG component
const SpanishFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Испански телефон"
  >
    <rect fill="#AA151B" width="640" height="480"/>
    <rect fill="#F1BF00" y="120" width="640" height="240"/>
  </svg>
);

// Austrian Flag SVG component
const AustrianFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Австрийски телефон"
  >
    <rect fill="#ED2939" width="640" height="160"/>
    <rect fill="#fff" y="160" width="640" height="160"/>
    <rect fill="#ED2939" y="320" width="640" height="160"/>
  </svg>
);

// Serbian Flag SVG component
const SerbianFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Сръбски телефон"
  >
    <rect fill="#C6363C" width="640" height="160"/>
    <rect fill="#0C4076" y="160" width="640" height="160"/>
    <rect fill="#fff" y="320" width="640" height="160"/>
  </svg>
);

// North Macedonian Flag SVG component
const NorthMacedonianFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Северномакедонски телефон"
  >
    <rect fill="#D20000" width="640" height="480"/>
    <g fill="#FFE600">
      <path d="M0 216h640v48H0z"/>
      <path d="M296 0h48v480h-48z"/>
      <path d="M0 0 320 240 0 480V0z"/>
      <path d="M640 0 320 240l320 240V0z"/>
      <circle cx="320" cy="240" r="77"/>
    </g>
    <circle fill="#D20000" cx="320" cy="240" r="58"/>
  </svg>
);

// Turkish Flag SVG component
const TurkishFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Турски телефон"
  >
    <rect fill="#E30A17" width="640" height="480"/>
    <circle fill="#fff" cx="240" cy="240" r="120"/>
    <circle fill="#E30A17" cx="274" cy="240" r="96"/>
    <polygon fill="#fff" points="400,240 328,210 350,286 350,194 328,270"/>
  </svg>
);

// Poland Flag SVG component
const PolishFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Полски телефон"
  >
    <rect fill="#fff" width="640" height="240"/>
    <rect fill="#DC143C" y="240" width="640" height="240"/>
  </svg>
);

// Czech Flag SVG component
const CzechFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Чешки телефон"
  >
    <rect fill="#fff" width="640" height="240"/>
    <rect fill="#D7141A" y="240" width="640" height="240"/>
    <path fill="#11457E" d="M0 0v480l320-240L0 0z"/>
  </svg>
);

// Hungarian Flag SVG component
const HungarianFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Унгарски телефон"
  >
    <rect fill="#CE2939" width="640" height="160"/>
    <rect fill="#fff" y="160" width="640" height="160"/>
    <rect fill="#477050" y="320" width="640" height="160"/>
  </svg>
);

// Netherlands Flag SVG component
const NetherlandsFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Нидерландски телефон"
  >
    <rect fill="#21468B" width="640" height="160"/>
    <rect fill="#fff" y="160" width="640" height="160"/>
    <rect fill="#AE1C28" y="320" width="640" height="160"/>
  </svg>
);

// Belgium Flag SVG component
const BelgiumFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Белгийски телефон"
  >
    <rect fill="#000" width="213.3" height="480"/>
    <rect fill="#FFE936" x="213.3" width="213.3" height="480"/>
    <rect fill="#FF0F21" x="426.6" width="213.4" height="480"/>
  </svg>
);

// Swiss Flag SVG component
const SwissFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Швейцарски телефон"
  >
    <rect fill="#FF0000" width="640" height="480"/>
    <rect fill="#fff" x="255" y="120" width="130" height="240"/>
    <rect fill="#fff" x="200" y="175" width="240" height="130"/>
  </svg>
);

type CountryCode = 'BG' | 'GR' | 'RO' | 'DE' | 'UK' | 'IT' | 'FR' | 'ES' | 'AT' | 'RS' | 'MK' | 'TR' | 'PL' | 'CZ' | 'HU' | 'NL' | 'BE' | 'CH' | null;

interface PhoneInfo {
  formatted: string;
  countryCode: CountryCode;
  cleanNumber: string;
}

// Country phone patterns
const countryPatterns: { prefixes: string[]; code: CountryCode; intlPrefix: string }[] = [
  // Bulgaria
  { prefixes: ['088', '0888', '0878', '0879', '089', '087', '098', '02', '032', '042', '052', '062', '082', '092'], code: 'BG', intlPrefix: '+359' },
  // Greece
  { prefixes: ['69', '21', '231', '241', '251', '261', '271', '281'], code: 'GR', intlPrefix: '+30' },
  // Romania
  { prefixes: ['07', '021', '031', '0232', '0262', '0264', '0356'], code: 'RO', intlPrefix: '+40' },
  // Germany
  { prefixes: ['015', '016', '017', '030', '040', '069', '089'], code: 'DE', intlPrefix: '+49' },
  // UK
  { prefixes: ['07', '020', '0121', '0131', '0141', '0161', '0191'], code: 'UK', intlPrefix: '+44' },
  // Italy
  { prefixes: ['3', '06', '02', '011', '010', '041', '051', '081', '091'], code: 'IT', intlPrefix: '+39' },
  // France
  { prefixes: ['06', '07', '01', '02', '03', '04', '05', '09'], code: 'FR', intlPrefix: '+33' },
  // Spain
  { prefixes: ['6', '7', '9'], code: 'ES', intlPrefix: '+34' },
  // Austria
  { prefixes: ['06', '01', '0316', '0512', '0662'], code: 'AT', intlPrefix: '+43' },
  // Serbia
  { prefixes: ['06', '011', '021', '031', '034', '036', '037'], code: 'RS', intlPrefix: '+381' },
  // North Macedonia
  { prefixes: ['07', '02', '031', '032', '033', '034', '042', '043', '044', '045', '046', '047', '048'], code: 'MK', intlPrefix: '+389' },
  // Turkey
  { prefixes: ['05', '0212', '0216', '0232', '0242', '0312', '0322', '0332', '0352', '0362', '0412', '0442', '0462'], code: 'TR', intlPrefix: '+90' },
  // Poland
  { prefixes: ['5', '6', '7', '8', '22', '12', '42', '61', '71', '81', '91'], code: 'PL', intlPrefix: '+48' },
  // Czech Republic
  { prefixes: ['6', '7', '2', '3', '4', '5'], code: 'CZ', intlPrefix: '+420' },
  // Hungary
  { prefixes: ['06', '01', '036', '046', '052', '062', '072', '082', '092'], code: 'HU', intlPrefix: '+36' },
  // Netherlands
  { prefixes: ['06', '010', '020', '030', '040', '050', '070', '071', '073', '074', '076', '077', '078', '079'], code: 'NL', intlPrefix: '+31' },
  // Belgium
  { prefixes: ['04', '02', '03', '04', '09', '010', '011', '012', '013', '014', '015', '016', '019'], code: 'BE', intlPrefix: '+32' },
  // Switzerland
  { prefixes: ['07', '021', '022', '024', '026', '027', '031', '032', '033', '034', '041', '043', '044', '052', '055', '056', '058', '061', '062', '071', '081', '091'], code: 'CH', intlPrefix: '+41' },
];

// International prefix patterns for already formatted numbers
const intlPrefixes: { prefix: string; code: CountryCode }[] = [
  { prefix: '+359', code: 'BG' }, { prefix: '00359', code: 'BG' },
  { prefix: '+30', code: 'GR' }, { prefix: '0030', code: 'GR' },
  { prefix: '+40', code: 'RO' }, { prefix: '0040', code: 'RO' },
  { prefix: '+49', code: 'DE' }, { prefix: '0049', code: 'DE' },
  { prefix: '+44', code: 'UK' }, { prefix: '0044', code: 'UK' },
  { prefix: '+39', code: 'IT' }, { prefix: '0039', code: 'IT' },
  { prefix: '+33', code: 'FR' }, { prefix: '0033', code: 'FR' },
  { prefix: '+34', code: 'ES' }, { prefix: '0034', code: 'ES' },
  { prefix: '+43', code: 'AT' }, { prefix: '0043', code: 'AT' },
  { prefix: '+381', code: 'RS' }, { prefix: '00381', code: 'RS' },
  { prefix: '+389', code: 'MK' }, { prefix: '00389', code: 'MK' },
  { prefix: '+90', code: 'TR' }, { prefix: '0090', code: 'TR' },
  { prefix: '+48', code: 'PL' }, { prefix: '0048', code: 'PL' },
  { prefix: '+420', code: 'CZ' }, { prefix: '00420', code: 'CZ' },
  { prefix: '+36', code: 'HU' }, { prefix: '0036', code: 'HU' },
  { prefix: '+31', code: 'NL' }, { prefix: '0031', code: 'NL' },
  { prefix: '+32', code: 'BE' }, { prefix: '0032', code: 'BE' },
  { prefix: '+41', code: 'CH' }, { prefix: '0041', code: 'CH' },
];

// Get the flag component for a country code
const getFlagComponent = (countryCode: CountryCode): FC<{ className?: string }> | null => {
  switch (countryCode) {
    case 'BG': return BulgarianFlag;
    case 'GR': return GreekFlag;
    case 'RO': return RomanianFlag;
    case 'DE': return GermanFlag;
    case 'UK': return UKFlag;
    case 'IT': return ItalianFlag;
    case 'FR': return FrenchFlag;
    case 'ES': return SpanishFlag;
    case 'AT': return AustrianFlag;
    case 'RS': return SerbianFlag;
    case 'MK': return NorthMacedonianFlag;
    case 'TR': return TurkishFlag;
    case 'PL': return PolishFlag;
    case 'CZ': return CzechFlag;
    case 'HU': return HungarianFlag;
    case 'NL': return NetherlandsFlag;
    case 'BE': return BelgiumFlag;
    case 'CH': return SwissFlag;
    default: return null;
  }
};

// Format phone number: remove spaces, detect country and format
export const formatPhone = (phone: string): PhoneInfo => {
  // Remove all spaces, dashes, parentheses
  const cleanNumber = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // First check if already has international prefix
  for (const { prefix, code } of intlPrefixes) {
    if (cleanNumber.startsWith(prefix)) {
      const normalized = cleanNumber.replace(/^00\d+/, prefix.replace('00', '+'));
      return {
        formatted: normalized,
        countryCode: code,
        cleanNumber: normalized
      };
    }
  }
  
  // Check Bulgarian numbers first (most common case)
  const bulgarianPrefixes = ['088', '0888', '0878', '0879', '089', '087', '098', '02', '032', '042', '052', '062', '082', '092'];
  const isBulgarianNumber = bulgarianPrefixes.some(prefix => cleanNumber.startsWith(prefix));
  
  if (isBulgarianNumber) {
    const withoutLeadingZero = cleanNumber.replace(/^0/, '');
    return {
      formatted: `+359${withoutLeadingZero}`,
      countryCode: 'BG',
      cleanNumber: `+359${withoutLeadingZero}`
    };
  }
  
  return {
    formatted: cleanNumber,
    countryCode: null,
    cleanNumber
  };
};

export const PhoneWithFlag: FC<PhoneWithFlagProps> = ({ phone, showCopyButton = false }) => {
  const { toast } = useToast();
  
  const { formatted, countryCode, cleanNumber } = useMemo(() => formatPhone(phone), [phone]);
  
  const FlagComponent = countryCode ? getFlagComponent(countryCode) : null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanNumber);
    toast({
      title: 'Копирано',
      description: `Телефон ${cleanNumber} е копиран`,
    });
  };

  return (
    <span 
      className="inline-flex items-center gap-1 cursor-pointer hover:text-primary transition-colors text-[13px] font-semibold"
      onClick={handleCopy}
      title="Кликни за копиране"
    >
      {FlagComponent && <FlagComponent className="w-4 h-3 flex-shrink-0 rounded-[1px] shadow-sm" />}
      <span className="whitespace-nowrap">{formatted}</span>
    </span>
  );
};
