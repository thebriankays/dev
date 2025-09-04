import { Saira_Extra_Condensed, Orbitron } from 'next/font/google'
import localFont from 'next/font/local'

// 1) Saira Extra Condensed (from Google)
export const sairaExtraCondensed = Saira_Extra_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-saira-extra-condensed',
})

// 2) New Order (local fonts)
export const newOrder = localFont({
  src: [
    {
      path: '/fonts/New_Order_Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '/fonts/New_Order_Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-new-order',
  display: 'swap',
})

// 3) Graphie (local fonts)
export const graphie = localFont({
  src: [
    {
      path: '/fonts/Graphie_Thin.otf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '/fonts/Graphie_ExtraLight.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '/fonts/Graphie_Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '/fonts/Graphie_Book.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/Graphie_Book_Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '/fonts/Graphie_Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '/fonts/Graphie_Bold_Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-graphie',
  display: 'swap',
})

// 4) Antique Olive (local font)
export const antiqueOlive = localFont({
  src: [
    {
      path: '/fonts/AntiqueOlive.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-antique-olive',
  display: 'swap',
})

export const ppNeueCorp = localFont({
  src: [
    {
      path: '/fonts/PPNeueCorp-TightUltrabold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pp-neue-corp',
  display: 'swap',
})

// 5) Oakes Grotesk (local font)
export const oakesGrotesk = localFont({
  src: [
    {
      path: '/fonts/OakesGrotesk-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/OakesGrotesk-Semi-Bold.woff',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-oakes-grotesk',
  display: 'swap',
})

// 6) Six Caps (local font)
export const sixCaps = localFont({
  src: [
    {
      path: '/fonts/SixCaps.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-six-caps',
  display: 'swap',
})

// 7) Monument Extended (local fonts)
export const monumentExtended = localFont({
  src: [
    {
      path: '/fonts/monument-extended-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/monument-extended-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-monument-extended',
  display: 'swap',
})

// 8) FK Grotesk Neue (local font)
export const fkGroteskNeue = localFont({
  src: [
    {
      path: '/fonts/FKGroteskNeue-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-fk-grotesk-neue',
  display: 'swap',
})

// 9) Alien Robot (local font)
export const alienRobot = localFont({
  src: [
    {
      path: '/fonts/AlienRobot.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-alien-robot',
  display: 'swap',
})

// 10) Orbitron (from Google)
export const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-orbitron',
})

// 11) Material (local font)
export const matter = localFont({
  src: [
    {
      path: '/fonts/matter-light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '/fonts/matter-regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-matter',
  display: 'swap',
})

// 12) Circular Std (local font)
export const circularStd = localFont({
  src: [
    {
      path: '/fonts/circular-std-font-family/CircularStd-Book.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/circular-std-font-family/CircularStd-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '/fonts/circular-std-font-family/CircularStd-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '/fonts/circular-std-font-family/CircularStd-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-circular-std',
  display: 'swap',
})

// 13) Overused Grotesk (local font)
export const overusedGrotesk = localFont({
  src: [
    {
      path: '/fonts/overused-grotesk/OverusedGrotesk-Light.woff',
      weight: '300',
      style: 'normal',
    },
    {
      path: '/fonts/overused-grotesk/OverusedGrotesk-Book.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/overused-grotesk/OverusedGrotesk-Roman.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/fonts/overused-grotesk/OverusedGrotesk-Medium.woff',
      weight: '500',
      style: 'normal',
    },
    {
      path: '/fonts/overused-grotesk/OverusedGrotesk-SemiBold.woff',
      weight: '600',
      style: 'normal',
    },
    {
      path: '/fonts/overused-grotesk/OverusedGrotesk-Bold.woff',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-overused-grotesk',
  display: 'swap',
})