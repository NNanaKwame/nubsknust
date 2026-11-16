// Curated short quotations and book excerpts. Keep source links with every entry.
// Historic book excerpts retain the wording of their public-domain originals.
const encouragementQuotes = [
  {
    "text": "My hope is in a Person, the Lord Jesus Christ, who sits at the right hand of God.",
    "author": "Billy Graham",
    "source": "https://billygraham.org/devotions/where-is-your-hope"
  },
  {
    "text": "Faith which begins and ends with Jesus is true faith.",
    "author": "Charles Spurgeon",
    "source": "https://www.spurgeon.org/sermons/little-faith-and-great-faith"
  },
  {
    "text": "The best of all is, God is with us.",
    "author": "John Wesley",
    "source": "https://www.methodist.org.uk/for-churches/resources/articles/best-of-all-is-god-is-with-us-stf-610/"
  },
  {
    "text": "God is most glorified in us when we are most satisfied in him.",
    "author": "John Piper",
    "source": "https://www.desiringgod.org/interviews/whats-the-origin-of-desiring-gods-slogan"
  },
  {
    "text": "Right now counts forever.",
    "author": "R. C. Sproul",
    "source": "https://www.ligonier.org/posts/why-right-now-counts-forever"
  },
  {
    "text": "We are not going to talk about law, and duty, and punishment, but about love, and goodness, and forgiveness, and mercy, and eternal life.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Faith cometh by hearing, and reading is a sort of hearing: faith may come to you while you are reading this book.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "If God justifieth the ungodly, then, dear friend, He can justify you.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "To justify the ungodly--this is a miracle worthy of a God.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Because you own yourself to be a sinner I would encourage you to believe that grace is ordained for such as you are.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Our Lord Jesus did not die for imaginary sins, but His heart's blood was spilt to wash out deep crimson stains, which nothing else can remove.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Oh friend, the great grace of God surpasses my conception and your conception, and I would have you think worthily of it!",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "God justifieth the ungodly, and that takes you up where you now are: it meets you in your worst estate.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "If we have sinned against God, it is in God's power to forgive; for the sin is against Himself.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Only God can justify the ungodly; but He can do it to perfection.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "The justification which comes from God himself must be beyond question.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Justification from God is a sufficient answer to an awakened conscience.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "No tongue can tell the depth of that calm which comes over the soul which has received the peace of God which passeth all understanding.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Jesus has borne the death penalty on our behalf.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "The great gulf of Jesus' loving self-sacrifice can swallow up the mountains of our sins, all of them.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "If you will have Jesus, He has you already.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "It is God's promise, and it is for Him to fulfill His own engagements.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Oh that you would believe that God cannot lie!",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Faith is the work of God's grace in us.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Grace is the fountain and the stream; faith is the aqueduct along which the flood of mercy flows down to refresh the thirsty sons of men.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Grace is the powerful engine, and faith is the chain by which the carriage of the soul is attached to the great motive power.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "See then, dear friend, that the weakness of your faith will not destroy you.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "The Lord's salvation can come to us though we have only faith as a grain of mustard seed.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "The power lies in the grace of God, and not in our faith.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "You must look away even from your own looking, and see nothing but Jesus, and the grace of God revealed in Him.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Search the Scriptures and learn what the Holy Spirit teacheth concerning Christ and His salvation.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Endeavour to know more and more of Christ Jesus.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Trust is the lifeblood of faith; there is no saving faith without it.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Cast yourself upon Jesus; rest in Him; commit yourself to Him.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Faith is not a blind thing; for faith begins with knowledge.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Better the poorest real faith actually at work, than the best ideal of it left in the region of speculation.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Oh dear reader, receive the Lord Jesus into your soul, and you shall live forever!",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Now, just as we trust in daily life, even so are we to trust in God as He is revealed in Christ Jesus.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Sometimes faith is little more than a simple clinging to Christ; a sense of dependence and a willingness so to depend.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "It is the limpet's life to cling to the rock, and it is the sinner's life to cling to Jesus.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "Blessed and happy are they who have a sweet faith in Jesus, intertwined with deep affection for Him, for this is a restful confidence.",
    "author": "Charles H. Spurgeon",
    "source": "https://www.ccel.org/ccel/spurgeon/grace.html",
    "sourceTitle": "All of Grace"
  },
  {
    "text": "It is on prayer that the promises wait for their fulfilment, the kingdom for its coming, the glory of God for its full revelation.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "Jesus has opened a school, in which He trains His redeemed ones, who specially desire it, to have power in prayer.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "It can only be learned in the school of much prayer, for practice makes perfect.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "It is Jesus, praying Himself, who teaches to pray.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "To know how to speak to God is more than knowing how to speak to man.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "Not power with men, but power with God is the first thing.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "It is only Christ who opens the way and teaches the worship in spirit.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "To have Christ the Son, and the Spirit of the Son, dwelling within us, and revealing the Father, this makes us true, spiritual worshippers.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "That inner chamber, that solitary place, is Jesus’ schoolroom.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "There alone, but there most surely, Jesus comes to us to teach us to pray.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "Do not be thinking of how little you have to bring God, but of how much He wants to give you.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "Trust Him for it; depend upon Him: prayer to the Father cannot be vain; He will reward you openly.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "O let the place of secret prayer become to me the most beloved spot of earth.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/prayer.html",
    "sourceTitle": "With Christ in the School of Prayer"
  },
  {
    "text": "The first and chief need of our Christian life is, Fellowship with God.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "The Divine life within us comes from God, and is entirely dependent upon Him.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "I must every day have fresh grace from heaven, and I obtain it only in direct waiting upon God Himself.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Begin each day by tarrying before God, and letting Him touch you.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "In prayer, or worship, everything depends upon God taking the chief place.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "God is love, longing to communicate Himself to me.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "You have access into the very heart and love of the Father.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Be silent before God and let Him bless you.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "He loves you with a personal love, and He looks every day for the personal response of your love.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Look into His face with trust, till His love really shines into your heart.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Count upon Christ to increase in you the inflowing of His Spirit.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Seek grace to know what it means to live as wholly for God as Christ did.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Only the Holy Spirit Himself can teach you what an entire yielding of the whole life to God can mean.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Wait on God to show you in this what you do not know.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Begin each day thus in fellowship with God, and God will be all in all to you.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "If men really believed in the infinite love of God, what a change it would bring about!",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "So God in His love is ever willing to impart blessing; and He is omnipotent in His love.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/deeper.html",
    "sourceTitle": "The Deeper Christian Life"
  },
  {
    "text": "Let your God, through His word, teach you what you must think and believe concerning Him and His will.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "Only give Him time to hold converse with you and to work in you, and your heart shall overflow with the blessedness of God.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "Christ Himself is his life and his power of life.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "The new life from the Spirit of God can be sustained only by the word from the mouth of God.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "Let the word of God be precious to you above everything.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "With a tender motherly love will the Spirit of God teach and help you in your weakness.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "Learn words of God by heart; repeat them to yourself in the course of the day.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "God asks of you, as His child, that you give your heart to become filled with His word.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "I must not only read God’s word, but ponder it and reflect upon it: then shall it work in me.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "This is assurance of faith: to be assured that God will do what He has promised.",
    "author": "Andrew Murray",
    "source": "https://www.ccel.org/ccel/murray/new_life.html",
    "sourceTitle": "The New Life: Words of God for Young Disciples"
  },
  {
    "text": "Your study of physics and other sciences is not worth a rush, if it be not God that you seek after in them.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "It is a most high and noble part of holiness, to search after, behold admire, and love the great Creator in all his works.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "You, that are schoolmasters and tutors, begin and end with the things of God.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "They will likely feel when you have been much with God: that which is most on your hearts, is like to be most in their ears.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "If we let our love decline, we are not like to raise up theirs.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "Above all, be much in secret prayer and meditation.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "Speak not stoutly or disrespectfully to any one; but be courteous to the meanest, as to your equal in Christ.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "So great a God, whose message we deliver, should be honored by our delivery of it.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "Take heed to yourselves, because such great works as ours require greater grace than other men’s.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "If you be indeed Christians, the glory of God will be dearer to you than your lives.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "Every man must render to God the things that are God’s, and that, let it be remembered, is all he is and all he possesses.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "Must not every Christian first ask, In what way may I most honor God with my substance?",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "God can render useful his own ordinances, or else he would never have appointed them.",
    "author": "Richard Baxter",
    "source": "https://www.ccel.org/ccel/baxter/pastor.html",
    "sourceTitle": "The Reformed Pastor"
  },
  {
    "text": "Do not always scrupulously confine yourself to certain rules, or particular forms of devotion; but act with a general confidence in GOD, with love and humility.",
    "author": "Brother Lawrence",
    "source": "https://www.ccel.org/ccel/lawrence/practice.html",
    "sourceTitle": "The Practice of the Presence of God"
  },
  {
    "text": "Let us renounce, let us generously renounce, for the love of Him, all that is not Himself; He deserves infinitely more.",
    "author": "Brother Lawrence",
    "source": "https://www.ccel.org/ccel/lawrence/practice.html",
    "sourceTitle": "The Practice of the Presence of God"
  },
  {
    "text": "We ought to love our friends, but without encroaching upon the love of GOD, which must be the principal.",
    "author": "Brother Lawrence",
    "source": "https://www.ccel.org/ccel/lawrence/practice.html",
    "sourceTitle": "The Practice of the Presence of God"
  },
  {
    "text": "God is the Physician of body and of soul.",
    "author": "Brother Lawrence",
    "source": "https://www.ccel.org/ccel/lawrence/practice.html",
    "sourceTitle": "The Practice of the Presence of God"
  },
  {
    "text": "He loves us infinitely more than we imagine: love Him then, and seek not consolation elsewhere: I hope you will soon receive it.",
    "author": "Brother Lawrence",
    "source": "https://www.ccel.org/ccel/lawrence/practice.html",
    "sourceTitle": "The Practice of the Presence of God"
  },
  {
    "text": "Accordingly I did not pray for any relief, but I prayed for strength to suffer with courage, humility, and love.",
    "author": "Brother Lawrence",
    "source": "https://www.ccel.org/ccel/lawrence/practice.html",
    "sourceTitle": "The Practice of the Presence of God"
  },
  {
    "text": "Let us seek Him often by faith: He is within us; seek Him not elsewhere.",
    "author": "Brother Lawrence",
    "source": "https://www.ccel.org/ccel/lawrence/practice.html",
    "sourceTitle": "The Practice of the Presence of God"
  },
  {
    "text": "God made faith easy to understand—the answers are all in the Word!",
    "author": "Kenneth E. Hagin",
    "source": "https://events.rhema.org/how-faith-comes/",
    "sourceTitle": "How Faith Comes"
  },
  {
    "text": "It’s vital to invest our time in things that are eternal.",
    "author": "Benny Hinn Ministries",
    "source": "https://www.bennyhinn.org/lord-help-me-pray/",
    "sourceTitle": "Lord, Help Me Pray"
  },
  {
    "text": "Keep following the dream that God put in your heart. Believe. Work hard.",
    "author": "Joel Osteen",
    "source": "https://www.joelosteen.com/our-ministry/about-joel",
    "sourceTitle": "About Joel Osteen"
  },
  {
    "text": "Do not be afraid. Open wide the doors for Christ.",
    "author": "Pope John Paul II",
    "source": "https://www.vatican.va/content/john-paul-ii/en/homilies/1978/documents/hf_jp-ii_hom_19781022_inizio-pontificato.html",
    "sourceTitle": "Inauguration homily, 22 October 1978"
  },
  {
    "text": "We must not let hope abandon us, because God, with his love, walks with us.",
    "author": "Pope Francis",
    "source": "https://www.vatican.va/content/francesco/en/audiences/2016/documents/papa-francesco_20161207_udienza-generale.html",
    "sourceTitle": "General audience, 7 December 2016"
  },
  {
    "text": "Never look down on people, because the one you despise today may be the vessel God uses to save nations tomorrow.",
    "author": "Joshua Selman",
    "source": "https://www.vanguardngr.com/2025/08/apostle-joshua-selman-shakes-new-york-with-miracles/amp/",
    "sourceTitle": "Sermon quotation reported by Vanguard, 19 August 2025"
  }
];
