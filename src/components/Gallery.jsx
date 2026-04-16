const BASE = 'https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev'

const images = [
  {
    src: `${BASE}/7-web-or-mls-Lets%20Go%20Click-008.jpg`,
    alt: 'Outdoor fire pit at dusk with colorful Adirondack chairs and sports courts',
    span: 'col-span-1 row-span-1',
  },
  {
    src: `${BASE}/26-web-or-mls-Lets%20Go%20Click-036.jpeg`,
    alt: 'Orange velvet sectional living room with gold accents',
    span: 'col-span-2 row-span-1',
  },
  {
    src: `${BASE}/102-web-or-mls-Lets%20Go%20Click-085.jpeg`,
    alt: 'LIVE MUSIC neon sign above a gold upright piano',
    span: 'col-span-1 row-span-2',
  },
  {
    src: `${BASE}/14-web-or-mls-Lets%20Go%20Click-014.jpg`,
    alt: 'Tropical bedroom with flamingo-painted ceiling and teal walls',
    span: 'col-span-1 row-span-1',
  },
  {
    src: `${BASE}/131-web-or-mls-Lets%20Go%20Click-054.jpeg`,
    alt: 'Tropical dining room with teal ceiling and palm leaf mural',
    span: 'col-span-1 row-span-1',
  },
  {
    src: `${BASE}/85-web-or-mls-Lets%20Go%20Click-099.jpg`,
    alt: 'Purple UV blacklight room with glowing sea creature murals',
    span: 'col-span-1 row-span-1',
  },
  {
    src: `${BASE}/30-web-or-mls-Lets%20Go%20Click-030.jpg`,
    alt: 'Thatched tiki bar with putting green in background',
    span: 'col-span-1 row-span-1',
  },
  {
    src: `${BASE}/DSC04457.jpg`,
    alt: 'Kids bunk room with aurora-painted ceiling and indoor slide',
    span: 'col-span-1 row-span-1',
  },
  {
    src: `${BASE}/DSC04540.jpg`,
    alt: 'LIVE MUSIC neon sign living room with warm evening ambiance',
    span: 'col-span-1 row-span-1',
  },
]

export default function Gallery() {
  return (
    <section id="gallery" className="bg-ivory py-4">
      {/* Tight label */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <p
          className="font-sans font-semibold uppercase tracking-widest text-xs text-brass"
          style={{ letterSpacing: '0.2em' }}
        >
          Our Work
        </p>
      </div>

      {/* Asymmetric 3-col grid */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'auto',
          gap: '6px',
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className={`overflow-hidden ${img.span}`}
            style={{ aspectRatio: i === 3 ? '1 / 1.4' : '4 / 3' }}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
