import imgHairColor from './Images/hair2.jpeg';
import imgHairLayers from './Images/Hair4.jpeg';
import imgHairLong from './Images/Hair1.jpeg';
import imgHairBlowdry from './Images/Hair3.jpeg';
import imgFrenchManicure from './Images/nail7.jpeg';
import imgNailArt from './Images/Nail6.jpeg';
import imgCatEyeNails from './Images/Nail3.jpeg';
import imgGoldLineNails from './Images/Nail2.jpeg';
import imgDualToneNails from './Images/Nail1.jpeg';
import imgOffers from './Images/navratri-offers.jpg';

export const SITE_IMAGES = {
  offers: imgOffers,
  featured: {
    hairColor: imgHairColor,
    frenchManicure: imgFrenchManicure,
    nailArt: imgNailArt,
  },
  gallery: [
    {
      id: 1,
      type: 'hair',
      title: 'Rich Burgundy Hair Color',
      desc: 'Deep mahogany tones with layered V-cut and a glossy signature blow-dry finish.',
      image: imgHairColor,
    },
    {
      id: 2,
      type: 'hair',
      title: 'Layered Blow-Dry & Style',
      desc: 'Textured layers with warm caramel highlights and a voluminous salon finish.',
      image: imgHairLayers,
    },
    {
      id: 3,
      type: 'hair',
      title: 'Sleek Long Hair Styling',
      desc: 'Straight, glossy styling with rich brunette tones and a polished look.',
      image: imgHairLong,
    },
    {
      id: 4,
      type: 'hair',
      title: 'Signature Color & Blow-Dry',
      desc: 'Burgundy color melt with professional round-brush styling and shine.',
      image: imgHairBlowdry,
    },
    {
      id: 5,
      type: 'nails',
      title: 'Elegant French Manicure',
      desc: 'Almond nails with a sheer nude base and precise burgundy French tips.',
      image: imgFrenchManicure,
    },
    {
      id: 6,
      type: 'nails',
      title: 'Creative Nail Art',
      desc: 'Hand-painted colourful designs with bold patterns on each nail.',
      image: imgNailArt,
    },
    {
      id: 7,
      type: 'nails',
      title: 'Cat-Eye Gel Manicure',
      desc: 'Magnetic plum gel polish with a shimmering finish and gold accent detail.',
      image: imgCatEyeNails,
    },
    {
      id: 8,
      type: 'nails',
      title: 'Gold Line Nail Art',
      desc: 'Sheer nude almond nails with delicate gold metallic line accents.',
      image: imgGoldLineNails,
    },
    {
      id: 9,
      type: 'nails',
      title: 'Dual-Tone Gel Manicure',
      desc: 'Warm caramel and soft pink tones on elegant almond-shaped nails.',
      image: imgDualToneNails,
    },
  ],
};
