// Полные списки из Genshin Impact Wiki (версия 7.1). Предстоящие герои не включены.
export type Element = 'pyro' | 'hydro' | 'anemo' | 'electro' | 'dendro' | 'cryo' | 'geo';
export type Weapon = 'sword' | 'claymore' | 'polearm' | 'catalyst' | 'bow';

export interface HeroEntry {
  name: string;
  element: Element;
  weapon: Weapon;
  region: string;
}

// Имя|стихия|оружие|регион. У Путешественника и Манекена стихия в игре меняется, здесь взят анемо.
// Анастасия (Царица) в игре пока не играбельна: оружие для неё выбрано здесь, а не взято из игры.
const HERO_TABLE = `
Aino|hydro|claymore|Nod-Krai
Albedo|geo|sword|Mondstadt
Alhaitham|dendro|sword|Sumeru
Aloy|cryo|bow|None
Alyosha|electro|polearm|Snezhnaya
Amber|pyro|bow|Mondstadt
Arataki Itto|geo|claymore|Inazuma
Arlecchino|pyro|polearm|Snezhnaya
Baizhu|dendro|catalyst|Liyue
Barbara|hydro|catalyst|Mondstadt
Beidou|electro|claymore|Liyue
Bennett|pyro|sword|Mondstadt
Candace|hydro|polearm|Sumeru
Charlotte|cryo|catalyst|Fontaine
Chasca|anemo|bow|Natlan
Chevreuse|pyro|polearm|Fontaine
Chiori|geo|sword|Inazuma
Chongyun|cryo|claymore|Liyue
Citlali|cryo|catalyst|Natlan
Clorinde|electro|sword|Fontaine
Collei|dendro|bow|Sumeru
Columbina|hydro|catalyst|Nod-Krai
Cyno|electro|polearm|Sumeru
Dahlia|hydro|sword|Mondstadt
Dehya|pyro|claymore|Sumeru
Diluc|pyro|claymore|Mondstadt
Diona|cryo|bow|Mondstadt
Dori|electro|claymore|Sumeru
Durin|pyro|sword|Mondstadt
Emilie|dendro|polearm|Fontaine
Escoffier|cryo|polearm|Fontaine
Eula|cryo|claymore|Mondstadt
Faruzan|anemo|bow|Sumeru
Fischl|electro|bow|Mondstadt
Flins|electro|polearm|Nod-Krai
Freminet|cryo|claymore|Fontaine
Furina|hydro|sword|Fontaine
Gaming|pyro|claymore|Liyue
Ganyu|cryo|bow|Liyue
Gorou|geo|bow|Inazuma
Hu Tao|pyro|polearm|Liyue
Iansan|electro|polearm|Natlan
Ifa|anemo|catalyst|Natlan
Illuga|geo|polearm|Nod-Krai
Ineffa|electro|polearm|Nod-Krai
Jahoda|anemo|bow|Nod-Krai
Jean|anemo|sword|Mondstadt
Kachina|geo|polearm|Natlan
Kaedehara Kazuha|anemo|sword|Inazuma
Kaeya|cryo|sword|Mondstadt
Kamisato Ayaka|cryo|sword|Inazuma
Kamisato Ayato|hydro|sword|Inazuma
Kaveh|dendro|claymore|Sumeru
Keqing|electro|sword|Liyue
Kinich|dendro|claymore|Natlan
Kirara|dendro|sword|Inazuma
Klee|pyro|catalyst|Mondstadt
Kujou Sara|electro|bow|Inazuma
Kuki Shinobu|electro|sword|Inazuma
Lan Yan|anemo|catalyst|Liyue
Lauma|dendro|catalyst|Nod-Krai
Layla|cryo|sword|Sumeru
Linnea|geo|bow|Nod-Krai
Lisa|electro|catalyst|Mondstadt
Lohen|cryo|polearm|Mondstadt
Lynette|anemo|sword|Fontaine
Lyney|pyro|bow|Fontaine
Mavuika|pyro|claymore|Natlan
Mika|cryo|polearm|Mondstadt
Mona|hydro|catalyst|Mondstadt
Mualani|hydro|catalyst|Natlan
Nahida|dendro|catalyst|Sumeru
Navia|geo|claymore|Fontaine
Nefer|dendro|catalyst|Nod-Krai
Neuvillette|hydro|catalyst|Fontaine
Nicole|pyro|catalyst|None
Nilou|hydro|sword|Sumeru
Ningguang|geo|catalyst|Liyue
Noelle|geo|claymore|Mondstadt
Odette|cryo|sword|Snezhnaya
Ororon|electro|bow|Natlan
Prune|anemo|catalyst|Mondstadt
Qiqi|cryo|sword|Liyue
Raiden Shogun|electro|polearm|Inazuma
Razor|electro|claymore|Mondstadt
Rosaria|cryo|polearm|Mondstadt
Sandrone|cryo|claymore|Snezhnaya
Sangonomiya Kokomi|hydro|catalyst|Inazuma
Sayu|anemo|claymore|Inazuma
Sethos|electro|bow|Sumeru
Shenhe|cryo|polearm|Liyue
Shikanoin Heizou|anemo|catalyst|Inazuma
Sigewinne|hydro|bow|Fontaine
Skirk|cryo|sword|None
Sucrose|anemo|catalyst|Mondstadt
Tartaglia|hydro|bow|Snezhnaya
Thoma|pyro|polearm|Inazuma
Tighnari|dendro|bow|Sumeru
Traveler|anemo|sword|None
Varesa|electro|catalyst|Natlan
Varka|anemo|claymore|Mondstadt
Venti|anemo|bow|Mondstadt
Vesna|anemo|sword|Snezhnaya
Vodyanitsa|hydro|catalyst|Snezhnaya
Wanderer|anemo|catalyst|Sumeru
Wonderland Manekin|anemo|sword|None
Wriothesley|cryo|catalyst|Fontaine
Xiangling|pyro|polearm|Liyue
Xianyun|anemo|catalyst|Liyue
Xiao|anemo|polearm|Liyue
Xilonen|geo|sword|Natlan
Xingqiu|hydro|sword|Liyue
Xinyan|pyro|claymore|Liyue
Yae Miko|electro|catalyst|Inazuma
Yanfei|pyro|catalyst|Liyue
Yaoyao|dendro|polearm|Liyue
Yelan|hydro|bow|Liyue
Yoimiya|pyro|bow|Inazuma
Yumemizuki Mizuki|anemo|catalyst|Inazuma
Yun Jin|geo|polearm|Liyue
Zhongli|geo|polearm|Liyue
Zibai|geo|sword|Liyue
Anastasya|cryo|catalyst|Snezhnaya
`;

export const HEROES: HeroEntry[] = HERO_TABLE.trim().split('\n').map((line) => {
  const [name, element, weapon, region] = line.split('|');
  return { name, element: element as Element, weapon: weapon as Weapon, region };
});

const lines = (text: string) => [...new Set(text.trim().split('\n').map((s) => s.trim()))];

export const ENEMY_FAMILIES: Record<string, string[]> = {
  'Элементальные существа': lines(`
Pyro Slime
Large Pyro Slime
Hydro Slime
Large Hydro Slime
Anemo Slime
Large Anemo Slime
Electro Slime
Large Electro Slime
Mutant Electro Slime
Dendro Slime
Large Dendro Slime
Cryo Slime
Large Cryo Slime
Geo Slime
Large Geo Slime
Eye of the Storm
Pyro Hypostasis
Hydro Hypostasis
Anemo Hypostasis
Electro Hypostasis
Dendro Hypostasis
Cryo Hypostasis
Geo Hypostasis
Oceanid
Thunder Manifestation
Pyro Specter
Hydro Specter
Anemo Specter
Electro Specter
Dendro Specter
Cryo Specter
Geo Specter
Tainted Water-Splitting Phantasm
Tainted Water-Spouting Phantasm
Hydro Tulpa
Blazing Brilliance: Frostnight Scion
Surging Currents: Frostnight Scion
Veiled Cloudchaser: Frostnight Scion
Gleaming Charge: Frostnight Scion
Tangled Vines: Frostnight Scion
Icy Crystal: Frostnight Scion
Gilded Sunshard: Frostnight Scion
Frostnight Herra`),
  'Хиличурлы': lines(`
Hilichurl
Hilichurl Fighter
Hilichurl Berserker
Wooden Shield Hilichurl Guard
Ice Shield Hilichurl Guard
Rock Shield Hilichurl Guard
Hilichurl Shooter
Pyro Hilichurl Shooter
Electro Hilichurl Shooter
Cryo Hilichurl Shooter
Hilichurl Grenadier
Electro Hilichurl Grenadier
Cryo Hilichurl Grenadier
Unusual Hilichurl
Wooden Shieldwall Mitachurl
Rock Shieldwall Mitachurl
Ice Shieldwall Mitachurl
Blazing Axe Mitachurl
Crackling Axe Mitachurl
Thunderhelm Lawachurl
Frostarm Lawachurl
Stonehide Lawachurl
Hydro Samachurl
Anemo Samachurl
Electro Samachurl
Dendro Samachurl
Cryo Samachurl
Geo Samachurl
Hydro Hilichurl Rogue
Anemo Hilichurl Rogue`),
  'Бездна': lines(`
Pyro Abyss Mage
Hydro Abyss Mage
Electro Abyss Mage
Cryo Abyss Mage
Abyss Herald: Wicked Torrents
Abyss Herald: Frost Fall
Abyss Lector: Fathomless Flames
Abyss Lector: Violet Lightning
Iniquitous Baptist
Rockfond Rifthound Whelp
Thundercraven Rifthound Whelp
Rockfond Rifthound
Thundercraven Rifthound
Golden Wolflord
Shadowy Husk: Standard Bearer
Shadowy Husk: Line Breaker
Shadowy Husk: Defender
Black Serpent Knight: Windcutter
Black Serpent Knight: Rockbreaker Ax
Large Shatterstone Breacher Primus
Shatterstone Breacher Primus
Large Overgrown Breacher Primus
Overgrown Breacher Primus
Tenebrous Mimiflora
Tenebrous Papilla
Wilderness Exile
Wilderness Hunter
Fisher of Hidden Depths
Lord of the Hidden Depths: Whisperer of Nightmares`),
  'Фатуи': lines(`
Fatui Skirmisher - Pyroslinger Bracer
Fatui Skirmisher - Hydrogunner Legionnaire
Fatui Skirmisher - Anemoboxer Vanguard
Fatui Skirmisher - Electrohammer Vanguard
Fatui Skirmisher - Cryogunner Legionnaire
Fatui Skirmisher - Geochanter Bracer
Fatui Pyro Agent
Fatui Electro Cicin Mage
Fatui Cryo Cicin Mage
Mirror Maiden
Wind Operative
Frost Operative
Oprichniki Line Trooper
Oprichniki Support Trooper
Oprichniki Grenadier
Oprichniki Vanguard
Oprichniki Medic
Oprichniki Bombardier
Oprichniki Fireblade Shock Trooper
Oprichniki Hailstorm Cannoneer
Oprichniki Thunderblitz Gvardiya
Close Combat Storm Landcruiser
Close Combat Scout Landcruiser
Force Recon Storm Landcruiser
Force Recon Scout Landcruiser
Force Recon Ground Effect Landcruiser
Cutting Edge All-Purpose Storm Landcruiser
Cutting Edge All-Purpose Scout Landcruiser
Cutting Edge Fire Support Ground Effect Landcruiser
Super-Heavy Landrover: Mechanized Fortress`),
  'Автоматоны': lines(`
Ruin Guard
Ruin Hunter
Ruin Grader
Ruin Cruiser
Ruin Destroyer
Ruin Defender
Ruin Scout
Ruin Serpent
Perpetual Mechanical Array
Ruin Drake: Earthguard
Ruin Drake: Skywatch
Aeonblight Drake
Primal Construct: Repulsor
Primal Construct: Reshaper
Primal Construct: Prospector
Algorithm of Semi-Intransient Matrix of Overseer Network
Recon Log Mek
Arithmetic Enhancer Mek
Underwater Survey Mek
Geological Survey Mek
Underwater Patrol Mek
Deepwater Assault Mek
Nimble Harvester Mek
Area Alert Mek
Suppression Specialist Mek
Assault Specialist Mek
Annihilation Specialist Mek
Construction Specialist Mek
Icewind Suite
Experimental Field Generator
Maguu Kenki
Secret Source Automaton: Hunter-Seeker
Secret Source Automaton: Configuration Device
Secret Source Automaton: Overseer Device
Precursor's Secret Source Matrix of Overseer Network
Knuckle Duckle
Domain Keeper
Watcher: Fallen Vigil`),
  'Другие фракции людей': lines(`
Treasure Hoarders: Scout
Treasure Hoarders: Pyro Potioneer
Treasure Hoarders: Hydro Potioneer
Treasure Hoarders: Electro Potioneer
Treasure Hoarders: Cryo Potioneer
Treasure Hoarders: Handyman
Treasure Hoarders: Marksman
Treasure Hoarders: Gravedigger
Treasure Hoarders: Seaman
Treasure Hoarders: Pugilist
Treasure Hoarders: Crusher
Nobushi: Jintouban
Nobushi: Hitsukeban
Nobushi: Kikouban
Kairagi: Fiery Might
Kairagi: Dancing Thunder
Eremite Axe Vanguard
Eremite Crossbow
Eremite Ravenbeak Halberdier
Eremite Linebreaker
Eremite Sword-Dancer
Eremite Desert Clearwater
Eremite Sunfrost
Eremite Daythunder
Eremite Galehunter
Eremite Stone Enchanter
Eremite Scorching Loremaster
Eremite Floral Ring-Dancer
Forged Sand Interrogator
Forged Sand Shieldbreaker
Forged Sand Javelineer
Swiftstep Seeker
Swiftstep Storm Scout
Swiftstep Armed Courier
Flowing Blade Skirmisher
Flowing Blade Grease-Saw
Flowing Blade Harpoon-Thrower
Winged Warrior: Skysoarer
Winged Warrior: Feathershedder
Winged Warrior: Skymaster
Spiritspeaker Warrior: Determinator
Spiritspeaker Warrior: Psychokinetic
Spiritspeaker Warrior: Contemplator
Ferocious Warrior: Human Ram
Ferocious Warrior: Wrestler
Ferocious Warrior: Grappler
Tepetlisaurus Warrior: Shard Striker
Tepetlisaurus Warrior: Rockbreaker Blade
Yumkasaurus Warrior: Whirling Leaves
Yumkasaurus Warrior: Flowing Skyfire
Koholasaurus Warrior: Waveshuttler
Koholasaurus Warrior: Reefsplitter
Qucusaurus Warrior: Heartstar Hammer
Qucusaurus Warrior: Blazing Sky
Iktomisaurus Warrior: Icy Tidebearer
Iktomisaurus Warrior: Cryocrystal Cannon
Tatankasaurus Warrior: Skybreaker
Tatankasaurus Warrior: Spiritlight Chaser
Wayward Hermetic Spiritspeaker`),
  'Мистические звери': lines(`
Pyro Whopperflower
Electro Whopperflower
Cryo Whopperflower
Pyro Regisvine
Electro Regisvine
Cryo Regisvine
Geovishap Hatchling
Geovishap
Primo Geovishap
Primordial Bathysmal Vishap
Rimebiter Bathysmal Vishap
Bolteater Bathysmal Vishap
Hydro Cicin
Electro Cicin
Cryo Cicin
Floating Hydro Fungus
Floating Anemo Fungus
Floating Dendro Fungus
Whirling Pyro Fungus
Whirling Electro Fungus
Whirling Cryo Fungus
Stretchy Pyro Fungus
Stretchy Anemo Fungus
Stretchy Electro Fungus
Stretchy Geo Fungus
Grounded Hydroshroom
Winged Dendroshroom
Winged Cryoshroom
Grounded Geoshroom
Jadeplume Terrorshroom
Consecrated Horned Crocodile
Consecrated Fanged Beast
Consecrated Red Vulture
Consecrated Scorpion
Consecrated Flying Serpent
Setekh Wenut
Blubberbeast
Hunter's Ray
Armored Crab
Sternshield Crab
Emperor of Fire and Iron
Hat Jellyfish
Bubbly Seahorse
Bubbler Seahorse
Millennial Pearl Seahorse
Ball Octopus
Angelic Sea Hare
Cherubic Sea Hare
Xuanwen Beast
Solitary Suanni
Praetorian Golem
Legatus Golem
Tepetlisaur Whelp
Tepetlisaurus
Koholasaur Whelp
Koholasaurus
Yumkasaur Whelp
Yumkasaurus
Gluttonous Yumkasaur Mountain King
Qucusaurus Chick
Qucusaurus
Goldflame Qucusaur Tyrant
Iktomisaurus Chick
Iktomisaurus
Tatankasaur Whelp
Tatankasaurus
Eroding Avatar of Lava
Fluid Avatar of Lava
Lava Dragon Statue
Rock-Cavernous Wayob Manifestation
Flow-Inverted Wayob Manifestation
Foliar-Swift Wayob Manifestation
Biting-Cold Wayob Manifestation
Burning-Aflame Wayob Manifestation
Thundering Wayob Manifestation
Furnace Shell Mountain Weasel
Radiant Antelope
Radiant Bladehorn
Radiant Lunapod
Radiant Glacial Wolf
Radiant Moonfly
Radiant Moongecko
Volkodlak Raider
Volkodlak Sharpshooter
Volkodlak Lobber
Volkodlak Basher
Leomastiff Guard
Long-Eared Striker
Channel Contact
Fanged Zealot
Voywolf Hunter
Glaciomancer
Glacial Warden
Guardian Blade of Drifting Snow
Winged Halberd-Knight
Winged Soarer Knight
Juvenile Tree Segment
Rugged Elder Leshy
Immortal Construct
Chimeric Armored Beast
Chimeric Burrowbeast
Chimeric Winged Elephant
Chimeric Horned Bear
Chimeric Winged Lion`),
  'Особые враги': lines(`
Stormterror
Lupus Boreas, Dominator of Wolves
Childe
Azhdaha
La Signora
Magatsu Mitake Narukami no Mikoto
Shouki no Kami, the Prodigal
Guardian of Apep's Oasis
All-Devouring Narwhal
The Knave
Lord of Eroded Primal Fire
The Game Before the Gate
The Doctor
Il Dottore`),
  'Вне архива': lines(`
Hydro Mimic Boar
Hydro Mimic Crab
Hydro Mimic Crane
Hydro Mimic Finch
Hydro Mimic Frog
Hydro Mimic Mallard
Hydro Mimic Raptor
Hydro Mimic Squirrel`),
};
