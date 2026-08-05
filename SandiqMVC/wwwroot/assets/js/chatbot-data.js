export const chatbotData = {
  az: {
    title: "Kömək",
    welcome: "Salam! Sənə necə kömək edə bilərəm? Aşağıdan bir mövzu seç.",
    backButton: "Geri",
    backToMenu: "Menyuya qayıt",
    categories: [
      {
        title: "Elan yerləşdirmək",
        questions: [
          {
            q: "Necə elan yerləşdirim?",
            a: "Sağ yuxarıda 'Elan yerləşdir' düyməsinə basın, məlumatları doldurun və göndərin. Elanınız admin tərəfindən yoxlanıldıqdan sonra saytda görünəcək.",
          },
          {
            q: "Elanım nə vaxt görünəcək?",
            a: "Elanınız göndərildi, admin təsdiqindən sonra saytda görünəcək.",
          },
          {
            q: "Niyə elanım rədd edilə bilər?",
            a: "Admin, qaydalara uyğun olmayan (yanıldıcı məlumat, qadağan olunmuş məhsul və s.) elanları rədd edə bilər. Ətraflı üçün 'Elan paylaşma şərtləri' bölməsinə baxın.",
          },
          {
            q: "Elanımı redaktə/silə bilərəmmi?",
            a: "Hazırda istifadəçilər öz elanlarını özləri redaktə və ya silə bilmir. Bunun üçün admin ilə əlaqə saxlayın.",
          },
        ],
      },
      {
        title: "Axtarış və alış-veriş",
        questions: [
          {
            q: "Necə axtarış edim?",
            a: "Yuxarıdakı axtarış qutusuna açar söz yazıb Enter basın və ya axtarış işarəsinə klikləyin.",
          },
          {
            q: "Filtrlərdən necə istifadə edim?",
            a: "Kateqoriya səhifəsində qiymət aralığı, vəziyyət (yeni/işlənmiş) və sıralama üzrə filtr edə bilərsiniz.",
          },
          {
            q: "Məhsulu necə səbətə əlavə edirəm?",
            a: "Məhsul kartındakı 'Səbətə at' düyməsinə basın.",
          },
          {
            q: "Favorilərə necə əlavə edirəm?",
            a: "Məhsul şəklinin üzərindəki ürək (♥) işarəsinə klikləyin.",
          },
        ],
      },
      {
        title: "Hesab",
        questions: [
          {
            q: "Necə qeydiyyatdan keçim?",
            a: "Sağ yuxarıdakı 'Qeydiyyat' düyməsinə basıb ad, e-poçt, telefon və şifrənizi daxil edin.",
          },
          {
            q: "Şifrəmi unutmuşam, nə edim?",
            a: "Qeydiyyatdan keçdiyin email-i yaz, sənə sıfırlama kodu göndərək.",
          },
          {
            q: "Google ilə necə daxil olum?",
            a: "Giriş və ya Qeydiyyat səhifəsində 'Google ilə daxil olun' düyməsinə basın.",
          },
        ],
      },
      {
        title: "Qaydalar və təhlükəsizlik",
        questions: [
          {
            q: "Təhlükəsiz alış-veriş necə olmalıdır?",
            a: "Görüşləri açıq və camaatlı yerlərdə keçirin, məhsulu almazdan əvvəl yoxlayın, ödənişi yalnız məhsulu əldə etdikdən sonra edin. Şübhəli görünən təkliflərə (ön ödəniş tələb edən, real qiymətdən çox aşağı olan) etibar etməyin.",
          },
          {
            q: "Necə satmaq lazımdır?",
            a: "Məhsulun aydın və işıqlı şəkillərini çəkin, real vəziyyətini düzgün göstərin, bazar qiymətinə uyğun məbləğ qoyun və dəqiq təsvir yazın. Elanınız admin təsdiqindən sonra saytda görünəcək.",
          },
          {
            q: "Aksiya/kampaniya varmı?",
            a: "Hazırda aktiv kampaniya yoxdur. Gələcəkdə keçiriləcək aksiyalar və şərtləri bu bölmədə elan olunacaq.",
          },
        ],
      },
      {
        title: "Hüquqi məlumat",
        questions: [
          {
            q: "İstifadəçi razılaşması",
            a: "Sandıq platformasından istifadə edərək hesab məlumatlarınızın düzgünlüyünə görə məsuliyyət daşıyırsınız. Yerləşdirdiyiniz elanlar qanuni yolla əldə edilmiş, satışı qadağan olunmayan məhsullara aid olmalıdır.",
          },
          {
            q: "Məxfilik siyasəti",
            a: "Qeydiyyat zamanı topladığımız ad, email və telefon məlumatları yalnız hesabınızı idarə etmək və elanlarınızı digər istifadəçilərlə əlaqələndirmək üçün istifadə olunur. Bu məlumatlar üçüncü tərəflərə satılmır və ya paylaşılmır.",
          },
          {
            q: "Elan paylaşma şərtləri",
            a: "Elan yerləşdirməklə, məhsulun sizə məxsus olduğunu və satışının qanunla qadağan olunmadığını təsdiqləyirsiniz. Silah, narkotik, saxta sənəd və qanunla qadağan olunmuş digər məhsulların satışı qəti qadağandır.",
          },
        ],
      },
      {
        title: "Əlaqə",
        questions: [
          {
            q: "Bizimlə necə əlaqə saxlaya bilərəm?",
            a: "Sualın var və ya təklifin? E-poçt: elaqe@sandiq.az, Instagram: @sandiq",
          },
        ],
      },
    ],
  },
  ru: {
    title: "Помощь",
    welcome: "Здравствуйте! Чем могу помочь? Выберите тему ниже.",
    backButton: "Назад",
    backToMenu: "Вернуться в меню",
    categories: [
      {
        title: "Размещение объявления",
        questions: [
          {
            q: "Как разместить объявление?",
            a: "Нажмите кнопку «Разместить объявление» вверху справа, заполните форму и отправьте. Ваше объявление появится на сайте после проверки администратором.",
          },
          {
            q: "Когда появится моё объявление?",
            a: "Ваше объявление отправлено, после одобрения администратором оно появится на сайте.",
          },
          {
            q: "Почему объявление могут отклонить?",
            a: "Администратор может отклонить объявление, если оно не соответствует правилам (недостоверная информация, запрещённый товар и т.д.). Подробнее — в разделе «Правила размещения объявлений».",
          },
          {
            q: "Могу ли я редактировать/удалить своё объявление?",
            a: "На данный момент пользователи не могут сами редактировать или удалять свои объявления. Свяжитесь с администратором.",
          },
        ],
      },
      {
        title: "Поиск и покупки",
        questions: [
          {
            q: "Как искать товары?",
            a: "Введите ключевое слово в поле поиска вверху и нажмите Enter или значок поиска.",
          },
          {
            q: "Как пользоваться фильтрами?",
            a: "На странице категории вы можете фильтровать по цене, состоянию (новое/б/у) и сортировке.",
          },
          {
            q: "Как добавить товар в корзину?",
            a: "Нажмите кнопку «В корзину» на карточке товара.",
          },
          {
            q: "Как добавить в избранное?",
            a: "Нажмите на значок сердца (♥) на изображении товара.",
          },
        ],
      },
      {
        title: "Аккаунт",
        questions: [
          {
            q: "Как зарегистрироваться?",
            a: "Нажмите кнопку «Регистрация» вверху справа и укажите имя, email, телефон и пароль.",
          },
          {
            q: "Я забыл(а) пароль, что делать?",
            a: "Введите email, указанный при регистрации, мы отправим код для сброса пароля.",
          },
          {
            q: "Как войти через Google?",
            a: "На странице входа или регистрации нажмите кнопку «Войти через Google».",
          },
        ],
      },
      {
        title: "Правила и безопасность",
        questions: [
          {
            q: "Как совершать безопасные сделки?",
            a: "Встречайтесь в открытых людных местах, осматривайте товар перед покупкой, оплачивайте только после получения товара. Не доверяйте подозрительным предложениям с предоплатой или слишком низкой ценой.",
          },
          {
            q: "Как правильно продавать?",
            a: "Сделайте чёткие и качественные фото товара, честно опишите его состояние, укажите разумную цену и подробное описание. Объявление появится на сайте после подтверждения администратором.",
          },
          {
            q: "Есть ли акции?",
            a: "На данный момент активных акций нет. Будущие акции и их условия будут опубликованы в этом разделе.",
          },
        ],
      },
      {
        title: "Правовая информация",
        questions: [
          {
            q: "Пользовательское соглашение",
            a: "Используя платформу Sandıq, вы несёте ответственность за достоверность данных вашего аккаунта. Размещаемые объявления должны относиться к товарам, продажа которых не запрещена законом.",
          },
          {
            q: "Политика конфиденциальности",
            a: "Имя, email и телефон, указанные при регистрации, используются только для управления вашим аккаунтом и связи по объявлениям. Эти данные не передаются и не продаются третьим лицам.",
          },
          {
            q: "Правила размещения объявлений",
            a: "Размещая объявление, вы подтверждаете, что товар принадлежит вам и его продажа не запрещена законом. Продажа оружия, наркотиков, поддельных документов и других запрещённых товаров строго запрещена.",
          },
        ],
      },
      {
        title: "Контакты",
        questions: [
          {
            q: "Как с вами связаться?",
            a: "Есть вопрос или предложение? Эл. почта: elaqe@sandiq.az, Instagram: @sandiq",
          },
        ],
      },
    ],
  },
  en: {
    title: "Help",
    welcome: "Hi! How can I help you? Pick a topic below.",
    backButton: "Back",
    backToMenu: "Back to menu",
    categories: [
      {
        title: "Posting a listing",
        questions: [
          {
            q: "How do I post a listing?",
            a: "Click the 'Post an ad' button at the top right, fill in the details, and submit. Your listing will appear on the site after admin approval.",
          },
          {
            q: "When will my listing appear?",
            a: "Your listing was submitted, it will appear on the site after admin approval.",
          },
          {
            q: "Why might my listing get rejected?",
            a: "The admin may reject a listing that doesn't follow the rules (misleading info, prohibited items, etc.). See the 'Ad posting terms' section for details.",
          },
          {
            q: "Can I edit or delete my listing?",
            a: "Currently users can't edit or delete their own listings. Please contact the admin for that.",
          },
        ],
      },
      {
        title: "Search & shopping",
        questions: [
          {
            q: "How do I search?",
            a: "Type a keyword in the search box at the top and press Enter or click the search icon.",
          },
          {
            q: "How do filters work?",
            a: "On the category page, you can filter by price range, condition (new/used), and sort order.",
          },
          {
            q: "How do I add an item to my cart?",
            a: "Click the 'Add to cart' button on the product card.",
          },
          {
            q: "How do I add to favorites?",
            a: "Click the heart (♥) icon on the product image.",
          },
        ],
      },
      {
        title: "Account",
        questions: [
          {
            q: "How do I register?",
            a: "Click the 'Register' button at the top right and enter your name, email, phone, and password.",
          },
          {
            q: "I forgot my password, what do I do?",
            a: "Enter the email you registered with, we'll send you a reset code.",
          },
          {
            q: "How do I sign in with Google?",
            a: "On the Login or Register page, click the 'Sign in with Google' button.",
          },
        ],
      },
      {
        title: "Rules & safety",
        questions: [
          {
            q: "How should safe trading work?",
            a: "Meet in open, public places, inspect the item before buying, and only pay after receiving the item. Don't trust suspicious offers that ask for prepayment or seem far below market price.",
          },
          {
            q: "How should I sell?",
            a: "Take clear, well-lit photos of your item, describe its real condition honestly, set a fair price, and write a detailed description. Your listing will appear on the site after admin approval.",
          },
          {
            q: "Are there any promotions?",
            a: "There are no active promotions right now. Future campaigns and their terms will be announced in this section.",
          },
        ],
      },
      {
        title: "Legal information",
        questions: [
          {
            q: "User agreement",
            a: "By using the Sandıq platform, you are responsible for the accuracy of your account information. Listings must relate to goods whose sale is not prohibited by law.",
          },
          {
            q: "Privacy policy",
            a: "The name, email, and phone number collected at registration are used only to manage your account and connect you with other users about your listings. This data is never sold or shared with third parties.",
          },
          {
            q: "Ad posting terms",
            a: "By posting a listing, you confirm that the item belongs to you and that its sale is not prohibited by law. Selling weapons, drugs, forged documents, or other prohibited goods is strictly forbidden.",
          },
        ],
      },
      {
        title: "Contact",
        questions: [
          {
            q: "How can I reach you?",
            a: "Have a question or suggestion? Email: elaqe@sandiq.az, Instagram: @sandiq",
          },
        ],
      },
    ],
  },
};
