// api/get-wings.js

const WINGS_CONFIG = [
  { slug: 'prayer-force', envKey: 'WING_PRAYER_FORCE' },
  { slug: 'outreach-wing', envKey: 'WING_OUTREACH' },
  { slug: 'gods-instruments', envKey: 'WING_GODS_INSTRUMENTS' },
  { slug: 'ministering-marshalls', envKey: 'WING_MINISTERING_MARSHALLS' },
  { slug: 'bible-study-wing', envKey: 'WING_BIBLE_STUDY' },
  { slug: 'organizing-wing', envKey: 'WING_ORGANIZING' }
];

export default function getWingsHandler(req, res) {
  const wings = WINGS_CONFIG.map(wing => {
    const fileId = process.env[wing.envKey];
    return {
      slug: wing.slug,
      id: fileId || null,
      imageUrl: fileId ? `/api/image-proxy?id=${fileId}` : null
    };
  }).filter(wing => wing.id !== null);

  return res.json({ wings });
}