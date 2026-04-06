const BASE = 'https://pub-b732a2cfd217455192c17bafa7883c05.r2.dev'

// 8 images not already featured prominently elsewhere
const stripImages = [
  { src: `${BASE}/50-web-or-mls-Lets%20Go%20Click-057.jpg`,  alt: 'Vibrant floral bedroom with green ceiling' },
  { src: `${BASE}/106-web-or-mls-Lets%20Go%20Click-081.jpeg`, alt: 'Open living room with rust sectional and neon sign' },
  { src: `${BASE}/55-web-or-mls-Lets%20Go%20Click-062.jpg`,  alt: 'Coral tropical bedroom with bold wallpaper' },
  { src: `${BASE}/129-web-or-mls-Lets%20Go%20Click-056.jpeg`, alt: 'Red ceiling bedroom with teal curtains' },
  { src: `${BASE}/42-web-or-mls-Lets%20Go%20Click-027.jpeg`,  alt: 'Dining room with orange mural and teal chairs' },
  { src: `${BASE}/3-web-or-mls-Lets%20Go%20Click-066.jpeg`,   alt: 'Game room with GAME ON neon sign and surf mural' },
  { src: `${BASE}/140-web-or-mls-Lets%20Go%20Click-045.jpeg`, alt: 'Yellow Pac-Man game room with slide and bunk beds' },
  { src: `${BASE}/DSC04573.jpg`,                              alt: 'Warm LIVE MUSIC living room at evening' },
]

// Duplicate for seamless loop
const loopImages = [...stripImages, ...stripImages]

export default function PhotoStrip() {
  return (
    <div className="overflow-hidden bg-charcoal py-3" aria-hidden="true">
      <div
        className="flex gap-3"
        style={{
          animation: 'stripScroll 40s linear infinite',
          width: 'max-content',
        }}
      >
        {loopImages.map((img, i) => (
          <div
            key={i}
            className="flex-shrink-0 overflow-hidden"
            style={{ width: 280, height: 190 }}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes stripScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
