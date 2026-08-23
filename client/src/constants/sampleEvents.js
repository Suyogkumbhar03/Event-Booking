export const SAMPLE_EVENTS = [
  {
    _id: "evt-001",
    title: "The Midnight Chamber Symphony",
    description: "An intimate evening of candlelight acoustic performances featuring 18th-century chamber concertos alongside modern minimal compositions. Performed in Vienna's historic resonant hall with acoustic multi-channel live streaming.",
    category: "Classical & Orchestral",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200",
    bannerImage: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200",
    date: "2026-10-12T20:30:00",
    time: "20:30",
    location: "Wiener Musikverein Hall, Vienna",
    venue: {
      name: "Wiener Musikverein Hall",
      city: "Vienna",
      address: "Musikvereinsplatz 1, 1010 Wien"
    },
    ticketPrice: 45,
    availableSeats: 48,
    totalSeats: 120,
    ticketTiers: [
      { _id: "tier-101", name: "Balcony Pass", price: 45, totalSeats: 120, availableSeats: 48 },
      { _id: "tier-102", name: "Orchestra Front", price: 95, totalSeats: 60, availableSeats: 12 }
    ]
  },
  {
    _id: "evt-002",
    title: "Neural Canvas: AI & Generative Art Triennial",
    description: "A three-day gathering exploring autonomous creative agents, generative neural shaders, and spatial interactive installations. Featuring keynote dialogues with lead researchers and digital artisans.",
    category: "Exhibition & Summit",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200",
    bannerImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200",
    date: "2026-10-18T10:00:00",
    time: "10:00",
    location: "Mori Center for Generative Art, Tokyo",
    venue: {
      name: "Mori Center for Generative Art",
      city: "Tokyo",
      address: "Roppongi Hills Mori Tower 53F, Tokyo"
    },
    ticketPrice: 30,
    availableSeats: 180,
    totalSeats: 300,
    ticketTiers: [
      { _id: "tier-201", name: "Day Pass", price: 30, totalSeats: 300, availableSeats: 180 },
      { _id: "tier-202", name: "Keynote + Artist Dinner", price: 140, totalSeats: 40, availableSeats: 6 }
    ]
  },
  {
    _id: "evt-003",
    title: "Sunburst Warehouse: Deep Techno All-Night",
    description: "Raw analog synth textures and hypnotic polyrhythms inside a decommissioned industrial power station. Powered by custom vintage horn speaker arrays.",
    category: "Underground Club",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200",
    bannerImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200",
    date: "2026-10-24T23:00:00",
    time: "23:00",
    location: "Kraftwerk Industrial Complex, Berlin",
    venue: {
      name: "Kraftwerk Industrial Complex",
      city: "Berlin",
      address: "Köpenicker Str. 70, 10179 Berlin"
    },
    ticketPrice: 20,
    availableSeats: 95,
    totalSeats: 200,
    ticketTiers: [
      { _id: "tier-301", name: "Early Entry (Before Midnight)", price: 20, totalSeats: 200, availableSeats: 95 },
      { _id: "tier-302", name: "Full Night Pass", price: 35, totalSeats: 500, availableSeats: 210 }
    ]
  },
  {
    _id: "evt-004",
    title: "Architectural Ceramics Masterclass with Studio Kō",
    description: "A hands-on masterclass focusing on high-fire reduction glazes, hand-thrown structural vessels, and Japanese wabi-sabi architectural forms.",
    category: "Workshop",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1200",
    bannerImage: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=1200",
    date: "2026-11-02T14:00:00",
    time: "14:00",
    location: "Studio Kō Kiln Workshop, Kyoto",
    venue: {
      name: "Studio Kō Kiln Workshop",
      city: "Kyoto",
      address: "Higashiyama Ward, Kyoto"
    },
    ticketPrice: 85,
    availableSeats: 4,
    totalSeats: 16,
    ticketTiers: [
      { _id: "tier-401", name: "Studio Seat & Clay Kit", price: 85, totalSeats: 16, availableSeats: 4 }
    ]
  },
  {
    _id: "evt-005",
    title: "Standup in the Round: An Evening of Raw Satire",
    description: "Unfiltered observational standup and topical satire staged inside an amphitheater setting. Intimate seating with zero distance between comic and audience.",
    category: "Comedy",
    image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=1200",
    bannerImage: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=1200",
    date: "2026-11-09T19:30:00",
    time: "19:30",
    location: "Soho Theatre Arena, London",
    venue: {
      name: "Soho Theatre Arena",
      city: "London",
      address: "21 Dean St, London W1D 3NE"
    },
    ticketPrice: 28,
    availableSeats: 62,
    totalSeats: 150,
    ticketTiers: [
      { _id: "tier-501", name: "Standard Seat", price: 28, totalSeats: 150, availableSeats: 62 },
      { _id: "tier-502", name: "Front Row + Drink", price: 50, totalSeats: 30, availableSeats: 8 }
    ]
  },
  {
    _id: "evt-006",
    title: "Nordic Roast & Slow Brew Invitational",
    description: "Featuring 12 independent Scandinavian micro-roasters showcasing single-origin light roasts, precision hand pours, and sensory cupping sessions.",
    category: "Gastronomy",
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1200",
    bannerImage: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1200",
    date: "2026-11-15T09:00:00",
    time: "09:00",
    location: "Kødbyen Market Hall, Copenhagen",
    venue: {
      name: "Kødbyen Market Hall",
      city: "Copenhagen",
      address: "Flæsketorvet 1, 1711 København"
    },
    ticketPrice: 38,
    availableSeats: 31,
    totalSeats: 90,
    ticketTiers: [
      { _id: "tier-601", name: "Tasting Flight Pass", price: 38, totalSeats: 90, availableSeats: 31 }
    ]
  }
];
