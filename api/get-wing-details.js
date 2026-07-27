// api/get-wing-details.js

const WING_DETAILS = [
  {
    id: "prayer-force",
    name: "Prayer Force",
    category: "Intercession",
    badge: "badge-indigo",
    tagline: "Standing in the gap through prayer and spiritual warfare.",
    description: "The Prayer Force is led by the Prayer Secretary and is responsible for organizing Thursday prayer services across designated centers, supervising preparatory prayers, core prayers, and weekly dawn Gethsemane meetings, leading healing, deliverance, and intercessory teams, and organizing semester prayer marathons and fasts.",
    meetingDay: "Thursdays",
    meetingTime: "6:00 PM",
    venue: "Chapel Prayer Room",
    photos: [
      { src: "https://placehold.co/600x750?text=Prayer+Force+1", alt: "Prayer Force gathering" },
      { src: "https://placehold.co/600x750?text=Prayer+Force+2", alt: "Prayer Force gathering" },
      { src: "https://placehold.co/600x750?text=Prayer+Force+3", alt: "Prayer Force gathering" },
    ],
    videos: []
  },
  {
    id: "outreach-wing",
    name: "Outreach Wing",
    category: "Evangelism",
    badge: "badge-sage",
    tagline: "The soul-winning engine of the church.",
    description: "Headed by the Outreach Secretary, the Outreach Wing plans and executes campus and community missions and crusades, follows up with new converts, visitors, and inactive members, and pioneers innovative methods for personal evangelism and discipleship.",
    meetingDay: "Tuesdays",
    meetingTime: "5:30 PM",
    venue: "Great Hall Annex",
    photos: [
      { src: "https://placehold.co/600x750?text=Outreach+1", alt: "Outreach Wing activity" },
      { src: "https://placehold.co/600x750?text=Outreach+2", alt: "Outreach Wing activity" },
      { src: "https://placehold.co/600x750?text=Outreach+3", alt: "Outreach Wing activity" },
    ],
    videos: []
  },
  {
    id: "gods-instruments",
    name: "God's Instruments",
    category: "Worship",
    badge: "badge-gold",
    tagline: "Uniting voices and instruments in worship.",
    description: "Led by the Music President, this wing covers the Praise and Worship team and the NUBS-KNUST Choir (God's Instrument), organizes worship retreats and semester music workshops, and collaborates with Ministering Marshalls every three years for Inspiropera.",
    meetingDay: "Fridays",
    meetingTime: "7:00 PM",
    venue: "Main Auditorium",
    photos: [
      { src: "https://placehold.co/600x750?text=Gods+Instruments+1", alt: "God's Instruments rehearsal" },
      { src: "https://placehold.co/600x750?text=Gods+Instruments+2", alt: "God's Instruments rehearsal" },
      { src: "https://placehold.co/600x750?text=Gods+Instruments+3", alt: "God's Instruments rehearsal" },
    ],
    videos: []
  },
  {
    id: "ministering-marshalls",
    name: "Ministering Marshalls",
    category: "Ministrations",
    badge: "badge-clay",
    tagline: "Expressing God's Word through the creative arts.",
    description: "Led by the MM Head, Ministering Marshalls coordinates drama, choreography, and spoken word performances, expressing the Word of God through creative arts during services and outreaches.",
    meetingDay: "Wednesdays",
    meetingTime: "6:30 PM",
    venue: "Rehearsal Hall B",
    photos: [
      { src: "https://placehold.co/600x750?text=Marshalls+1", alt: "Ministering Marshalls performance" },
      { src: "https://placehold.co/600x750?text=Marshalls+2", alt: "Ministering Marshalls performance" },
      { src: "https://placehold.co/600x750?text=Marshalls+3", alt: "Ministering Marshalls performance" },
    ],
    videos: []
  },
  {
    id: "bible-study-wing",
    name: "Bible Study Wing",
    category: "Discipleship",
    badge: "badge-slate",
    tagline: "Cultivating a deeper understanding of Scripture.",
    description: "Led by the Bible Studies Coordinator, this wing prepares study manuals based on the semester's theme and organizes baptismal classes and inter-wing Bible quiz competitions.",
    meetingDay: "Mondays",
    meetingTime: "6:00 PM",
    venue: "Lecture Room 3",
    photos: [
      { src: "https://placehold.co/600x750?text=Bible+Study+1", alt: "Bible Study Wing session" },
      { src: "https://placehold.co/600x750?text=Bible+Study+2", alt: "Bible Study Wing session" },
      { src: "https://placehold.co/600x750?text=Bible+Study+3", alt: "Bible Study Wing session" },
    ],
    videos: []
  },
  {
    id: "organizing-wing",
    name: "Organizing Wing",
    category: "Operations",
    badge: "badge-sky",
    tagline: "The engine room behind every service.",
    description: "The Organizing Wing, under the Organizing Secretary, includes Ushering (seating, offertory, and welcoming guests), Publicity (media, posters, website, and public promotion), Technical (sound systems, instruments, and sermon recordings), Transport (vehicle maintenance and logistics), and Protocol (guest minister welfare).",
    meetingDay: "Saturdays",
    meetingTime: "4:00 PM",
    venue: "Admin Block, Room 12",
    photos: [
      { src: "https://placehold.co/600x750?text=Organizing+1", alt: "Organizing Wing at work" },
      { src: "https://placehold.co/600x750?text=Organizing+2", alt: "Organizing Wing at work" },
      { src: "https://placehold.co/600x750?text=Organizing+3", alt: "Organizing Wing at work" },
    ],
    videos: []
  },
];

export default function getWingDetailsHandler(req, res) {
  const { id } = req.query;

  if (id) {
    const wing = WING_DETAILS.find((w) => w.id === id);
    if (!wing) {
      return res.status(404).json({ error: 'Wing not found' });
    }
    return res.json({ item: wing });
  }

  return res.json({ items: WING_DETAILS });
}