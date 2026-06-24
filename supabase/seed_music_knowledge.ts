/**
 * Run once to seed the music_knowledge table with 100+ underground artist entries.
 * Usage: npx tsx supabase/seed_music_knowledge.ts
 *
 * Requires in .env.local or environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface ArtistRecord {
  artist_name: string
  style_description: string
  associated_genres: string[]
  typical_bpm_range: string
  mood_tags: string[]
  underground_level: number
  era: string
  similar_artists: string[]
}

const ARTISTS: ArtistRecord[] = [
  // ─── Rage / Plugg ──────────────────────────────────────────────────────────
  {
    artist_name: 'SSGKobe',
    style_description: `SSGKobe is a defining voice in the rage and plugg subgenres that emerged from SoundCloud in the early 2020s. His production style centers on ultra-slow, dragging 808 patterns that feel like they are melting through the speaker, paired with melodic guitar or synth loops that hover in a near-ambient dreamlike state. Tempos typically crawl between 60 and 80 BPM, and the hi-hats follow loose, irregular patterns that sound almost improvised. The overall sonic palette leans heavily on reverb saturation and distorted sub-bass that rumbles the low end without ever becoming aggressive. SSGKobe's beats carry a deeply introspective and mournful quality — they evoke feelings of isolation, late-night dissociation, and emotional numbness. He frequently collaborates with artists in the rage-rap scene including Summrs and Autumn! and has shaped the aesthetic of an entire generation of bedroom producers. His work is known for its lo-fi mixing choices: low-frequency rumble, deliberate muddiness, and occasional digital clipping that sounds intentional rather than accidental. For a producer referencing SSGKobe, the key is restraint — fewer elements, more space, and letting the 808 breathe at a pace that feels almost uncomfortable.`,
    associated_genres: ['Plugg', 'Rage', 'Cloud Rap'],
    typical_bpm_range: '60-80',
    mood_tags: ['Melancholy', 'Dreamy', 'Dark', 'Introspective'],
    underground_level: 9,
    era: '2018-present',
    similar_artists: ['Summrs', 'Autumn!', 'Ethereal', 'Karrahbooo'],
  },
  {
    artist_name: 'Summrs',
    style_description: `Summrs is both a rapper and producer operating at the intersection of rage music and lo-fi trap. As a producer, his beats are characterized by pitched-up vocal samples, eerie synth melodies, and 808s that are often intentionally distorted to the point of sounding broken. BPMs hover around 70-85, giving tracks a sluggish, hypnotic forward motion. His production carries a woozy, intoxicated quality — like trap music heard through a wall of cotton. He frequently uses phonk-adjacent vocal chops alongside Memphis-influenced sample flipping. His self-produced tracks demonstrate an understanding of negative space: the silence between sounds is as important as the sounds themselves. Summrs helped popularize the aesthetic of SoundCloud rage alongside SSGKobe and Autumn!, and his beats have influenced hundreds of bedroom producers on YouTube and social media. His production is intentionally lo-fi, with low-end emphasis, subtle grain, and a deliberate avoidance of the clean, polished sound of mainstream trap. Key sonic markers: slow tempo, high-reverb synth pads, distorted 808, pitched vocal snippets.`,
    associated_genres: ['Rage', 'Plugg', 'SoundCloud Rap'],
    typical_bpm_range: '70-85',
    mood_tags: ['Dark', 'Hypnotic', 'Dreamy', 'Sluggish'],
    underground_level: 9,
    era: '2019-present',
    similar_artists: ['SSGKobe', 'Karrahbooo', 'Ethereal', 'Ken Carson'],
  },
  {
    artist_name: 'Ethereal',
    style_description: `Ethereal is an Atlanta-based rapper and producer who is one of the originators of the plugg and rage aesthetic. His production style pre-dates most of the current plugg scene and draws heavily from early-2010s Atlanta trap while incorporating dreamy, almost new-age synth textures. His beats are known for a ghostly, hollow quality — reverb-drenched piano chords, spectral synth leads, and cavernous 808s that feel more like subsonic pressure than percussion. Tempos range from 65 to 90 BPM. Ethereal's production communicates a sense of melancholy beauty, often sounding like trap music from another dimension. He has collaborated extensively with Awful Records affiliates, which brought an experimental and anti-commercial sensibility to his sound. His work demonstrates how plugg music can be simultaneously emotionally heavy and musically minimal. Key features: hollow reverb on all elements, synth melodies with long decay, deep distorted 808, slow rolling hi-hat triplets.`,
    associated_genres: ['Plugg', 'Rage', 'Experimental Trap'],
    typical_bpm_range: '65-90',
    mood_tags: ['Ethereal', 'Dark', 'Atmospheric', 'Melancholy'],
    underground_level: 9,
    era: '2012-present',
    similar_artists: ['SSGKobe', 'Awful Records', 'Father', 'Abra'],
  },
  {
    artist_name: 'Karrahbooo',
    style_description: `Karrahbooo is a producer and rapper associated with the SoundCloud rage and hyperpop-adjacent underground. Her production blends rage-rap's slow dragging 808s with more experimental sonic textures including glitchy digital artifacts, pitched-up male vocal samples, and chaotic hi-hat patterns. She brings a distinctly playful yet menacing energy to her beats — they can sound innocent and childlike in melody while the low end remains threatening and heavy. BPMs sit between 75 and 95, slightly faster than the slowest plugg tempo. Her work represents a queering and feminization of the traditionally masculine rage aesthetic, and her influence is felt across the new generation of SoundCloud producers who blur genre lines. Key sonic features: hyper-pitched vocal chops, distorted 808, glitchy fx, melodic synth lines that feel almost cartoon-like against dark bass.`,
    associated_genres: ['Rage', 'Hyperpop', 'Cloud Rap'],
    typical_bpm_range: '75-95',
    mood_tags: ['Energetic', 'Dark', 'Playful', 'Chaotic'],
    underground_level: 9,
    era: '2020-present',
    similar_artists: ['SSGKobe', 'Summrs', 'Ken Carson', 'Destroy Lonely'],
  },
  {
    artist_name: 'Ken Carson',
    style_description: `Ken Carson is an Atlanta rapper whose production sensibility bridges rage, hyperpop, and aggressive trap. Beats made in the Ken Carson aesthetic feature extremely distorted 808s, simple but infectious melodic synth loops, and a maximalist approach to distortion and saturation. Unlike the more minimalist plugg producers, Ken Carson-influenced production tends toward full, dense mixes with multiple melodic layers stacked on top of each other. BPMs range from 85 to 115. The emotional register is simultaneously dark and celebratory — beats convey confidence and aggression filtered through an emo-rap lens. Ken Carson has collaborated with Playboi Carti and occupies a unique space in the Opium Records ecosystem where underground aesthetics meet commercial ambition. Key markers: distorted 808 clipping, stacked synth melodies, high energy, aggressive drum patterns.`,
    associated_genres: ['Rage', 'Hyperpop', 'Trap'],
    typical_bpm_range: '85-115',
    mood_tags: ['Aggressive', 'Dark', 'Energetic', 'Distorted'],
    underground_level: 7,
    era: '2020-present',
    similar_artists: ['Destroy Lonely', 'Summrs', 'Homixide Gang', 'Playboi Carti'],
  },
  {
    artist_name: 'Destroy Lonely',
    style_description: `Destroy Lonely is an Atlanta rapper signed to Opium Records who represents a fusion of rage aesthetics, emo-rap, and hypnotic trap. Beats in his lane feature slow-to-mid tempos (80-105 BPM), heavily reverbed guitar or synth lines, and 808s that are simultaneously melodic and rhythmic. His production aesthetic leans into a "dark rainbow" palette — music that sounds emotional and colorful while remaining sonically threatening. Destroy Lonely popularized a style of vocal melodic layering that influences beat structure: producers making beats for this aesthetic often leave prominent space for long vocal holds and drifting ad-libs. Key sonic characteristics: reverb-heavy melodic loops, flowing drum patterns, 808 slides, ambient textures in background.`,
    associated_genres: ['Rage', 'Emo Rap', 'Trap'],
    typical_bpm_range: '80-105',
    mood_tags: ['Dark', 'Melodic', 'Emotional', 'Atmospheric'],
    underground_level: 7,
    era: '2021-present',
    similar_artists: ['Ken Carson', 'Playboi Carti', 'Summrs', 'SSGKobe'],
  },
  {
    artist_name: 'Homixide Gang',
    style_description: `Homixide Gang (Homixide Meechie and Homixide G-Weed) are Atlanta artists associated with Gunna and the 4PF/YSL ecosystem who blend rage aesthetics with harder, more aggressive trap. Their production aesthetic features very fast hi-hat rolls, sharp snare claps, and 808s that are more punchy and present than the slow plugg style. BPMs range from 100 to 140, making their beats among the most energetic in the rage-adjacent space. Sonically they bridge the gap between mainstream Atlanta trap and the underground rage scene — beats that have the sonic intensity of plugg music but the rhythmic drive of hard trap. Key features: rapid hi-hat patterns, heavy snare, punchy 808, intense energy, occasional melody.`,
    associated_genres: ['Rage', 'Trap', 'Atlanta Hip-Hop'],
    typical_bpm_range: '100-140',
    mood_tags: ['Aggressive', 'Dark', 'Energetic', 'Hard'],
    underground_level: 7,
    era: '2021-present',
    similar_artists: ['Ken Carson', 'Gunna', 'Destroy Lonely', 'Lil Baby'],
  },
  {
    artist_name: 'Autumn!',
    style_description: `Autumn! is a core figure in the SoundCloud plugg and rage movement, creating beats characterized by extreme minimalism and emotional atmosphere. His production strips trap music down to its barest essentials: a single melodic element (often a reversed or pitched synth pad), a slow 808 pattern, and sparse, irregular percussion. BPMs frequently dip below 70 — some beats clock in around 60 BPM, which is unusually slow even by plugg standards. The emotional resonance is deep melancholy bordering on despair, but rendered in a way that feels comforting rather than overwhelming. Autumn!'s music has a therapeutic quality for its listeners despite — or because of — its darkness. Key production elements: extremely slow tempo, single melodic element with long reverb tail, minimalist percussion, sub-heavy 808.`,
    associated_genres: ['Plugg', 'Rage', 'Ambient Trap'],
    typical_bpm_range: '55-75',
    mood_tags: ['Melancholy', 'Minimalist', 'Dark', 'Introspective'],
    underground_level: 10,
    era: '2018-present',
    similar_artists: ['SSGKobe', 'Summrs', 'Ethereal'],
  },

  // ─── Underground Hip-Hop ───────────────────────────────────────────────────
  {
    artist_name: 'MIKE',
    style_description: `MIKE is a New York-based rapper and producer who creates some of the most emotionally complex lo-fi hip-hop of the 2010s and 2020s. His self-produced beats are characterized by hazy, tape-saturated samples, boom bap drum patterns with swing and grit, and a deliberate lo-fi aesthetic where the music sounds like it is being heard through old cassette tape. BPMs typically range from 70 to 95. MIKE's production has a homemade, intimate quality — beats that sound like they were made late at night in a small bedroom, yet contain deep emotional nuance. His samples often come from soul, jazz, and obscure gospel records, flipped in ways that preserve their emotional warmth while adding a melancholy distance. MIKE is deeply connected to the Slauson Malone/Navy Blue orbit of underground New York hip-hop, and his work represents a form of lo-fi production that prioritizes emotional truth over technical polish.`,
    associated_genres: ['Underground Hip-Hop', 'Lo-Fi', 'Boom Bap'],
    typical_bpm_range: '70-95',
    mood_tags: ['Introspective', 'Melancholy', 'Warm', 'Lo-Fi'],
    underground_level: 10,
    era: '2016-present',
    similar_artists: ['Navy Blue', 'AKAI SOLO', 'Mavi', 'Yungmorpheus'],
  },
  {
    artist_name: 'AKAI SOLO',
    style_description: `AKAI SOLO is a Brooklyn rapper and producer whose work sits in the tradition of abstract underground hip-hop while drawing from jazz, blues, and experimental electronic music. His beats are dense with texture — vinyl crackle, out-of-tune piano samples, and jazz-influenced chord progressions underpin his intricate rapping. Production tempos range from 75 to 100 BPM, with drums that often feel slightly off-kilter or deliberately swung in ways that create rhythmic tension. AKAI SOLO's sonic world is deeply influenced by the New York underground traditions of Def Jux and Rawkus Records while adding a more chaotic, post-internet sensibility. His production demonstrates how sampling can be used as a compositional tool rather than mere background, with samples that constantly shift and evolve throughout a track.`,
    associated_genres: ['Underground Hip-Hop', 'Abstract Hip-Hop', 'Experimental'],
    typical_bpm_range: '75-100',
    mood_tags: ['Abstract', 'Intellectual', 'Gritty', 'Warm'],
    underground_level: 10,
    era: '2018-present',
    similar_artists: ['MIKE', 'Navy Blue', 'billy woods', 'Mavi'],
  },
  {
    artist_name: 'Navy Blue',
    style_description: `Navy Blue (also known as Sage Elsesser) is a New York rapper and producer who creates meditative, spiritual hip-hop with production that blends jazz samples, soul records, and ambient textures. His beats have a contemplative, prayer-like quality — unhurried tempos (75-95 BPM), warm low-end, and samples that feel carefully chosen for their emotional resonance rather than their energy. Navy Blue's production draws from his interest in Buddhism and spiritual practice, resulting in beats that feel unusually peaceful for hip-hop while never losing rhythmic grounding. He is closely associated with MIKE and the broader underground New York scene and frequently works with producers who share his aesthetic commitment to warmth and introspection over aggression. Key features: warm jazz/soul samples, medium swing drums, ambient background textures, deeply lo-fi mixing.`,
    associated_genres: ['Underground Hip-Hop', 'Abstract Hip-Hop', 'Jazz Rap'],
    typical_bpm_range: '75-95',
    mood_tags: ['Spiritual', 'Peaceful', 'Introspective', 'Warm'],
    underground_level: 10,
    era: '2017-present',
    similar_artists: ['MIKE', 'Mavi', 'AKAI SOLO', 'billy woods'],
  },
  {
    artist_name: 'Mavi',
    style_description: `Mavi is a Charlotte-based rapper who frequently works with underground producers to create dense, lyrically complex hip-hop over jazz-influenced, soul-saturated beats. The production on Mavi projects tends to feature heavy sample usage from soul and jazz records, drums with significant swing, and a generally warm, analogue aesthetic. BPMs range from 80 to 100. His beats communicate a sense of lived experience filtered through an intellectual lens — production that is simultaneously street-level and academic. Mavi's collaborators include MIKE, Navy Blue, and producers in the underground network around Slauson Malone. For producers referencing Mavi's aesthetic, the key ingredients are: prominent but not overbearing low-end, swinging drums, samples that carry emotional weight, and mixing that prioritizes warmth over clarity.`,
    associated_genres: ['Underground Hip-Hop', 'Jazz Rap', 'Boom Bap'],
    typical_bpm_range: '80-100',
    mood_tags: ['Introspective', 'Gritty', 'Warm', 'Dense'],
    underground_level: 10,
    era: '2018-present',
    similar_artists: ['MIKE', 'Navy Blue', 'AKAI SOLO', 'billy woods'],
  },
  {
    artist_name: 'billy woods',
    style_description: `Billy woods is one of the most prolific and respected underground rappers of the 2010s-2020s, frequently working with producers like Blockhead, Kenny Segal, and Preservation. The production on billy woods projects tends toward dark, claustrophobic, jazz-inflected beats with unconventional structures. Drums may be buried or absent entirely for stretches, with samples serving as the primary rhythmic and melodic element. BPMs range from 70 to 100. The aesthetic is deliberately challenging — beats that don't immediately resolve, samples with dissonance, and mixing that creates a sense of pressure and weight. Billy woods' work represents the intellectually demanding end of underground hip-hop production, where discomfort is a feature rather than a bug. Key markers: dissonant samples, unconventional drum patterns, dark tonality, cinematic scope.`,
    associated_genres: ['Underground Hip-Hop', 'Abstract Hip-Hop', 'Dark Rap'],
    typical_bpm_range: '70-100',
    mood_tags: ['Dark', 'Intellectual', 'Tense', 'Abstract'],
    underground_level: 10,
    era: '2005-present',
    similar_artists: ['Armand Hammer', 'AKAI SOLO', 'Elucid', 'Blockhead'],
  },
  {
    artist_name: 'Armand Hammer',
    style_description: `Armand Hammer is the duo of billy woods and Elucid, making some of the most challenging and rewarding underground hip-hop of the 2020s. Their production — often handled by Kenny Segal or Alchemist — is characterized by dissonant, eerie samples, heavy low-end, and drums that feel simultaneously loose and precise. The overall aesthetic is collage-like: beat elements that don't obviously belong together yet create a compelling whole. BPMs typically fall between 75 and 95. Armand Hammer represents a tradition of hip-hop as avant-garde art object — production choices that prioritize texture, mood, and conceptual coherence over accessibility. Key production traits: sample-based with unconventional choices, dark tonality, bass-heavy mix, drums with swing and grit.`,
    associated_genres: ['Underground Hip-Hop', 'Experimental Hip-Hop', 'Abstract Rap'],
    typical_bpm_range: '75-95',
    mood_tags: ['Dark', 'Experimental', 'Dense', 'Cinematic'],
    underground_level: 10,
    era: '2013-present',
    similar_artists: ['billy woods', 'Elucid', 'MIKE', 'Navy Blue'],
  },
  {
    artist_name: 'Pink Siifu',
    style_description: `Pink Siifu is a multi-genre artist whose production references soul, punk, noise, and underground hip-hop simultaneously. His beats often feel deliberately lo-fi and raw — drum machines that sound cheap, samples with vinyl hiss, and a general willingness to let imperfections stand. BPMs range wildly from 75 to 120 depending on the project, reflecting his genre-fluid approach. When making hip-hop beats, Siifu's production tends toward heavy soul sample usage, punchy boom bap drums, and warm but gritty low-end. His more experimental work incorporates noise, distortion, and punk energy. Key features: genre-fluid production, heavy soul influence, raw lo-fi mixing, emotional range from aggressive to tender.`,
    associated_genres: ['Underground Hip-Hop', 'Soul Rap', 'Experimental', 'Noise'],
    typical_bpm_range: '75-120',
    mood_tags: ['Raw', 'Emotional', 'Gritty', 'Experimental'],
    underground_level: 10,
    era: '2016-present',
    similar_artists: ['Fly Anakin', 'Yungmorpheus', 'MIKE', 'Mavi'],
  },
  {
    artist_name: 'Fly Anakin',
    style_description: `Fly Anakin is a Richmond, Virginia rapper whose production aesthetic draws from Virginia's rich underground tradition, combining soul samples, dusty drum breaks, and a gritty, lived-in sonic world. His beats (frequently produced by Huey Briss or similar Virginia producers) are characterized by boom bap drum patterns with significant swing, warm soul and funk samples, and mixing that feels like it belongs to a different era — deliberately analogue and textured. BPMs typically fall between 85 and 105. Fly Anakin's production aesthetic represents a regional tradition that sits between the New York underground and the Southern soul tradition. Key features: soul sample-heavy, boom bap drums with swing, warm analogue texture, vintage sound.`,
    associated_genres: ['Underground Hip-Hop', 'Boom Bap', 'Soul Rap'],
    typical_bpm_range: '85-105',
    mood_tags: ['Gritty', 'Warm', 'Nostalgic', 'Soulful'],
    underground_level: 9,
    era: '2018-present',
    similar_artists: ['Pink Siifu', 'Yungmorpheus', 'Mavi', 'Navy Blue'],
  },
  {
    artist_name: 'Yungmorpheus',
    style_description: `Yungmorpheus is a Los Angeles rapper whose work with producer Ewonee and others occupies a unique space between soul-rap and underground hip-hop. His beats tend to feature warm soul samples, jazz-influenced chord progressions, and drums with a live, slightly loose feel that gives tracks a human quality. BPMs range from 80 to 100. Yungmorpheus's sonic world is distinctly West Coast in its warmth and spaciousness while drawing from New York underground traditions. The overall aesthetic is relaxed but introspective — beats that feel good to inhabit rather than demanding immediate attention. Key production elements: warm soul samples, jazz chord movement, relaxed drum feel, spacious mixing.`,
    associated_genres: ['Underground Hip-Hop', 'Soul Rap', 'West Coast'],
    typical_bpm_range: '80-100',
    mood_tags: ['Chill', 'Introspective', 'Warm', 'Smooth'],
    underground_level: 9,
    era: '2018-present',
    similar_artists: ['Pink Siifu', 'Fly Anakin', 'Navy Blue', 'Mavi'],
  },

  // ─── Phonk ─────────────────────────────────────────────────────────────────
  {
    artist_name: 'DJ Smokey',
    style_description: `DJ Smokey is one of the originators of Memphis phonk, a genre that combines the slowed, chopped aesthetic of Memphis rap from the late 1980s and 1990s with modern trap production techniques. His beats are characterized by slowed, chopped vocal samples from classic Memphis rap records (Three 6 Mafia, Tommy Wright III, Frayser Click), dusty lo-fi drum machines, heavy bass, and a generally menacing, nocturnal atmosphere. BPMs typically fall between 130 and 150 when unchopped, but the "chopped and screwed" presentation often makes them feel much slower. DJ Smokey's work preserves the authentic Memphis underground aesthetic while making it accessible to a new generation. Key features: Memphis vocal samples, lo-fi drum machines, heavy bass, dark menacing atmosphere, chopped presentation.`,
    associated_genres: ['Phonk', 'Memphis Rap', 'Dark Trap'],
    typical_bpm_range: '130-150',
    mood_tags: ['Dark', 'Menacing', 'Nostalgic', 'Gritty'],
    underground_level: 10,
    era: '2010-present',
    similar_artists: ['Soudiere', 'Germ', 'Tommy Wright III', 'Three 6 Mafia'],
  },
  {
    artist_name: 'Soudiere',
    style_description: `Soudiere is a French producer who has been central to the European phonk movement, creating beats that blend Memphis phonk's dark aesthetic with a more European sensibility and technical polish. His production features the characteristic phonk elements — vocal chops from Memphis rap, cowbell hi-hats, heavy 808s, and dark melodic synths — but with cleaner mixing and more explicit incorporation of electronic music production techniques. BPMs range from 130 to 160. Soudiere's work demonstrates how phonk has become a global genre, with producers outside the American South putting their own stamp on a distinctly American regional aesthetic. Key features: Memphis-influenced vocal samples, cowbell hi-hats, heavy 808, dark melodic synths, relatively clean mix compared to lo-fi phonk.`,
    associated_genres: ['Phonk', 'Dark Trap', 'European Trap'],
    typical_bpm_range: '130-160',
    mood_tags: ['Dark', 'Energetic', 'Menacing', 'Driving'],
    underground_level: 8,
    era: '2018-present',
    similar_artists: ['DJ Smokey', 'Kordhell', 'Germ', 'Shlump'],
  },
  {
    artist_name: 'Shlump',
    style_description: `Shlump is an American bass music and phonk producer who bridges the gap between festival bass music and underground phonk. His beats are characterized by extreme bass weight, synth design that incorporates both organic and electronic textures, and a tempo that sits between phonk (140) and bass music (140-150). Shlump's production is technically sophisticated — careful attention to low-end frequency management, complex layering, and a powerful impact that works both on headphones and large speakers. His work has crossover appeal from the underground phonk world to the broader electronic music scene. Key features: extreme bass weight, complex synth design, festival-level impact, crossover between phonk and bass music.`,
    associated_genres: ['Phonk', 'Bass Music', 'Dark Trap'],
    typical_bpm_range: '135-155',
    mood_tags: ['Dark', 'Heavy', 'Energetic', 'Powerful'],
    underground_level: 8,
    era: '2017-present',
    similar_artists: ['DJ Smokey', 'Soudiere', 'Kordhell'],
  },
  {
    artist_name: 'Kordhell',
    style_description: `Kordhell is one of the most streamed phonk producers globally, known for tracks that combine Memphis phonk aesthetics with an accessible, almost pop-level catchiness. His beats feature classic phonk elements (cowbell hi-hats, Memphis vocal samples, heavy 808) alongside melodic hooks that are simple, repetitive, and highly memorable. BPMs typically sit around 140-155. While some underground purists view his work as a commercialization of phonk, Kordhell's production is technically well-executed and has introduced the genre to millions of new listeners. His beats have been widely used in gym and workout content, giving phonk an association with high-energy exercise. Key features: catchy melodic hooks, cowbell hi-hats, heavy 808, accessible structure, high energy.`,
    associated_genres: ['Phonk', 'Dark Trap', 'Viral Phonk'],
    typical_bpm_range: '140-155',
    mood_tags: ['Energetic', 'Dark', 'Driving', 'Hype'],
    underground_level: 5,
    era: '2021-present',
    similar_artists: ['Soudiere', 'Shlump', 'DJ Smokey'],
  },
  {
    artist_name: 'Tommy Wright III',
    style_description: `Tommy Wright III is a Memphis rap legend from the 1990s who is considered one of the founding fathers of Memphis underground rap and by extension phonk. His production from the early-mid 1990s features primitive drum machines, chopped soul and horror movie samples, and a deeply menacing atmosphere that prefigured all of modern dark rap. BPMs on his original recordings are typically around 75-90 BPM, though they are often slowed further in phonk remixes. Tommy Wright III's aesthetic — heavy bass, dark melodies, threatening vocal delivery — is the foundation upon which modern phonk was built. His cassette-tape productions from the pre-internet era are artifacts of a unique regional musical culture.`,
    associated_genres: ['Memphis Rap', 'Phonk', 'Gangsta Rap'],
    typical_bpm_range: '75-90',
    mood_tags: ['Dark', 'Menacing', 'Gritty', 'Raw'],
    underground_level: 10,
    era: '1991-2000',
    similar_artists: ['Three 6 Mafia', 'DJ Paul', 'Juicy J', 'DJ Smokey'],
  },
  {
    artist_name: 'Germ',
    style_description: `Germ is a Memphis rapper who straddles the line between traditional Memphis rap aesthetics and modern phonk production. His self-produced and co-produced beats retain the darkness of classic Memphis rap while incorporating contemporary trap elements. His production features heavy 808 usage, ominous melodic loops, and drums that feel simultaneously primitive and modern. BPMs range from 85 to 120. Germ's work is a bridge between old Memphis and new phonk, demonstrating continuity in the city's underground musical tradition. He frequently works with $uicideBoy$ and other artists in the gothic/dark rap space. Key features: Memphis aesthetic, heavy 808, ominous melodies, dark atmosphere.`,
    associated_genres: ['Phonk', 'Memphis Rap', 'Dark Trap'],
    typical_bpm_range: '85-120',
    mood_tags: ['Dark', 'Menacing', 'Gritty', 'Gothic'],
    underground_level: 8,
    era: '2015-present',
    similar_artists: ['DJ Smokey', '$uicideBoy$', 'Tommy Wright III'],
  },
  {
    artist_name: 'Rxlxnd',
    style_description: `Rxlxnd (Roland) is a phonk and dark trap producer who specializes in atmospheric, cinematic production with strong bass elements. His beats are characterized by reverb-heavy synth pads, distant melodic elements that feel like they are coming from another room, and heavy 808s that dominate the low end. BPMs typically fall between 130 and 150. Rxlxnd's production has an almost ambient quality despite its heavy bass content — the melodic elements create a dreamlike atmosphere that contrasts with the aggressive low-end. His work occupies a space between phonk and dark ambient electronic music.`,
    associated_genres: ['Phonk', 'Dark Trap', 'Ambient Trap'],
    typical_bpm_range: '130-150',
    mood_tags: ['Dark', 'Atmospheric', 'Cinematic', 'Heavy'],
    underground_level: 8,
    era: '2019-present',
    similar_artists: ['Soudiere', 'DJ Smokey', 'Kordhell'],
  },

  // ─── Lo-Fi ─────────────────────────────────────────────────────────────────
  {
    artist_name: 'Jinsang',
    style_description: `Jinsang is one of the most celebrated lo-fi hip-hop producers, known for creating beats of exceptional warmth, emotional depth, and technical sophistication within the lo-fi aesthetic. His production features carefully chosen jazz and soul samples (often featuring piano, upright bass, and brushed drums), vinyl crackle, and a generally cozy, introspective atmosphere. BPMs typically fall between 75 and 95 — slow enough to feel meditative but fast enough to have rhythmic life. Jinsang's beats are frequently used for studying and relaxation playlists, but they reward close listening with their subtle complexity. His sample choices are always tasteful, avoiding the obvious and clichéd in favor of more obscure records with genuine emotional resonance. Key features: warm jazz/soul samples, vinyl aesthetic, meditative tempo, emotional warmth, subtle complexity.`,
    associated_genres: ['Lo-Fi Hip-Hop', 'Chillhop', 'Jazz Hop'],
    typical_bpm_range: '75-95',
    mood_tags: ['Chill', 'Warm', 'Nostalgic', 'Peaceful'],
    underground_level: 6,
    era: '2015-present',
    similar_artists: ['tomppabeats', 'Idealism', 'Philanthrope', 'j\'san'],
  },
  {
    artist_name: 'tomppabeats',
    style_description: `tomppabeats is a Finnish lo-fi hip-hop producer whose work is characterized by a distinctive warmth and melancholy that draws heavily from Japanese jazz and city pop influences alongside Western lo-fi traditions. His beats feature piano samples with long sustain, upright bass lines, and drums with a gentle, almost apologetic swing. BPMs sit comfortably in the 75-90 range. The emotional register of tomppabeats' music is wistful nostalgia — beats that feel like memories of places you've never been. His production has a unique spaciousness, allowing each element to breathe without competing. Key features: jazz piano with sustain, Japanese aesthetic influence, gentle drum swing, melancholy warmth, spacious mix.`,
    associated_genres: ['Lo-Fi Hip-Hop', 'Chillhop', 'Jazz Hop'],
    typical_bpm_range: '75-90',
    mood_tags: ['Melancholy', 'Nostalgic', 'Warm', 'Peaceful'],
    underground_level: 7,
    era: '2014-present',
    similar_artists: ['Jinsang', 'Idealism', 'Psalm Trees', 'Kupla'],
  },
  {
    artist_name: 'Idealism',
    style_description: `Idealism is a lo-fi hip-hop producer known for dreamy, romantic beats that blend jazz samples with electronic production and a strong visual aesthetic rooted in anime and Japanese culture. His beats are among the most melodically adventurous in lo-fi hip-hop, with chord progressions that surprise and sample choices that feel fresh. BPMs range from 75 to 100. The production has a sweetness and romanticism that distinguishes it from the more melancholy end of the lo-fi spectrum. Idealism's work has been integral to the lo-fi hip-hop YouTube channel aesthetic. Key features: romantic melodic content, jazz chord progressions, anime aesthetic, sweet emotional quality, gentle rhythmic feel.`,
    associated_genres: ['Lo-Fi Hip-Hop', 'Chillhop', 'Jazz Hop'],
    typical_bpm_range: '75-100',
    mood_tags: ['Romantic', 'Dreamy', 'Sweet', 'Peaceful'],
    underground_level: 6,
    era: '2016-present',
    similar_artists: ['Jinsang', 'tomppabeats', 'Philanthrope'],
  },
  {
    artist_name: 'Philanthrope',
    style_description: `Philanthrope is a French lo-fi hip-hop producer who brings a European sensibility to the genre with beats that feel both introspective and emotionally generous. His production draws from jazz, soul, and bossa nova, creating rhythmically varied beats with a warmth that feels distinctly welcoming. BPMs range from 75 to 100. Philanthrope often collaborates with other lo-fi producers and frequently layers live instruments with sampled material, giving his beats a hybrid quality. His work communicates a sense of care and attention — production that was made with genuine love for the music it references.`,
    associated_genres: ['Lo-Fi Hip-Hop', 'Chillhop', 'Jazz Hop'],
    typical_bpm_range: '75-100',
    mood_tags: ['Warm', 'Introspective', 'Peaceful', 'Generous'],
    underground_level: 6,
    era: '2016-present',
    similar_artists: ['Jinsang', 'tomppabeats', 'Idealism', 'Psalm Trees'],
  },
  {
    artist_name: 'Psalm Trees',
    style_description: `Psalm Trees is a lo-fi hip-hop producer known for beats with a distinctly spiritual and meditative quality, drawing from religious music traditions alongside jazz and soul. His production features gentle piano lines, brushed drums, and samples that carry an almost reverent emotional weight. BPMs typically fall in the 75-90 range. Psalm Trees' work has a healing quality — production that feels genuinely therapeutic and calming. His beats are less focused on hip-hop rhythmic drive and more on creating peaceful sonic environments.`,
    associated_genres: ['Lo-Fi Hip-Hop', 'Ambient', 'Chillhop'],
    typical_bpm_range: '75-90',
    mood_tags: ['Peaceful', 'Spiritual', 'Meditative', 'Healing'],
    underground_level: 7,
    era: '2017-present',
    similar_artists: ['tomppabeats', 'Kupla', 'Jinsang'],
  },
  {
    artist_name: 'Kupla',
    style_description: `Kupla is a Finnish lo-fi producer whose work draws from folk music traditions, nature imagery, and a distinctly Scandinavian sensibility. His beats feature acoustic guitar samples or live guitar recordings alongside traditional lo-fi elements, creating a sound that feels organic and earthen. BPMs range from 70 to 90. The emotional register of Kupla's music is quiet contentment — production that evokes forests, mornings, and simple pleasures. His work represents a branch of lo-fi hip-hop that leans into its folk influences rather than its jazz or hip-hop roots.`,
    associated_genres: ['Lo-Fi Hip-Hop', 'Folk Hop', 'Ambient'],
    typical_bpm_range: '70-90',
    mood_tags: ['Peaceful', 'Natural', 'Warm', 'Quiet'],
    underground_level: 7,
    era: '2017-present',
    similar_artists: ['tomppabeats', 'Psalm Trees', 'Philanthrope'],
  },
  {
    artist_name: "j'san",
    style_description: `j'san is a lo-fi hip-hop producer known for lush, richly textured beats that blend lo-fi aesthetics with more elaborate musical arrangements. His production features multiple melodic layers — piano, strings, woodwinds — that create a sense of musical fullness uncommon in the usually minimalist lo-fi genre. BPMs range from 80 to 100. j'san's beats feel like complete musical compositions rather than loops, with development and movement across their duration. His work represents a more ambitious approach to lo-fi hip-hop that maintains the genre's warmth and accessibility while pushing its musical complexity.`,
    associated_genres: ['Lo-Fi Hip-Hop', 'Chillhop', 'Jazz Hop'],
    typical_bpm_range: '80-100',
    mood_tags: ['Lush', 'Warm', 'Complex', 'Peaceful'],
    underground_level: 7,
    era: '2018-present',
    similar_artists: ['Jinsang', 'Philanthrope', 'Idealism'],
  },

  // ─── Boom Bap / Soul ───────────────────────────────────────────────────────
  {
    artist_name: 'Conductor Williams',
    style_description: `Conductor Williams is a New York producer deeply rooted in the boom bap tradition who has worked extensively with underground and commercial rappers. His production features heavy soul and jazz samples, hard-hitting drums with significant punch and weight, and a general aesthetic that feels connected to the golden era of New York hip-hop while remaining contemporary. BPMs typically fall between 85 and 100. Williams has a gift for finding samples that carry deep emotional resonance and constructing them into beats that feel both nostalgic and fresh. Key features: soul/jazz samples, hard punchy drums, boom bap structure, New York aesthetic.`,
    associated_genres: ['Boom Bap', 'Soul Rap', 'Underground Hip-Hop'],
    typical_bpm_range: '85-100',
    mood_tags: ['Gritty', 'Soulful', 'Hard', 'Nostalgic'],
    underground_level: 8,
    era: '2010-present',
    similar_artists: ['Apollo Brown', 'Statik Selektah', '9th Wonder', 'Pete Rock'],
  },
  {
    artist_name: 'Apollo Brown',
    style_description: `Apollo Brown is a Detroit producer whose boom bap production is characterized by deep, heavy sampling, hard drums, and a dark yet soulful aesthetic that reflects Detroit's musical heritage. His beats are among the hardest in contemporary boom bap — drums that hit with physical weight, samples chosen for their melancholy power, and an overall density that rewards close listening. BPMs typically fall between 85 and 100. Apollo Brown has worked with artists including Guilty Simpson, Ras Kass, and Ghostface Killah, and his discography represents a sustained commitment to dark, hard-hitting boom bap at its finest. Key features: heavy drums, dark soul/jazz samples, Detroit aesthetic, musical density.`,
    associated_genres: ['Boom Bap', 'Detroit Hip-Hop', 'Underground Hip-Hop'],
    typical_bpm_range: '85-100',
    mood_tags: ['Dark', 'Hard', 'Soulful', 'Dense'],
    underground_level: 8,
    era: '2007-present',
    similar_artists: ['Conductor Williams', '9th Wonder', 'Pete Rock', 'Statik Selektah'],
  },
  {
    artist_name: '9th Wonder',
    style_description: `9th Wonder is a North Carolina producer who is one of the most respected figures in boom bap and soul rap production. His production is known for its distinctive warmth — samples that feel like they were chosen not just for how they sound but for how they make you feel, combined with drums that have a live, slightly imperfect quality. BPMs range from 85 to 100. 9th Wonder has worked with virtually every major figure in underground and conscious hip-hop including Nas, Jay-Z, Kendrick Lamar, and Little Brother (his original group). His production technique emphasizes sample layering and the creation of musical environments that feel lived-in and warm.`,
    associated_genres: ['Boom Bap', 'Soul Rap', 'Conscious Hip-Hop'],
    typical_bpm_range: '85-100',
    mood_tags: ['Warm', 'Soulful', 'Positive', 'Conscious'],
    underground_level: 5,
    era: '2003-present',
    similar_artists: ['Apollo Brown', 'Pete Rock', 'Statik Selektah', '!llmind'],
  },
  {
    artist_name: 'Pete Rock',
    style_description: `Pete Rock is a Mount Vernon producer who is considered one of the founding fathers of soul-based boom bap production. His technique involves chopping horn stabs, bass lines, and melodic elements from soul and jazz records and constructing them into densely layered, rhythmically complex beats. BPMs typically sit between 90 and 105. Pete Rock's horn chops — punchy, rhythmic brass phrases used percussively — are his signature move and have influenced generations of producers. His work with CL Smooth in the early 1990s established the template for soul rap production. Key features: horn chops, complex sample layering, punchy drums, jazz/soul sample foundation.`,
    associated_genres: ['Boom Bap', 'Soul Rap', 'Jazz Rap'],
    typical_bpm_range: '90-105',
    mood_tags: ['Soulful', 'Energetic', 'Classic', 'Hard'],
    underground_level: 4,
    era: '1991-present',
    similar_artists: ['DJ Premier', '9th Wonder', 'Apollo Brown', 'Large Professor'],
  },
  {
    artist_name: 'Statik Selektah',
    style_description: `Statik Selektah is a Boston producer and DJ whose boom bap production is known for its technical proficiency and his ability to work with artists across the underground spectrum. His beats feature heavy sample usage, crisp drums, and a New York underground aesthetic that feels simultaneously classic and current. BPMs range from 90 to 110. Statik Selektah's work with artists including Nas, Action Bronson, and Joey Bada$$ demonstrates his versatility within the boom bap framework. He has a gift for selecting samples from diverse musical traditions while maintaining a cohesive boom bap aesthetic.`,
    associated_genres: ['Boom Bap', 'Underground Hip-Hop', 'New York Hip-Hop'],
    typical_bpm_range: '90-110',
    mood_tags: ['Hard', 'Gritty', 'Soulful', 'Classic'],
    underground_level: 6,
    era: '2005-present',
    similar_artists: ['9th Wonder', 'Pete Rock', 'Apollo Brown', 'DJ Premier'],
  },
  {
    artist_name: '!llmind',
    style_description: `!llmind is a Filipino-American producer based in New Jersey known for his melodic boom bap production that incorporates live instrumentation alongside sampling. His beats feature complex chord progressions, often played on live piano or keys over boom bap drum patterns, giving them a hybrid quality between traditional sample-based hip-hop and live band music. BPMs typically fall between 85 and 100. !llmind has worked with major artists including Drake, J. Cole, and Kendrick Lamar, bringing a melodic sensibility that bridges underground and commercial hip-hop production.`,
    associated_genres: ['Boom Bap', 'Soul Rap', 'R&B/Hip-Hop Crossover'],
    typical_bpm_range: '85-100',
    mood_tags: ['Melodic', 'Soulful', 'Warm', 'Complex'],
    underground_level: 5,
    era: '2005-present',
    similar_artists: ['9th Wonder', 'Pete Rock', 'Statik Selektah'],
  },

  // ─── Experimental / Electronic ─────────────────────────────────────────────
  {
    artist_name: 'Clams Casino',
    style_description: `Clams Casino is a New Jersey producer who pioneered a sound often called "cloud rap" — ethereal, heavily reverbed production that turned the spaciousness of ambient music into a vehicle for hip-hop. His beats are characterized by heavily processed vocal samples (often pitched up to angelic, inhuman registers), washes of synthesizer that function more like ambient texture than melody, and drums that feel simultaneously heavy and weightless. BPMs range from 65 to 90. Clams Casino produced early tracks for Lil B and A$AP Rocky that defined the early 2010s internet rap aesthetic. His work represents a crucial bridge between ambient electronic music and hip-hop production. Key features: processed vocal samples as texture, ambient synth washes, heavy reverb on everything, drums with unusual lightness.`,
    associated_genres: ['Cloud Rap', 'Ambient Hip-Hop', 'Experimental Trap'],
    typical_bpm_range: '65-90',
    mood_tags: ['Ethereal', 'Dreamy', 'Dark', 'Atmospheric'],
    underground_level: 7,
    era: '2010-present',
    similar_artists: ['ASAP Rocky', 'Lil B', 'Main Attrakionz', 'Ethereal'],
  },
  {
    artist_name: 'Oneohtrix Point Never',
    style_description: `Oneohtrix Point Never (Daniel Lopatin) is an experimental electronic musician and composer whose work has deeply influenced hip-hop production without being hip-hop itself. His production is characterized by dense synthesizer textures, tape manipulation, sampling of obscure and unexpected sources, and an approach to time and rhythm that feels radically displaced from conventional song structure. His work on the A$AP Rocky album "Testing" helped bring his aesthetic into hip-hop circles. For producers drawing from OPN's influence, the key concepts are: using synthesizers in ways that feel alien and organic simultaneously, allowing temporal disorientation through uneven rhythms and sample editing, and treating the studio as a compositional instrument rather than a recording device.`,
    associated_genres: ['Experimental Electronic', 'Ambient', 'Art Pop'],
    typical_bpm_range: 'Variable',
    mood_tags: ['Abstract', 'Experimental', 'Disorienting', 'Cinematic'],
    underground_level: 9,
    era: '2007-present',
    similar_artists: ['Actress', 'Arca', 'Prefuse 73', 'Tim Hecker'],
  },
  {
    artist_name: 'Arca',
    style_description: `Arca (Alejandra Ghersi) is a Venezuelan producer and artist whose work is among the most sonically radical in contemporary music, drawing from club music, industrial noise, and avant-garde electronic music. Her production is characterized by bass frequencies that seem to defy physical laws, rhythms that fragment and reassemble unpredictably, and an overall aesthetic of controlled chaos. Her production work for Björk, Kanye West, and FKA Twigs brought her experimental sensibility to wide audiences. For hip-hop producers drawing from her influence, key concepts include: treating rhythm as liquid rather than solid, using bass as a sculptural material, and allowing discomfort and beauty to coexist.`,
    associated_genres: ['Experimental Electronic', 'Club Music', 'Industrial'],
    typical_bpm_range: 'Variable',
    mood_tags: ['Experimental', 'Dark', 'Powerful', 'Dissonant'],
    underground_level: 10,
    era: '2012-present',
    similar_artists: ['Oneohtrix Point Never', 'Actress', 'Prefuse 73'],
  },
  {
    artist_name: 'Prefuse 73',
    style_description: `Prefuse 73 (Scott Herren) is one of the originators of the glitchy abstract hip-hop sound of the early 2000s. His production on albums like "Vocal Studies & Uprock Narratives" established a template for using digital signal processing to fragment and reconstruct hip-hop rhythms in ways that felt simultaneously familiar and alien. BPMs are hard to pin down due to his use of tempo shifting and beat manipulation, but typically fall between 85 and 110 in their base state. Prefuse 73's work demonstrated that hip-hop production could be an avant-garde practice, and his influence can be heard in much of today's experimental beat-making.`,
    associated_genres: ['Abstract Hip-Hop', 'Glitch Hop', 'Experimental'],
    typical_bpm_range: '85-110',
    mood_tags: ['Abstract', 'Glitchy', 'Complex', 'Intellectual'],
    underground_level: 9,
    era: '2001-present',
    similar_artists: ['Actress', 'Oneohtrix Point Never', 'Flying Lotus', 'J Dilla'],
  },
  {
    artist_name: 'Actress',
    style_description: `Actress (Darren Cunningham) is a Birmingham, UK producer whose work represents one of the most distinctive voices in experimental electronic music. His production is characterized by extreme minimalism, heavy distortion and degradation of sound sources, and a commitment to the expressive potential of damaged or degraded audio. His beats feel like they are disintegrating even as they maintain rhythmic integrity. BPMs typically fall between 100 and 130, though the overall experience of his music is one of time dissolving rather than being marked. For hip-hop producers drawing from his influence, key concepts include: productive ugliness, the expressive potential of distortion and degradation, and using rhythm to create hypnotic rather than energetic states.`,
    associated_genres: ['Experimental Electronic', 'Techno', 'Ambient'],
    typical_bpm_range: '100-130',
    mood_tags: ['Dark', 'Abstract', 'Hypnotic', 'Degraded'],
    underground_level: 10,
    era: '2008-present',
    similar_artists: ['Oneohtrix Point Never', 'Arca', 'Prefuse 73'],
  },

  // ─── UK Drill ──────────────────────────────────────────────────────────────
  {
    artist_name: 'AXL Beats',
    style_description: `AXL Beats is a leading UK drill producer whose work has defined the sonic template for the genre in the 2020s. UK drill production is characterized by ominous, minor-key melodic loops (often piano or synthesized string sounds), sliding 808 basslines that move in chromatic patterns, and a particular drum pattern featuring a distinctive hi-hat roll pattern that differs from American trap. BPMs typically fall between 140 and 145. AXL Beats' production is known for its dark, menacing atmosphere and its characteristic use of bass slides and piano riffs that feel simultaneously elegant and threatening. His work has soundtracked music by major UK drill artists.`,
    associated_genres: ['UK Drill', 'Trap'],
    typical_bpm_range: '140-145',
    mood_tags: ['Dark', 'Menacing', 'Atmospheric', 'Hard'],
    underground_level: 7,
    era: '2018-present',
    similar_artists: ['Ghosty Beats', 'CashMoneyAP', 'M1OnTheBeat'],
  },
  {
    artist_name: 'Ghosty Beats',
    style_description: `Ghosty Beats is a UK drill producer known for beats with an exceptionally dark, horror-influenced aesthetic. His production features gothic melodic elements — pipe organ samples, haunting string arrangements, and eerie synth textures — over the characteristic UK drill rhythm pattern. BPMs sit at the standard UK drill tempo of 140-145. Ghosty Beats' work represents the more theatrical end of UK drill production, incorporating cinematic horror movie aesthetics alongside the genre's standard threatening atmosphere. Key features: horror/gothic melodic elements, standard UK drill drum pattern, extremely dark atmosphere.`,
    associated_genres: ['UK Drill', 'Dark Trap', 'Gothic Rap'],
    typical_bpm_range: '140-145',
    mood_tags: ['Dark', 'Gothic', 'Horror', 'Menacing'],
    underground_level: 7,
    era: '2019-present',
    similar_artists: ['AXL Beats', 'CashMoneyAP', 'M1OnTheBeat'],
  },
  {
    artist_name: 'CashMoneyAP',
    style_description: `CashMoneyAP is a Brooklyn-born producer who helped transplant the UK drill sound to New York, becoming one of the architects of NY drill. His production blends UK drill's melodic aesthetic with a harder, more aggressive New York sensibility. BPMs sit at the 140-145 drill standard. NY drill features slightly harder-hitting drums than its UK counterpart, and CashMoneyAP's production often incorporates more dissonant, harsher melodic elements alongside the standard drill piano loops. His work with Pop Smoke was crucial in defining NY drill's distinctive sound.`,
    associated_genres: ['NY Drill', 'UK Drill', 'Trap'],
    typical_bpm_range: '140-145',
    mood_tags: ['Dark', 'Hard', 'Aggressive', 'Menacing'],
    underground_level: 6,
    era: '2018-present',
    similar_artists: ['AXL Beats', 'Ghosty Beats', '808Melo'],
  },
  {
    artist_name: '808Melo',
    style_description: `808Melo is one of the most recognized UK drill producers, known for melodic, emotionally rich beats that balance the genre's inherent darkness with unexpected beauty. His production features piano melodies with sophisticated chord voicings, string arrangements, and the characteristic UK drill 808 slide patterns. BPMs at 140-145. 808Melo's beats can feel simultaneously menacing and melancholy — productions with genuine musical depth that transcend the genre's sometimes formulaic reputation. He has worked extensively with UK drill's biggest names.`,
    associated_genres: ['UK Drill', 'Melodic Drill'],
    typical_bpm_range: '140-145',
    mood_tags: ['Melancholy', 'Dark', 'Melodic', 'Emotional'],
    underground_level: 6,
    era: '2017-present',
    similar_artists: ['AXL Beats', 'CashMoneyAP', 'Ghosty Beats'],
  },

  // ─── Trap / Dark ───────────────────────────────────────────────────────────
  {
    artist_name: "Pi'erre Bourne",
    style_description: `Pi'erre Bourne is a South Carolina producer who became one of the most influential figures in modern trap production through his work with Playboi Carti. His production is characterized by an aesthetic he calls "SossHouse" — beats that blend melodic synth lines (often sounding like video game music or anime soundtracks), heavily distorted 808s that are mixed unusually loud, and drum patterns with uncommon rhythmic patterns. BPMs range from 95 to 130. Pi'erre Bourne's beats have a colorful, almost innocent quality on their surface — bright synth melodies and video game references — that contrasts with aggressive bass and dark lyrical content. His production defined the late 2010s SoundCloud era alongside Lil Uzi Vert and Playboi Carti.`,
    associated_genres: ['Trap', 'Cloud Rap', 'Melodic Trap'],
    typical_bpm_range: '95-130',
    mood_tags: ['Dark', 'Colorful', 'Energetic', 'Playful'],
    underground_level: 6,
    era: '2016-present',
    similar_artists: ['TM88', 'Playboi Carti', 'Lil Uzi Vert'],
  },
  {
    artist_name: 'TM88',
    style_description: `TM88 is an Atlanta producer and member of 808 Mafia who has been integral to defining the melodic trap sound. His production features winding, melancholy synthesizer melodies, heavy 808 bass, and drum patterns that are simultaneously hard and emotional. BPMs range from 100 to 140. TM88 has produced some of the most emotionally resonant trap beats of the 2010s — beats that feel like crying and dancing simultaneously. His work with Future and Juice WRLD in particular demonstrated his ability to translate emotional vulnerability into trap production. Key features: winding synth melodies, heavy melodic 808, emotional bass movement, mid-range BPM trap drums.`,
    associated_genres: ['Melodic Trap', 'Atlanta Trap', 'Emo Rap'],
    typical_bpm_range: '100-140',
    mood_tags: ['Melodic', 'Emotional', 'Dark', 'Melancholy'],
    underground_level: 5,
    era: '2010-present',
    similar_artists: ["Pi'erre Bourne", 'WondaGurl', 'Southside', 'Wheezy'],
  },
  {
    artist_name: 'WondaGurl',
    style_description: `WondaGurl is a Toronto-based producer known for creating hard-hitting trap beats with a menacing, cinematic quality. She rose to prominence producing "Crown" for Jay-Z and has since become one of the most respected female producers in hip-hop. Her production features heavy, punchy drums, dark melodic elements, and a sense of scale that makes beats feel larger than their component parts. BPMs range from 100 to 140. WondaGurl's aesthetic is simultaneously modern and timeless — beats that could soundtrack mainstream rap but feel too dark and artistically ambitious to be purely commercial. Key features: punchy drums, dark melodies, sense of cinematic scale, hard-hitting energy.`,
    associated_genres: ['Trap', 'Toronto Hip-Hop', 'Dark Rap'],
    typical_bpm_range: '100-140',
    mood_tags: ['Hard', 'Dark', 'Cinematic', 'Powerful'],
    underground_level: 5,
    era: '2013-present',
    similar_artists: ['TM88', "Pi'erre Bourne", 'Boi-1da'],
  },
  {
    artist_name: 'KP Beats',
    style_description: `KP Beats is an underground trap producer known for dark, brooding beats that draw from the aesthetic of $uicideBoy$ and the gothic trap subgenre. His production features heavily distorted 808s, minor-key melodic elements drawn from metal and horror movies, and drum patterns that are simultaneously hard and dissonant. BPMs range from 110 to 150. KP Beats' production communicates a sense of menace and nihilism that connects trap music to darker rock and metal traditions. His beats are frequently used by underground rap artists who exist at the intersection of rap and rock aesthetics.`,
    associated_genres: ['Dark Trap', 'Gothic Rap', 'Trap'],
    typical_bpm_range: '110-150',
    mood_tags: ['Dark', 'Menacing', 'Gothic', 'Aggressive'],
    underground_level: 8,
    era: '2016-present',
    similar_artists: ['$uicideBoy$', 'Night Lovell', 'Pouya', 'Ghostemane'],
  },
  {
    artist_name: 'Night Lovell',
    style_description: `Night Lovell is a Canadian rapper who self-produces dark, cold beats that blend trap production with industrial and noise music aesthetics. His production features samples of distant, cold synth pads, heavy bass, and drums that hit with physical weight. BPMs range from 90 to 130. Night Lovell's aesthetic is one of existential isolation — beats that feel like driving through an empty city at 3am in winter. His production is deliberately bleak and cold, creating a mood of beautiful desolation rather than aggressive anger.`,
    associated_genres: ['Dark Trap', 'Gothic Rap', 'Cloud Rap'],
    typical_bpm_range: '90-130',
    mood_tags: ['Dark', 'Cold', 'Isolated', 'Bleak'],
    underground_level: 9,
    era: '2014-present',
    similar_artists: ['KP Beats', '$uicideBoy$', 'Pouya', 'Bones'],
  },

  // ─── Jersey Club ───────────────────────────────────────────────────────────
  {
    artist_name: 'DJ Tameil',
    style_description: `DJ Tameil is a Newark producer and DJ who is considered one of the originators of Jersey Club music. The genre is characterized by its distinctive "beats per minute" rhythms — typically 130-160 BPM — with a kick drum pattern that creates an infectious, rolling bounce completely distinct from house, techno, or other club music. Jersey Club features chopped and sped-up vocal samples (often from R&B and hip-hop hits), heavy bass, and a sense of communal energy meant for dancing in small, packed spaces. DJ Tameil's production establishes the genre's fundamental aesthetic and rhythmic template. Key features: rolling kick pattern, 130-160 BPM, chopped vocal samples, heavy bass, dance-floor energy.`,
    associated_genres: ['Jersey Club', 'Club Music'],
    typical_bpm_range: '130-160',
    mood_tags: ['Energetic', 'Hype', 'Dance', 'Celebratory'],
    underground_level: 8,
    era: '2000-present',
    similar_artists: ['DJ Sliink', 'Uniiqu3', 'TT the Artist'],
  },
  {
    artist_name: 'DJ Sliink',
    style_description: `DJ Sliink is a Newark-based producer who brought Jersey Club to wider attention through his work with trap and hip-hop artists. His production maintains the genre's characteristic rolling kick pattern and high BPM while incorporating more modern trap production elements — heavier 808s, contemporary vocal samples, and production qualities that bridge the gap between Jersey Club and mainstream trap. BPMs range from 130 to 160. DJ Sliink's work with French Montana and others helped bring Jersey Club rhythms to mainstream hip-hop listeners. Key features: Jersey Club kick pattern, contemporary trap elements, accessible sound, high energy.`,
    associated_genres: ['Jersey Club', 'Trap', 'Club Music'],
    typical_bpm_range: '130-160',
    mood_tags: ['Energetic', 'Hype', 'Dance', 'Crossover'],
    underground_level: 6,
    era: '2010-present',
    similar_artists: ['DJ Tameil', 'Uniiqu3', 'TT the Artist'],
  },
  {
    artist_name: 'Uniiqu3',
    style_description: `Uniiqu3 is a Newark producer and DJ who represents a feminist, forward-looking perspective within Jersey Club music. Her production pushes the genre's aesthetics in new directions while maintaining its core rhythmic identity. She incorporates influences from footwork, gqom, and other global dance music forms, making her work among the most globally connected in the Jersey Club scene. BPMs range from 140 to 160. Uniiqu3's beats are explicitly designed for bodies and dancing, with a particular attention to the bass frequencies that you feel rather than hear. Key features: Jersey Club rhythms, global influences, body-centered production, high BPM, heavy bass.`,
    associated_genres: ['Jersey Club', 'Club Music', 'Global Bass'],
    typical_bpm_range: '140-160',
    mood_tags: ['Energetic', 'Dance', 'Powerful', 'Hype'],
    underground_level: 7,
    era: '2015-present',
    similar_artists: ['DJ Tameil', 'DJ Sliink', 'TT the Artist'],
  },
  {
    artist_name: 'TT the Artist',
    style_description: `TT the Artist is a Baltimore DJ and producer who brings a Baltimore Club Music sensibility to the Jersey Club conversation. Baltimore Club and Jersey Club share rhythmic DNA — both featuring fast, rolling kick patterns — but Baltimore Club has its own distinct vocal style and sample aesthetic. TT the Artist's production bridges these regional traditions while bringing a contemporary sensibility to both. BPMs range from 130 to 155. Her production is high-energy and built for maximum dance-floor impact.`,
    associated_genres: ['Jersey Club', 'Baltimore Club', 'Dance Music'],
    typical_bpm_range: '130-155',
    mood_tags: ['Energetic', 'Dance', 'Hype', 'Celebratory'],
    underground_level: 6,
    era: '2015-present',
    similar_artists: ['Uniiqu3', 'DJ Sliink', 'DJ Tameil'],
  },

  // ─── Afrobeats ─────────────────────────────────────────────────────────────
  {
    artist_name: 'P2J',
    style_description: `P2J is a British-Nigerian producer who has worked with virtually every major afrobeats artist in the current era including Burna Boy, Wizkid, and Beyoncé. His production is characterized by intricate percussion arrangements that layer traditional African rhythmic concepts with modern electronic production, melodic synth lines that feel simultaneously contemporary and rooted in West African musical traditions, and a meticulous attention to sonic detail. BPMs typically fall between 95 and 115. P2J's production represents afrobeats at its most sophisticated — complex rhythmically, emotionally resonant, and globally accessible without sacrificing its Nigerian roots.`,
    associated_genres: ['Afrobeats', 'Afropop', 'R&B'],
    typical_bpm_range: '95-115',
    mood_tags: ['Joyful', 'Energetic', 'Warm', 'Sophisticated'],
    underground_level: 4,
    era: '2015-present',
    similar_artists: ['Sarz', 'Chopstix', 'Killertunes'],
  },
  {
    artist_name: 'Sarz',
    style_description: `Sarz is a Lagos-based producer who has been one of the most influential figures in contemporary afrobeats and afropop production. His beats are known for their sophisticated rhythmic layering, combining elements from Nigerian fuji music, jùjú, and contemporary electronic production. BPMs range from 100 to 120. Sarz has worked with artists including WizKid, Burna Boy, and Davido, helping shape the sound of a generation of African popular music. His production demonstrates deep roots in Nigerian musical tradition while remaining accessible to global audiences. Key features: complex African rhythmic layering, contemporary production, warm melodic elements, dance-floor energy.`,
    associated_genres: ['Afrobeats', 'Afropop', 'Dancehall'],
    typical_bpm_range: '100-120',
    mood_tags: ['Joyful', 'Energetic', 'Cultural', 'Dance'],
    underground_level: 5,
    era: '2010-present',
    similar_artists: ['P2J', 'Chopstix', 'Killertunes', 'Guilty Beatz'],
  },
  {
    artist_name: 'Chopstix',
    style_description: `Chopstix is a Lagos-based producer known for his role in shaping afrobeats' sound in the 2010s and 2020s. His production style blends Nigerian musical traditions with Jamaican dancehall influences and contemporary digital production techniques. BPMs typically sit between 95 and 115. Chopstix's beats are known for their infectious grooves, with rhythmic patterns that feel simultaneously simple and deeply complex when you try to understand how all the layers interact. He has worked with WizKid and other afrobeats artists, and his production exemplifies the genre's capacity to create music that feels simultaneously local and universal.`,
    associated_genres: ['Afrobeats', 'Dancehall', 'Afropop'],
    typical_bpm_range: '95-115',
    mood_tags: ['Joyful', 'Dance', 'Warm', 'Infectious'],
    underground_level: 5,
    era: '2012-present',
    similar_artists: ['Sarz', 'P2J', 'Killertunes'],
  },
  {
    artist_name: 'Killertunes',
    style_description: `Killertunes is a Nigerian producer who blends afrobeats, hip-hop, and R&B production aesthetics to create a distinctly cosmopolitan sound. His beats incorporate trap elements — 808 bass, hi-hat patterns — within an afrobeats rhythmic framework, creating music that appeals to both African and diaspora audiences. BPMs range from 100 to 120. Killertunes represents a generation of producers who grew up listening to both American hip-hop and Nigerian afrobeats and synthesize these influences naturally.`,
    associated_genres: ['Afrobeats', 'Afrotrap', 'Hip-Hop'],
    typical_bpm_range: '100-120',
    mood_tags: ['Energetic', 'Cultural', 'Crossover', 'Hype'],
    underground_level: 6,
    era: '2013-present',
    similar_artists: ['Sarz', 'P2J', 'Chopstix', 'Guilty Beatz'],
  },
  {
    artist_name: 'Guilty Beatz',
    style_description: `Guilty Beatz is a Ghanaian producer known for his work in afrobeats and afropop, particularly his production for artists including WizKid and Sarkodie. His production blends Ghanaian highlife influences with contemporary trap and afrobeats, creating beats with a particularly warm and melodic quality. BPMs range from 90 to 115. Guilty Beatz represents the West African tradition of production that draws from across the continent's diverse musical heritage rather than any single national tradition.`,
    associated_genres: ['Afrobeats', 'Highlife', 'Afropop'],
    typical_bpm_range: '90-115',
    mood_tags: ['Warm', 'Joyful', 'Melodic', 'Cultural'],
    underground_level: 6,
    era: '2012-present',
    similar_artists: ['Sarz', 'P2J', 'Chopstix'],
  },

  // ─── Latin Trap ────────────────────────────────────────────────────────────
  {
    artist_name: 'Tainy',
    style_description: `Tainy is a Puerto Rican producer who is considered one of the architects of Latin trap and reggaeton fusion. His production blends the rhythmic foundation of reggaeton (the dembow pattern) with trap production elements — 808 bass, atmospheric synths, and a polished, commercial aesthetic that appeals to the widest possible audience. BPMs typically sit between 90 and 120. Tainy has worked with Bad Bunny, J Balvin, and virtually every major Latin music artist of the current era. His production is technically immaculate and emotionally engaging, demonstrating that commercial pop production and artistic ambition are not mutually exclusive.`,
    associated_genres: ['Latin Trap', 'Reggaeton', 'Urban Latino'],
    typical_bpm_range: '90-120',
    mood_tags: ['Energetic', 'Romantic', 'Hype', 'Smooth'],
    underground_level: 3,
    era: '2015-present',
    similar_artists: ['Sky Rompiendo', 'El Guincho'],
  },
  {
    artist_name: 'Sky Rompiendo',
    style_description: `Sky Rompiendo is a producer associated with Bad Bunny who helped define the sound of contemporary Latin trap and reggaeton. His production style incorporates trap 808s and hi-hat patterns within the dembow rhythmic framework, creating a hybrid sound that is simultaneously rooted in Caribbean musical tradition and contemporary with global trap aesthetics. BPMs range from 95 to 125. Sky's beats have a dark, atmospheric quality alongside their danceability — production that works both in clubs and as headphone music. Key features: dembow pattern, trap 808s, dark atmospheric synths, commercial polish.`,
    associated_genres: ['Latin Trap', 'Reggaeton', 'Urban Latino'],
    typical_bpm_range: '95-125',
    mood_tags: ['Dark', 'Energetic', 'Romantic', 'Atmospheric'],
    underground_level: 5,
    era: '2017-present',
    similar_artists: ['Tainy', 'El Guincho'],
  },

  // ─── Mainstream Reference ──────────────────────────────────────────────────
  {
    artist_name: 'Metro Boomin',
    style_description: `Metro Boomin is arguably the most influential trap producer of the 2010s, responsible for the signature sound of Gucci Mane, Future, Drake, and countless others. His production is characterized by "scary" — his own term — dark, orchestral melodic elements combined with the hardest, most precise trap drums. His 808s are perfectly tuned and mixed, his hi-hats are sharp and rhythmically intricate, and his melodies often draw from horror movie aesthetics and dark orchestral music. BPMs range from 100 to 145. Metro Boomin's "if young metro don't trust you" tag has become one of the most recognizable producer signatures in music history. Key features: horror/orchestral melodic elements, precise crisp drums, perfectly tuned 808, dark atmosphere.`,
    associated_genres: ['Trap', 'Atlanta Hip-Hop'],
    typical_bpm_range: '100-145',
    mood_tags: ['Dark', 'Hard', 'Menacing', 'Atmospheric'],
    underground_level: 2,
    era: '2012-present',
    similar_artists: ['Southside', 'Wheezy', 'TM88', 'Murda Beatz'],
  },
  {
    artist_name: 'Hit-Boy',
    style_description: `Hit-Boy is a Los Angeles producer known for his versatility across multiple hip-hop subgenres and his remarkable late-career resurgence through his work with Nas on the "King's Disease" trilogy. His production style varies widely — from banging, hard-hitting New York boom bap on Nas albums to California-influenced trap on Travis Scott and Beyoncé tracks. BPMs range from 85 to 130 depending on context. Hit-Boy's greatest skill is his ability to match production to artist aesthetic — his beats never sound generic because he deeply understands what each collaborator needs. Key features: versatility across styles, precise drum programming, sophisticated sample usage, ability to adapt.`,
    associated_genres: ['Hip-Hop', 'Boom Bap', 'Trap', 'R&B'],
    typical_bpm_range: '85-130',
    mood_tags: ['Versatile', 'Hard', 'Soulful', 'Polished'],
    underground_level: 3,
    era: '2008-present',
    similar_artists: ['9th Wonder', 'Statik Selektah', 'Metro Boomin'],
  },
  {
    artist_name: 'Mustard',
    style_description: `Mustard (Dijon McFarlane) is a Los Angeles producer who pioneered the West Coast "ratchet" sound and has been one of the defining voices in LA trap and dance rap. His production is built on simple, repeating chord progressions played on synthesizers, heavy 808 bass, and drum patterns with a bouncy, danceable feel. BPMs range from 100 to 130. Mustard's signature "Mustard on the beat, hoe" tag is immediately recognizable. His beats feel simultaneously simple and irresistibly groovy — production that doesn't show off but is engineered precisely for maximum impact.`,
    associated_genres: ['West Coast Trap', 'LA Rap', 'Ratchet'],
    typical_bpm_range: '100-130',
    mood_tags: ['Hype', 'Dance', 'Energetic', 'Smooth'],
    underground_level: 2,
    era: '2011-present',
    similar_artists: ['DJ Mustard', 'Boi-1da', 'Hit-Boy'],
  },
  {
    artist_name: 'Boi-1da',
    style_description: `Boi-1da is a Jamaican-Canadian producer who has been one of the most consistent presences in mainstream hip-hop production for over a decade. His production draws from a wide range of influences — Caribbean riddim patterns, soul sampling, and hard New York boom bap — creating a distinctive hybrid sound. BPMs range from 90 to 130. He has worked with Drake, Eminem, Kendrick Lamar, and many other major artists, bringing technical precision and musical richness to each collaboration. Key features: technical precision, Caribbean/boom bap hybrid, wide stylistic range, consistent hard-hitting quality.`,
    associated_genres: ['Hip-Hop', 'Trap', 'Boom Bap'],
    typical_bpm_range: '90-130',
    mood_tags: ['Hard', 'Versatile', 'Precise', 'Dark'],
    underground_level: 3,
    era: '2006-present',
    similar_artists: ['Hit-Boy', 'Metro Boomin', 'WondaGurl'],
  },
  {
    artist_name: 'London on da Track',
    style_description: `London on da Track is an Atlanta producer who became one of the primary architects of trap music's emotional/melodic evolution, working extensively with Young Thug, Gunna, Lil Baby, and others. His production is characterized by complex melodic layers — multiple synthesizer lines moving in counterpoint — combined with the standard trap rhythmic framework. BPMs range from 90 to 135. London's beats sound simultaneously simple and musically complex when you analyze them, with chord progressions and melodic movements that would be at home in contemporary R&B or even classical composition. Key features: complex melodic layering, emotional resonance, Atlanta trap rhythms, sophisticated chord movement.`,
    associated_genres: ['Melodic Trap', 'Atlanta Hip-Hop', 'Trap Soul'],
    typical_bpm_range: '90-135',
    mood_tags: ['Melodic', 'Emotional', 'Smooth', 'Dark'],
    underground_level: 3,
    era: '2015-present',
    similar_artists: ['TM88', 'Metro Boomin', 'Wheezy'],
  },
  {
    artist_name: '$uicideBoy$',
    style_description: `$uicideBoy$ (Ruby da Cherry and $crim) are New Orleans artists who self-produce much of their material, creating one of the most distinctive sounds in underground rap. Their production blends Memphis phonk, Three 6 Mafia-influenced darkness, and lo-fi aesthetics with industrial and metal influences. BPMs vary widely from 80 to 160. Their beats feel simultaneously ancient (rooted in Memphis underground tradition) and thoroughly contemporary. The production carries themes of nihilism, substance abuse, and existential pain without glorifying them — a complicated, darkly cathartic aesthetic. Key features: Memphis phonk influence, dark samples, metal/industrial elements, lo-fi quality, wide BPM range.`,
    associated_genres: ['Dark Trap', 'Phonk', 'Gothic Rap', 'Lo-Fi Trap'],
    typical_bpm_range: '80-160',
    mood_tags: ['Dark', 'Gothic', 'Nihilistic', 'Raw'],
    underground_level: 8,
    era: '2014-present',
    similar_artists: ['Germ', 'Night Lovell', 'Pouya', 'Ghostemane'],
  },
  {
    artist_name: 'Pouya',
    style_description: `Pouya is a Miami rapper who produces and co-produces music that blends trap, phonk, and underground aesthetics into a cohesive, dark whole. His beats feature heavy 808s, ominous melodic loops, and a general sense of menace and despair that connects his work to both Southern rap tradition and the global underground. BPMs range from 90 to 130. Pouya's self-produced material demonstrates an intuitive understanding of how minimal elements can create maximum emotional impact — stripped-down beats that nevertheless feel weighty and complete.`,
    associated_genres: ['Dark Trap', 'Underground Hip-Hop', 'Phonk'],
    typical_bpm_range: '90-130',
    mood_tags: ['Dark', 'Menacing', 'Raw', 'Gritty'],
    underground_level: 8,
    era: '2015-present',
    similar_artists: ['$uicideBoy$', 'Night Lovell', 'Ghostemane', 'KP Beats'],
  },
  {
    artist_name: 'Ghostemane',
    style_description: `Ghostemane is a Florida artist who blends rap, metal, industrial, and dark electronic music into a confrontational, genre-defying sound. As a producer, his beats incorporate metal guitar samples, industrial percussion, heavy 808s, and a generally aggressive, maximalist aesthetic. BPMs range widely depending on genre — from slow dark trap (80-100 BPM) to fast industrial (140+). Ghostemane's production represents the furthest extreme of the rap-metal fusion trend, creating music that feels like it could soundtrack industrial machinery or the end of the world. Key features: metal/industrial elements, extreme aggression, heavy distortion, genre-fluid BPM range.`,
    associated_genres: ['Dark Trap', 'Industrial Rap', 'Metal Rap'],
    typical_bpm_range: '80-160',
    mood_tags: ['Aggressive', 'Dark', 'Industrial', 'Gothic'],
    underground_level: 7,
    era: '2015-present',
    similar_artists: ['$uicideBoy$', 'Night Lovell', 'Pouya', 'KP Beats'],
  },
  {
    artist_name: 'Flying Lotus',
    style_description: `Flying Lotus (Steven Ellison) is a Los Angeles producer who is the grandnephew of John Coltrane and whose music reflects that lineage — jazz-influenced, technically brilliant, and pushing constantly at the boundaries of what hip-hop and electronic music can be. His production blends jazz harmony with electronic rhythm, creating beats that feel like jazz compositions played on synthesizers and drum machines. BPMs are complex and often shifting, typically falling between 85 and 115 in their base state. Flying Lotus has worked with Kendrick Lamar (the "Until the Quiet Comes" era) and has become one of the most influential voices in avant-garde hip-hop production. Key features: jazz harmonic complexity, electronic rhythmic experimentation, Los Angeles aesthetic, genre fusion.`,
    associated_genres: ['Abstract Hip-Hop', 'Beat Music', 'Experimental Jazz'],
    typical_bpm_range: '85-115',
    mood_tags: ['Abstract', 'Intellectual', 'Warm', 'Complex'],
    underground_level: 8,
    era: '2006-present',
    similar_artists: ['Thundercat', 'Prefuse 73', 'Kaytranada', 'J Dilla'],
  },
  {
    artist_name: 'Kaytranada',
    style_description: `Kaytranada is a Haitian-Canadian producer whose work blends house music, R&B, and hip-hop into a distinctive, body-centered aesthetic. His beats are optimized for dancing — complex rhythmic patterns with a funk-influenced groove that makes physical movement feel inevitable. BPMs typically fall between 100 and 130. Kaytranada has worked with artists including Anderson .Paak, GoldLink, and Pharrell, and his debut album "99.9%" won the Grammy for Best Dance/Electronic Album. His production represents a vision of club music rooted in Black musical tradition rather than European electronic music.`,
    associated_genres: ['R&B', 'House', 'Electronic Soul'],
    typical_bpm_range: '100-130',
    mood_tags: ['Funky', 'Dance', 'Warm', 'Smooth'],
    underground_level: 5,
    era: '2014-present',
    similar_artists: ['Flying Lotus', 'Thundercat', 'Anderson .Paak'],
  },
  {
    artist_name: 'Alchemist',
    style_description: `The Alchemist is one of the most respected hip-hop producers working today, known for his sample-based production that draws from the most obscure and unexpected sources — Italian horror soundtracks, obscure Japanese funk records, Middle Eastern pop music from the 1970s. His beats are characterized by this eclecticism in sample choice combined with impeccable drum programming and an overall dark, grimy aesthetic. BPMs typically fall between 85 and 100. The Alchemist has worked with virtually every major underground rapper from Mobb Deep to Action Bronson to Billy Woods and Armand Hammer. His production demonstrates that sample-based hip-hop remains the most creative and culturally resonant form of production.`,
    associated_genres: ['Underground Hip-Hop', 'Abstract Hip-Hop', 'Boom Bap'],
    typical_bpm_range: '85-100',
    mood_tags: ['Dark', 'Gritty', 'Cinematic', 'Complex'],
    underground_level: 7,
    era: '1994-present',
    similar_artists: ['Madlib', 'DJ Premier', 'Apollo Brown', 'billy woods'],
  },
  {
    artist_name: 'Madlib',
    style_description: `Madlib (Otis Jackson Jr.) is arguably the most creative and prolific producer in hip-hop history, responsible for work spanning every corner of the genre from boom bap to psych-funk to jazz. His production is characterized by deeply obscure sample sources (Brazilian jazz, Bollywood soundtracks, Ethiopian pop), drum patterns that deliberately feel loose and imperfect to create human warmth, and an overall aesthetic of organized chaos. BPMs range widely but typically fall between 75 and 100. Madlib's collaborations with MF DOOM (Madvillainy), Kendrick Lamar (Piñata), and Freddie Gibbs (Bandana, Bandana, etc.) have produced some of the most critically celebrated albums in hip-hop. Key features: obscure eclectic samples, deliberately imperfect drums, musical depth, constantly surprising.`,
    associated_genres: ['Underground Hip-Hop', 'Abstract Hip-Hop', 'Beat Music'],
    typical_bpm_range: '75-100',
    mood_tags: ['Abstract', 'Warm', 'Eclectic', 'Complex'],
    underground_level: 8,
    era: '1994-present',
    similar_artists: ['Alchemist', 'J Dilla', 'MF DOOM', 'Flying Lotus'],
  },
  {
    artist_name: 'DJ Premier',
    style_description: `DJ Premier is the production half of Gang Starr and one of the definitive voices in New York boom bap production. His production style — scratched vocal samples as hooks, punchy drums with a characteristic snap, and a gritty, urban aesthetic — defined New York hip-hop in the 1990s and continues to be the reference point for authentic boom bap. BPMs typically fall between 90 and 105. DJ Premier's production for Gang Starr, Biggie, Nas, Jay-Z, and many others has created a body of work that represents hip-hop production at its most technically refined. Key features: scratched vocal hooks, punchy snappy drums, gritty New York aesthetic, sample-based.`,
    associated_genres: ['Boom Bap', 'New York Hip-Hop', 'Underground Hip-Hop'],
    typical_bpm_range: '90-105',
    mood_tags: ['Gritty', 'Hard', 'Classic', 'Urban'],
    underground_level: 4,
    era: '1988-present',
    similar_artists: ['Pete Rock', 'Alchemist', 'Apollo Brown', 'Large Professor'],
  },
  {
    artist_name: 'MF DOOM',
    style_description: `MF DOOM (Daniel Dumile) was one of the most distinctive artist-producers in hip-hop history, creating beats under aliases including Metal Fingers and Madvillain (with Madlib). His production style is characterized by samples from cartoons, old movies, and unusual sources layered with jazz and soul records, creating beats that feel simultaneously playful and dark. BPMs range from 80 to 100. DOOM's production has a kitchen-sink eclecticism — nothing is off limits as a sample source — combined with enough musical sophistication to make everything cohere. His production on Madvillainy, Operation: Doomsday, and MM..FOOD remains definitive.`,
    associated_genres: ['Underground Hip-Hop', 'Abstract Hip-Hop', 'Boom Bap'],
    typical_bpm_range: '80-100',
    mood_tags: ['Abstract', 'Playful', 'Dark', 'Complex'],
    underground_level: 9,
    era: '1999-2020',
    similar_artists: ['Madlib', 'Alchemist', 'Flying Lotus', 'Prefuse 73'],
  },
  {
    artist_name: 'Thundercat',
    style_description: `Thundercat (Stephen Bruner) is a Los Angeles bassist, singer, and producer whose work occupies a unique intersection of jazz fusion, R&B, and electronic music. As a producer and collaborator, he brings extraordinary musical sophistication — advanced jazz harmony, incredibly fluid bass playing, and an ability to make technically complex music feel emotionally accessible. His work with Flying Lotus, Kendrick Lamar (To Pimp a Butterfly), and his own solo albums demonstrates how jazz tradition can be synthesized with contemporary production. BPMs range from 80 to 130. Thundercat represents a vision of hip-hop production where traditional musicianship and contemporary production are inseparable.`,
    associated_genres: ['Jazz Fusion', 'R&B', 'Electronic Soul'],
    typical_bpm_range: '80-130',
    mood_tags: ['Complex', 'Warm', 'Funky', 'Abstract'],
    underground_level: 6,
    era: '2011-present',
    similar_artists: ['Flying Lotus', 'Kaytranada', 'Kendrick Lamar'],
  },
]

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

async function seed() {
  console.log(`Seeding ${ARTISTS.length} artists into music_knowledge...`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < ARTISTS.length; i++) {
    const artist = ARTISTS[i]
    try {
      process.stdout.write(`[${i + 1}/${ARTISTS.length}] ${artist.artist_name}... `)

      const embedding = await getEmbedding(artist.style_description)

      const { error } = await supabase.from('music_knowledge').upsert(
        {
          artist_name: artist.artist_name,
          style_description: artist.style_description,
          associated_genres: artist.associated_genres,
          typical_bpm_range: artist.typical_bpm_range,
          mood_tags: artist.mood_tags,
          underground_level: artist.underground_level,
          era: artist.era,
          similar_artists: artist.similar_artists,
          embedding,
        },
        { onConflict: 'artist_name' }
      )

      if (error) {
        console.log(`ERROR: ${error.message}`)
        errorCount++
      } else {
        console.log('OK')
        successCount++
      }

      // Rate limit: OpenAI free tier is 3 RPM for embeddings
      await new Promise((r) => setTimeout(r, 350))
    } catch (err) {
      console.log(`EXCEPTION: ${err}`)
      errorCount++
    }
  }

  console.log(`\nDone. ${successCount} succeeded, ${errorCount} failed.`)
}

seed().catch(console.error)
