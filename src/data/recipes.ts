// Гибриды регионов: id, имя, родитель, родитель, намёк для альманаха.
export type RecipeRow = [string, string, string, string, string];

export const REGION_RECIPES: RecipeRow[] = [
  // Мондштадт
  ['dawn_blade', 'Клинок рассвета', 'diluc', 'jean', 'Два защитника города на одной линии'],
  ['spindrift_knight', 'Рыцарь штормовой пены', 'eula', 'rosaria', 'Лёд Ордо и лёд собора'],
  ['alchemic_sun', 'Алхимическое солнце', 'albedo', 'sucrose', 'Учитель и ученица в одной лаборатории'],
  ['astral_tide', 'Звёздный прилив', 'mona', 'barbara', 'Две песни воды'],
  ['free_wind', 'Вольный ветер', 'venti', 'jean', 'Бард и магистр знают цену свободе'],
  ['ember_pup', 'Пламенная пара', 'durin', 'klee', 'Огонь любит играть'],
  ['tide_vow', 'Клятва прилива', 'dahlia', 'mika', 'Служители города держат строй'],
  ['north_wolf', 'Северный волк', 'varka', 'razor', 'Великий магистр и волчонок'],
  ['frost_sentinel', 'Морозный дозор', 'lohen', 'diona', 'Холод на посту'],
  ['gale_sprite', 'Шёпот бури', 'prune', 'sucrose', 'Два лёгких ветерка'],
  ['grand_order', 'Великий орден', 'dawn_blade', 'free_wind', 'Весь Ордо Фавониус в одной клетке'],
  ['glacier_court', 'Ледяной двор', 'spindrift_knight', 'frost_sentinel', 'Лёд, который не тает'],
  ['windblume_finale', 'Финал Праздника ветров', 'grand_order', 'alchemic_sun', 'Праздник достоин алхимии'],

  // Ли Юэ
  ['geo_pact', 'Каменный договор', 'zhongli', 'ningguang', 'Камень помнит контракты'],
  ['boiling_duet', 'Кипящий дуэт', 'xiangling', 'xingqiu', 'Гобá и меч под дождём'],
  ['undying_rite', 'Ритуал Ваншэн', 'hu_tao', 'qiqi', 'Живым и мёртвым есть о чём поговорить'],
  ['qilin_snow', 'Снег цилиня', 'ganyu', 'shenhe', 'Две ученицы Адептов'],
  ['storm_captain', 'Капитан бури', 'beidou', 'yelan', 'Море и молния у Ли Юэ'],
  ['yaksha_wind', 'Ветер якши', 'xiao', 'xianyun', 'Адепт спускается с небес'],
  ['rock_rhythm', 'Ритм скалы', 'xinyan', 'yun_jin', 'Рок встречает оперу'],
  ['exorcist_blade', 'Клинок экзорциста', 'chongyun', 'keqing', 'Холод и молния против нечисти'],
  ['verdant_cure', 'Зелёное лекарство', 'baizhu', 'yaoyao', 'Травы Бубу'],
  ['lion_dance', 'Танец льва', 'gaming', 'lan_yan', 'Праздник с ветром и огнём'],
  ['legal_flame', 'Законное пламя', 'yanfei', 'zibai', 'Закон стоит на камне'],
  ['liyue_court', 'Совет Цисин', 'geo_pact', 'storm_captain', 'Гавань защищают все вместе'],
  ['adeptus_gate', 'Врата Адептов', 'yaksha_wind', 'qilin_snow', 'Адепты отвечают на зов'],
  ['guili_oath', 'Клятва Гуйли', 'liyue_court', 'adeptus_gate', 'Люди и Адепты снова вместе'],

  // Инадзума
  ['eternal_thunder', 'Вечная гроза', 'raiden_shogun', 'yae_miko', 'Сёгун и Гудзи'],
  ['snow_blossom', 'Снежная сакура', 'kamisato_ayaka', 'kamisato_ayato', 'Брат и сестра Камисато'],
  ['maple_wind', 'Кленовый ветер', 'kaedehara_kazuha', 'sayu', 'Ронин и ниндзя-барсук'],
  ['festival_fire', 'Огни фестиваля', 'yoimiya', 'thoma', 'Фейерверк и верный друг'],
  ['oni_charge', 'Рывок они', 'arataki_itto', 'kuki_shinobu', 'Банда Аратаки в полном составе'],
  ['pearl_tide', 'Жемчужный прилив', 'sangonomiya_kokomi', 'kujou_sara', 'Бывшие враги заключили мир'],
  ['dream_silk', 'Шёлк сновидений', 'yumemizuki_mizuki', 'chiori', 'Сны и ткань'],
  ['tracker_mark', 'Метка сыщика', 'shikanoin_heizou', 'gorou', 'Сыщик и генерал идут по следу'],
  ['courier_blade', 'Клинок курьера', 'kirara', 'kaedehara_kazuha', 'Посылка с ветром'],
  ['musou_no_hitotachi', 'Мусо-но хитотати', 'eternal_thunder', 'maple_wind', 'Клинок, рассекающий небо'],
  ['tenryou_guard', 'Стража Тэнрё', 'snow_blossom', 'tracker_mark', 'Комиссии работают вместе'],
  ['narukami_vow', 'Клятва Наруками', 'musou_no_hitotachi', 'tenryou_guard', 'Вечность и стремление'],

  // Сумеру
  ['lesser_lord', 'Малая Властительница', 'nahida', 'alhaitham', 'Мудрость и её секретарь'],
  ['forest_watch', 'Лесной дозор', 'tighnari', 'collei', 'Учитель и лесной страж'],
  ['sand_judge', 'Песчаный судья', 'cyno', 'sethos', 'Закон пустыни'],
  ['dance_of_bloom', 'Танец цветения', 'nilou', 'kaveh', 'Цветы на сцене Зубаира'],
  ['sun_mercenary', 'Солнечный наёмник', 'dehya', 'candace', 'Защитницы пустыни'],
  ['winged_scholar', 'Крылатая учёная', 'faruzan', 'wanderer', 'Две загадки ветра'],
  ['sleepy_star', 'Сонная звезда', 'layla', 'dori', 'Бессонница за мору'],
  ['akademiya_prime', 'Первый мудрец Академии', 'lesser_lord', 'forest_watch', 'Лес и знание'],
  ['desert_tempest', 'Пустынная буря', 'sand_judge', 'sun_mercenary', 'Песок поднимается'],
  ['irminsul_dream', 'Сон Ирминсуля', 'akademiya_prime', 'desert_tempest', 'Лес и пустыня одного мира'],

  // Фонтейн
  ['iudex_flood', 'Потоп юдекса', 'neuvillette', 'furina', 'Суд и сцена'],
  ['magic_show', 'Великое шоу', 'lyney', 'lynette', 'Брат и сестра выходят на сцену'],
  ['hearth_brigade', 'Бригада очага', 'freminet', 'wriothesley', 'Обитатели Меропида'],
  ['gold_rose', 'Золотая роза', 'navia', 'chevreuse', 'Шпага-пушка и мушкет'],
  ['thunder_duel', 'Громовая дуэль', 'clorinde', 'sigewinne', 'Дуэлянт и врач'],
  ['grand_cuisine', 'Высокая кухня', 'escoffier', 'charlotte', 'Сенсация за столом'],
  ['verdant_perfume', 'Зелёные духи', 'emilie', 'lyney', 'Аромат и фокус'],
  ['palais_verdict', 'Вердикт Палаты', 'iudex_flood', 'thunder_duel', 'Приговор исполнен'],
  ['belle_epoque', 'Прекрасная эпоха', 'magic_show', 'gold_rose', 'Весь Фонтейн в огнях'],
  ['primordial_sea', 'Первозданное море', 'palais_verdict', 'belle_epoque', 'Пророчество отменяется'],

  // Натлан
  ['archon_flame', 'Пламя архонта', 'mavuika', 'xilonen', 'Огонь и кузница'],
  ['wave_rider', 'Покоритель волн', 'mualani', 'kachina', 'Племя источника'],
  ['jungle_hunter', 'Охотник джунглей', 'kinich', 'citlali', 'Охота и шаманка'],
  ['sky_gun', 'Небесный стрелок', 'chasca', 'ororon', 'Пуля и молния'],
  ['roaring_fist', 'Рёв кулака', 'varesa', 'iansan', 'Племя вулкана тренируется'],
  ['doctor_breeze', 'Доктор-ветерок', 'ifa', 'chasca', 'Ветеринар зовёт ящеров'],
  ['night_kingdom', 'Ночное царство', 'jungle_hunter', 'sky_gun', 'Ночь Натлана не спит'],
  ['war_of_tribes', 'Война племён', 'wave_rider', 'roaring_fist', 'Все племена у одного огня'],
  ['pyro_sovereign', 'Солнце Натлана', 'archon_flame', 'war_of_tribes', 'Имена героев возвращаются'],

  // Нод-Край
  ['moon_rite', 'Лунный обряд', 'columbina', 'lauma', 'Девы лунной ночи'],
  ['frost_lantern', 'Морозный фонарь', 'flins', 'ineffa', 'Молния в холодной ночи'],
  ['sand_echo', 'Песчаное эхо', 'nefer', 'jahoda', 'Легенды спешат на север'],
  ['stone_hearth', 'Каменный очаг', 'illuga', 'linnea', 'Камень согревает север'],
  ['water_mill', 'Водяная мельница', 'aino', 'columbina', 'Вода крутит колесо'],
  ['moonlit_court', 'Лунный двор', 'moon_rite', 'frost_lantern', 'Ночь становится светлее'],
  ['nod_krai_crown', 'Корона Нод-Края', 'moonlit_court', 'stone_hearth', 'Север просыпается'],

  // Снежная
  ['harbinger_flame', 'Пламя предвестников', 'arlecchino', 'tartaglia', 'Двое предвестников заодно'],
  ['puppet_winter', 'Кукольная зима', 'sandrone', 'odette', 'Механика и лёд'],
  ['snow_songs', 'Песни снега', 'vesna', 'vodyanitsa', 'Сказки Снежной оживают'],
  ['tundra_spear', 'Копьё тундры', 'alyosha', 'odette', 'Молния над снегом'],
  ['tsaritsa_court', 'Двор Царицы', 'harbinger_flame', 'puppet_winter', 'Дворец приглашает'],
  ['eternal_winter', 'Вечная зима', 'tsaritsa_court', 'snow_songs', 'Зима наступает навсегда'],
  ['gods_love', 'Любовь Царицы', 'anastasya', 'odette', 'Богиня любви приглашает ко двору'],
  ['snow_throne', 'Трон Снежной', 'gods_love', 'eternal_winter', 'Вечная зима склоняется перед своей Царицей'],

  // Линии трёх богинь: их гибриды сохраняют атаку по всему полю.
  ['lunar_charge', 'Лунный заряд', 'columbina', 'ineffa', 'Луна любит грозу'],
  ['lunar_crystal', 'Лунный кристалл', 'columbina', 'illuga', 'Лунный свет застывает в камне'],
  ['grand_stage', 'Великая премьера', 'furina', 'charlotte', 'Сенсация на первой полосе'],
  ['tide_requiem', 'Реквием прилива', 'furina', 'yelan', 'Занавес из воды'],
  ['harbinger_queen', 'Воля Предвестников', 'anastasya', 'arlecchino', 'Предвестница служит своей Царице'],
  ['abyss_winter', 'Зима Бездны', 'anastasya', 'skirk', 'Холод из-за края мира'],

  // Вне регионов
  ['star_visitors', 'Гости со звёзд', 'traveler', 'aloy', 'Те, кто пришёл издалека'],
  ['abyss_pair', 'Дуэт Бездны', 'skirk', 'nicole', 'Ученица и загадка'],
  ['wonder_mirror', 'Чудесное зеркало', 'wonderland_manekin', 'traveler', 'Манекен учится быть собой'],
  ['beyond_teyvat', 'За гранью Тейвата', 'star_visitors', 'abyss_pair', 'Небо Тейвата трескается'],

  // Межрегиональные гибриды высоких ступеней: каждая следующая собирается из предыдущих.
  // Ступень 4
  ['skyfire_order', 'Небесный орден', 'grand_order', 'sky_barrage', 'Орден стреляет залпом с неба'],
  ['frozen_adepts', 'Ледяные адепты', 'glacier_court', 'adeptus_gate', 'Холод Мондштадта на горе адептов'],
  ['thunder_shogunate', 'Громовой сёгунат', 'musou_no_hitotachi', 'storm_melt', 'Гроза Инадзумы встречает грозу Мондштадта'],
  ['sage_rain', 'Дождь мудрецов', 'akademiya_prime', 'boiling_rain', 'Знание и кипящий дождь'],
  ['jade_bastion', 'Нефритовый бастион', 'liyue_court', 'crystal_bastion', 'Камень на камне'],
  ['grand_carnival', 'Великий карнавал', 'belle_epoque', 'tenryou_guard', 'Фонтейн устраивает праздник для Инадзумы'],
  ['volcano_night', 'Вулканическая ночь', 'night_kingdom', 'war_of_tribes', 'Ночь Натлана горит'],
  ['harbinger_storm', 'Буря предвестников', 'tsaritsa_court', 'musou_no_hitotachi', 'Фатуи бросают вызов Сёгуну'],
  ['star_abyss', 'Звёздная бездна', 'beyond_teyvat', 'absolute_zero', 'Холод между звёздами'],
  ['desert_night', 'Пустынная ночь', 'desert_tempest', 'night_kingdom', 'Пески под чужими звёздами'],
  ['glacier_tribe', 'Ледяные племена', 'glacier_court', 'war_of_tribes', 'Племена Натлана в снегах'],
  ['adeptus_storm', 'Ветер адептов', 'adeptus_gate', 'grand_order', 'Адепты и рыцари в одном строю'],
  ['storm_guard', 'Стража грозы', 'tenryou_guard', 'storm_melt', 'Комиссия держит грозу на привязи'],
  ['beyond_court', 'Двор за гранью', 'beyond_teyvat', 'tsaritsa_court', 'Дворец, которого нет на картах'],
  // Ступень 5
  ['dawn_of_teyvat', 'Рассвет Тейвата', 'skyfire_order', 'frozen_adepts', 'Небо и горы просыпаются вместе'],
  ['raijin_heaven', 'Небо Райдзин', 'thunder_shogunate', 'thunder_cauldron', 'Все грозы мира в одной клетке'],
  ['world_tree_storm', 'Буря Мирового древа', 'sage_rain', 'irminsul_dream', 'Ирминсуль шумит под дождём'],
  ['geo_fortress', 'Крепость Гео', 'jade_bastion', 'guili_oath', 'Клятва, вырезанная в камне'],
  ['grand_finale', 'Финал карнавала', 'grand_carnival', 'windblume_finale', 'Два праздника в один вечер'],
  ['lava_heart', 'Сердце вулкана', 'volcano_night', 'pyro_sovereign', 'Солнце Натлана уходит в лаву'],
  ['winter_harbingers', 'Зима предвестников', 'harbinger_storm', 'eternal_winter', 'Предвестники приносят вечную зиму'],
  ['abyss_star', 'Звезда Бездны', 'star_abyss', 'beyond_court', 'Звезда, что светит снизу'],
  ['sand_and_ice', 'Песок и лёд', 'desert_night', 'glacier_tribe', 'Пустыня замерзает за одну ночь'],
  ['heaven_wind', 'Небесный ветер', 'adeptus_storm', 'frozen_heaven', 'Ветер, что застывает в небе'],
  ['thunder_crown', 'Корона грозы', 'storm_guard', 'narukami_vow', 'Вечность надевает корону'],
  // Ступень 6
  ['teyvat_unity', 'Единство Тейвата', 'dawn_of_teyvat', 'raijin_heaven', 'Все нации под одним небом'],
  ['last_dawn', 'Последний рассвет', 'lava_heart', 'winter_harbingers', 'Огонь и вечная зима'],
  ['cosmos_tree', 'Звёздное древо', 'abyss_star', 'world_tree_storm', 'Корни Ирминсуля тянутся к звёздам'],
  ['twin_kingdoms', 'Два царства', 'geo_fortress', 'grand_finale', 'Камень и праздник'],
  ['sky_frost_throne', 'Трон небесного инея', 'heaven_wind', 'sand_and_ice', 'Небо замерзает над пустыней'],
  // Ступень 7
  ['heart_of_teyvat', 'Сердце Тейвата', 'teyvat_unity', 'cosmos_tree', 'Последний рецепт мира'],
  ['end_of_seasons', 'Конец сезонов', 'last_dawn', 'sky_frost_throne', 'Лето и зима в одну секунду'],
];

// Год-тир собирается из гибридов всех трёх богинь в любом порядке: id, имя, слово варианта, Коломбина, Фурина, Царица.
export const GOD_TRIADS: Array<[string, string, string, string, string, string]> = [
  ['god_heavens', 'Триада Небес', 'Цветения', 'moon_rite', 'iudex_flood', 'gods_love'],
  ['god_judgment', 'Судный Час', 'Грозы', 'lunar_charge', 'grand_stage', 'harbinger_queen'],
  ['god_endtimes', 'Конец Времён', 'Бездны', 'lunar_crystal', 'tide_requiem', 'abyss_winter'],
];

export const RU_NAMES: Record<string, string> = {
  Aino: 'Аино', Anastasya: 'Царица', Albedo: 'Альбедо', Alhaitham: 'Аль-Хайтам', Aloy: 'Элой', Alyosha: 'Алёша', Amber: 'Эмбер',
  'Arataki Itto': 'Итто', Arlecchino: 'Арлекино', Baizhu: 'Бай Чжу', Barbara: 'Барбара', Beidou: 'Бэй Доу', Bennett: 'Беннет',
  Candace: 'Кандакия', Charlotte: 'Шарлотта', Chasca: 'Часка', Chevreuse: 'Шеврёз', Chiori: 'Тиори', Chongyun: 'Чун Юнь',
  Citlali: 'Ситлали', Clorinde: 'Клоринда', Collei: 'Коллеи', Columbina: 'Коломбина', Cyno: 'Сайно', Dahlia: 'Далия',
  Dehya: 'Дэхья', Diluc: 'Дилюк', Diona: 'Диона', Dori: 'Дори', Durin: 'Дурин', Emilie: 'Эмилия', Escoffier: 'Эскофье',
  Eula: 'Эола', Faruzan: 'Фарузан', Fischl: 'Фишль', Flins: 'Флинс', Freminet: 'Фремине', Furina: 'Фурина', Gaming: 'Гаминг',
  Ganyu: 'Гань Юй', Gorou: 'Горо', 'Hu Tao': 'Ху Тао', Iansan: 'Иансан', Ifa: 'Ифа', Illuga: 'Иллуга', Ineffa: 'Инеффа',
  Jahoda: 'Яхода', Jean: 'Джинн', Kachina: 'Качина', 'Kaedehara Kazuha': 'Кадзуха', Kaeya: 'Кайя', 'Kamisato Ayaka': 'Аяка',
  'Kamisato Ayato': 'Аято', Kaveh: 'Кавех', Keqing: 'Кэ Цин', Kinich: 'Кинич', Kirara: 'Кирара', Klee: 'Кли',
  'Kujou Sara': 'Сара', 'Kuki Shinobu': 'Синобу', 'Lan Yan': 'Лань Янь', Lauma: 'Лаума', Layla: 'Лайла', Linnea: 'Линнея',
  Lisa: 'Лиза', Lohen: 'Лоэн', Lynette: 'Линетт', Lyney: 'Лини', Mavuika: 'Мавуика', Mika: 'Мика', Mona: 'Мона',
  Mualani: 'Муалани', Nahida: 'Нахида', Navia: 'Навия', Nefer: 'Нефер', Neuvillette: 'Нёвиллет', Nicole: 'Николь', Nilou: 'Нилу',
  Ningguang: 'Нин Гуан', Noelle: 'Ноэлль', Odette: 'Одетта', Ororon: 'Оророн', Prune: 'Прюн', Qiqi: 'Ци Ци',
  'Raiden Shogun': 'Райдэн', Razor: 'Рэйзор', Rosaria: 'Розария', Sandrone: 'Сандроне', 'Sangonomiya Kokomi': 'Кокоми',
  Sayu: 'Саю', Sethos: 'Сетос', Shenhe: 'Шэнь Хэ', 'Shikanoin Heizou': 'Хэйдзо', Sigewinne: 'Сиджвин', Skirk: 'Скирк',
  Sucrose: 'Сахароза', Tartaglia: 'Тарталья', Thoma: 'Тома', Tighnari: 'Тигнари', Traveler: 'Путешественник', Varesa: 'Вареса',
  Varka: 'Варка', Venti: 'Венти', Vesna: 'Весна', Vodyanitsa: 'Водяница', Wanderer: 'Странник', 'Wonderland Manekin': 'Манекен',
  Wriothesley: 'Ризли', Xiangling: 'Сян Лин', Xianyun: 'Сянь Юнь', Xiao: 'Сяо', Xilonen: 'Шилонен', Xingqiu: 'Син Цю',
  Xinyan: 'Синь Янь', 'Yae Miko': 'Яэ Мико', Yanfei: 'Янь Фэй', Yaoyao: 'Яо Яо', Yelan: 'Е Лань', Yoimiya: 'Ёимия',
  'Yumemizuki Mizuki': 'Мидзуки', 'Yun Jin': 'Юнь Цзинь', Zhongli: 'Чжун Ли', Zibai: 'Цзы Бай',
};
