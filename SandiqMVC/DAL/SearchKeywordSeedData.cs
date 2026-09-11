namespace SandiqMVC.DAL;

public static class SearchKeywordSeedData
{
    // Category ids (from the current Sandiq category tree):
    // 7 Geyim, 13 Kişi geyimləri, 14 Qadın geyimləri, 15 Uşaq geyimləri, 16 Geyim/Digər
    // 8 Əşyalar, 17 Böyük əşyalar, 18 Kiçik əşyalar, 19 Əşyalar/Digər
    // 9 Qab-qacaq, 10 Yeməklər
    // 11 Əl işləri, 20 Muncuq, 21 Toxuma, 22 Əl işləri/Digər
    // 12 Digər (top-level)
    public static readonly (string Keyword, string Lang, int[] CategoryIds)[] Entries = new (string, string, int[])[]
    {
        // Geyim - unisex (Kişi + Qadın geyimləri)
        ("köynək", "az", new[] { 13, 14 }), ("рубашка", "ru", new[] { 13, 14 }), ("shirt", "en", new[] { 13, 14 }),
        ("şalvar", "az", new[] { 13, 14 }), ("брюки", "ru", new[] { 13, 14 }), ("pants", "en", new[] { 13, 14 }),
        ("jaket", "az", new[] { 13, 14 }), ("куртка", "ru", new[] { 13, 14 }), ("jacket", "en", new[] { 13, 14 }),
        ("pencək", "az", new[] { 13, 14 }), ("пиджак", "ru", new[] { 13, 14 }), ("blazer", "en", new[] { 13, 14 }),
        ("palto", "az", new[] { 13, 14 }), ("пальто", "ru", new[] { 13, 14 }), ("coat", "en", new[] { 13, 14 }),
        ("gödəkçə", "az", new[] { 13, 14 }),
        ("sviter", "az", new[] { 13, 14 }), ("свитер", "ru", new[] { 13, 14 }), ("sweater", "en", new[] { 13, 14 }),
        ("kofta", "az", new[] { 13, 14 }), ("кофта", "ru", new[] { 13, 14 }), ("cardigan", "en", new[] { 13, 14 }),
        ("tişört", "az", new[] { 13, 14 }), ("футболка", "ru", new[] { 13, 14 }), ("t-shirt", "en", new[] { 13, 14 }),
        ("ayaqqabı", "az", new[] { 13, 14, 15 }), ("обувь", "ru", new[] { 13, 14, 15 }), ("shoes", "en", new[] { 13, 14, 15 }),
        ("botinka", "az", new[] { 13, 14 }), ("ботинки", "ru", new[] { 13, 14 }), ("boots", "en", new[] { 13, 14 }),
        ("krossovka", "az", new[] { 13, 14, 15 }), ("кроссовки", "ru", new[] { 13, 14, 15 }), ("sneakers", "en", new[] { 13, 14, 15 }),
        ("corab", "az", new[] { 13, 14, 15, 21 }), ("носки", "ru", new[] { 13, 14, 15 }), ("socks", "en", new[] { 13, 14, 15 }),
        ("papaq", "az", new[] { 13, 14, 15 }), ("şapka", "az", new[] { 13, 14, 15 }), ("шапка", "ru", new[] { 13, 14, 15 }), ("hat", "en", new[] { 13, 14, 15 }),
        ("şərf", "az", new[] { 13, 14, 21 }), ("шарф", "ru", new[] { 13, 14 }), ("scarf", "en", new[] { 13, 14 }),
        ("əlcək", "az", new[] { 13, 14 }), ("перчатки", "ru", new[] { 13, 14 }), ("gloves", "en", new[] { 13, 14 }),
        ("qurşaq", "az", new[] { 13, 14, 16 }), ("ремень", "ru", new[] { 13, 14 }), ("belt", "en", new[] { 13, 14 }),
        ("geyim", "az", new[] { 13, 14, 15 }), ("одежда", "ru", new[] { 13, 14, 15 }), ("clothes", "en", new[] { 13, 14, 15 }),

        // Kişi geyimləri
        ("kostyum", "az", new[] { 13 }), ("костюм", "ru", new[] { 13 }), ("suit", "en", new[] { 13 }),
        ("qalstuk", "az", new[] { 13 }), ("галстук", "ru", new[] { 13 }), ("tie", "en", new[] { 13 }),
        ("kişi köynəyi", "az", new[] { 13 }),

        // Qadın geyimləri
        ("don", "az", new[] { 14 }), ("paltar", "az", new[] { 14 }), ("платье", "ru", new[] { 14 }), ("dress", "en", new[] { 14 }),
        ("yubka", "az", new[] { 14 }), ("юбка", "ru", new[] { 14 }), ("skirt", "en", new[] { 14 }),
        ("bluzka", "az", new[] { 14 }), ("блузка", "ru", new[] { 14 }), ("blouse", "en", new[] { 14 }),
        ("gəlinlik", "az", new[] { 14 }), ("свадебное платье", "ru", new[] { 14 }), ("wedding dress", "en", new[] { 14 }),
        ("sumka", "az", new[] { 14, 16 }), ("сумка", "ru", new[] { 14 }), ("bag", "en", new[] { 14 }),
        ("alt paltarı", "az", new[] { 14, 13 }), ("бельё", "ru", new[] { 14, 13 }), ("underwear", "en", new[] { 14, 13 }),

        // Uşaq geyimləri
        ("uşaq geyimi", "az", new[] { 15 }), ("детская одежда", "ru", new[] { 15 }), ("kids clothing", "en", new[] { 15 }),
        ("körpə geyimi", "az", new[] { 15 }), ("одежда для малышей", "ru", new[] { 15 }), ("baby clothes", "en", new[] { 15 }),
        ("kombinzon", "az", new[] { 15 }), ("комбинезон", "ru", new[] { 15 }), ("onesie", "en", new[] { 15 }),
        ("uşaq ayaqqabısı", "az", new[] { 15 }), ("детская обувь", "ru", new[] { 15 }), ("kids shoes", "en", new[] { 15 }),

        // Geyim / Digər (aksesuar)
        ("eynək", "az", new[] { 16 }), ("очки", "ru", new[] { 16 }), ("glasses", "en", new[] { 16 }),
        ("zinət əşyaları", "az", new[] { 16 }), ("bijuteriya", "az", new[] { 16 }), ("бижутерия", "ru", new[] { 16 }), ("jewelry", "en", new[] { 16 }),

        // Əşyalar - Böyük əşyalar
        ("mebel", "az", new[] { 17 }), ("мебель", "ru", new[] { 17 }), ("furniture", "en", new[] { 17 }),
        ("divan", "az", new[] { 17 }), ("диван", "ru", new[] { 17 }), ("sofa", "en", new[] { 17 }),
        ("şkaf", "az", new[] { 17 }), ("шкаф", "ru", new[] { 17 }), ("wardrobe", "en", new[] { 17 }),
        ("xalça", "az", new[] { 17 }), ("ковёр", "ru", new[] { 17 }), ("carpet", "en", new[] { 17 }),
        ("soyuducu", "az", new[] { 17 }), ("холодильник", "ru", new[] { 17 }), ("fridge", "en", new[] { 17 }),
        ("paltaryuyan", "az", new[] { 17 }), ("стиральная машина", "ru", new[] { 17 }), ("washing machine", "en", new[] { 17 }),
        ("televizor", "az", new[] { 17, 18 }), ("телевизор", "ru", new[] { 17, 18 }), ("tv", "en", new[] { 17, 18 }),
        ("yataq", "az", new[] { 17 }), ("кровать", "ru", new[] { 17 }), ("bed", "en", new[] { 17 }),
        ("masa", "az", new[] { 17 }), ("стол", "ru", new[] { 17 }), ("table", "en", new[] { 17 }),
        ("stul", "az", new[] { 17 }), ("стул", "ru", new[] { 17 }), ("chair", "en", new[] { 17 }),
        ("kondisioner", "az", new[] { 17 }), ("кондиционер", "ru", new[] { 17 }), ("air conditioner", "en", new[] { 17 }),
        ("velosiped", "az", new[] { 17 }), ("велосипед", "ru", new[] { 17 }), ("bicycle", "en", new[] { 17 }),
        ("güzgü", "az", new[] { 17, 19 }), ("зеркало", "ru", new[] { 17, 19 }), ("mirror", "en", new[] { 17, 19 }),

        // Əşyalar - Kiçik əşyalar
        ("telefon", "az", new[] { 18 }), ("телефон", "ru", new[] { 18 }), ("phone", "en", new[] { 18 }),
        ("noutbuk", "az", new[] { 18 }), ("ноутбук", "ru", new[] { 18 }), ("laptop", "en", new[] { 18 }),
        ("kompüter", "az", new[] { 18 }), ("компьютер", "ru", new[] { 18 }), ("computer", "en", new[] { 18 }),
        ("planşet", "az", new[] { 18 }), ("планшет", "ru", new[] { 18 }), ("tablet", "en", new[] { 18 }),
        ("qulaqlıq", "az", new[] { 18 }), ("наушники", "ru", new[] { 18 }), ("headphones", "en", new[] { 18 }),
        ("oyuncaq", "az", new[] { 18 }), ("игрушка", "ru", new[] { 18 }), ("toy", "en", new[] { 18 }),
        ("kitab", "az", new[] { 18 }), ("книга", "ru", new[] { 18 }), ("book", "en", new[] { 18 }),
        ("lampa", "az", new[] { 18 }), ("лампа", "ru", new[] { 18 }), ("lamp", "en", new[] { 18 }),
        ("saat", "az", new[] { 18, 16 }), ("часы", "ru", new[] { 18, 16 }), ("watch", "en", new[] { 18, 16 }),
        ("oyun konsolu", "az", new[] { 18 }), ("игровая консоль", "ru", new[] { 18 }), ("game console", "en", new[] { 18 }),
        ("fen", "az", new[] { 18 }), ("фен", "ru", new[] { 18 }), ("hair dryer", "en", new[] { 18 }),
        ("ütü", "az", new[] { 18 }), ("утюг", "ru", new[] { 18 }), ("iron", "en", new[] { 18 }),
        ("kamera", "az", new[] { 18 }), ("камера", "ru", new[] { 18 }), ("camera", "en", new[] { 18 }),

        // Əşyalar / Digər
        ("dekorasiya", "az", new[] { 19 }), ("декор", "ru", new[] { 19 }), ("decoration", "en", new[] { 19 }),

        // Qab-qacaq (no subcategories)
        ("qab", "az", new[] { 9 }), ("посуда", "ru", new[] { 9 }), ("dishware", "en", new[] { 9 }),
        ("boşqab", "az", new[] { 9 }), ("тарелка", "ru", new[] { 9 }), ("plate", "en", new[] { 9 }),
        ("stəkan", "az", new[] { 9 }), ("стакан", "ru", new[] { 9 }), ("glass", "en", new[] { 9 }),
        ("qazan", "az", new[] { 9 }), ("кастрюля", "ru", new[] { 9 }), ("pot", "en", new[] { 9 }),
        ("tava", "az", new[] { 9 }), ("сковорода", "ru", new[] { 9 }), ("pan", "en", new[] { 9 }),
        ("çaydan", "az", new[] { 9 }), ("чайник", "ru", new[] { 9 }), ("kettle", "en", new[] { 9 }),
        ("bıçaq dəsti", "az", new[] { 9 }), ("набор ножей", "ru", new[] { 9 }), ("knife set", "en", new[] { 9 }),
        ("termos", "az", new[] { 9 }), ("термос", "ru", new[] { 9 }), ("thermos", "en", new[] { 9 }),
        ("mətbəx ləvazimatı", "az", new[] { 9 }), ("кухонные принадлежности", "ru", new[] { 9 }), ("kitchen utensils", "en", new[] { 9 }),

        // Yeməklər (no subcategories)
        ("mürəbbə", "az", new[] { 10 }), ("варенье", "ru", new[] { 10 }), ("jam", "en", new[] { 10 }),
        ("turşu", "az", new[] { 10 }), ("соленья", "ru", new[] { 10 }), ("pickles", "en", new[] { 10 }),
        ("bal", "az", new[] { 10 }), ("мёд", "ru", new[] { 10 }), ("honey", "en", new[] { 10 }),
        ("konserv", "az", new[] { 10 }), ("консервы", "ru", new[] { 10 }), ("canned food", "en", new[] { 10 }),
        ("ev yeməyi", "az", new[] { 10 }), ("домашняя еда", "ru", new[] { 10 }), ("homemade food", "en", new[] { 10 }),

        // Əl işləri - Muncuq
        ("muncuq", "az", new[] { 20 }), ("бусы", "ru", new[] { 20 }), ("beads", "en", new[] { 20 }),
        ("bilərzik", "az", new[] { 20 }), ("браслет", "ru", new[] { 20 }), ("bracelet", "en", new[] { 20 }),
        ("boyunbağı", "az", new[] { 20 }), ("колье", "ru", new[] { 20 }), ("necklace", "en", new[] { 20 }),

        // Əl işləri - Toxuma
        ("toxuma", "az", new[] { 21 }), ("вязание", "ru", new[] { 21 }), ("knitting", "en", new[] { 21 }),
        ("toxunmuş papaq", "az", new[] { 21 }), ("вязаная шапка", "ru", new[] { 21 }), ("knitted hat", "en", new[] { 21 }),

        // Əl işləri / Digər
        ("əl işi", "az", new[] { 22 }), ("рукоделие", "ru", new[] { 22 }), ("handicraft", "en", new[] { 22 }),
    };
}
