# Store listing in other languages

Paste each block into the Developer Dashboard: Store listing → the language dropdown at the top → pick the language → Description.

The **summary** of a listing comes from the manifest's `description`, which is `"__MSG_appDescription__"`: the dashboard takes each language's `appDescription` from `extension/_locales/<lang>/messages.json` (each fits the 132-character limit), so it changes with the package, not here. The summaries below are copies of those for reference. Português do Brasil has no locale in the extension, so the dashboard shows the English summary there; the one below is ready for a `pt_BR` locale.

Every summary and description follows the store metadata rule in `store/listing.md`: no list of mail service or company names. Gmail is named only where a Gmail feature is described, the rest are "other mail services", and the website lists them. The note on the other services' interfaces, the privacy part and the open-source line are the same in meaning as the English listing; the product name, the licence name and the URL stay as they are. "Settings → Other mail" uses the names the extension's settings page shows in that language. The AI assistant part names no AI company or model: "Chrome's built-in model" and "a supported AI provider" only; "Settings → AI", "Waiting for your reply" and the Google Calendar name use the extension's own strings in that language (`opt_ai`, `opt_aiReply`, `panel_addToCalendar`).

## Русский (ru)

**Summary:** Непрочитанная почта из всех ящиков, в которые вы вошли, в одной быстрой панели. Читайте, архивируйте, удаляйте без новых вкладок.

```
Mail Deck собирает непрочитанные письма из всех ящиков, в которые вы вошли, в одну панель на панели инструментов.

Расширение работает через сеанс, который уже есть в браузере, так же как веб-страница каждого почтового сервиса: без пароля, без пароля приложения, без OAuth и без наших серверов. Gmail работает сразу. Ещё несколько популярных почтовых веб-сервисов можно включить в разделе «Настройки» → «Другая почта»; Chrome попросит разрешить доступ к сайтам этого сервиса, а при выключении разрешение снимается. Какие сервисы поддерживает Mail Deck, указано на его сайте.

Нажмите на письмо, чтобы прочитать его прямо в панели. Письмо можно отметить прочитанным, отправить в архив, удалить или пометить как спам, не открывая вкладку. Нажмите на ящик, чтобы открыть его на сайте сервиса.

Откройте панель на сайте — письма от него окажутся наверху, из всех ящиков, а свежий код для входа можно будет сразу скопировать.

Возможности
- Все ящики, в которые вы вошли, у каждого свой цвет, в том порядке, в какой вы их перетащите
- Переписка целиком прямо в панели, вместе с вложениями
- Вложения письма видны в его строке ещё до открытия, с указанием типа; нажатие открывает файл
- Одноразовые коды заметны в списке, в письме и в уведомлении; нажатие или клавиша C копирует код
- Пиксели отслеживания никогда не загружаются, а при чтении видно, сколько их задержано; спокойное предупреждение, если отправитель не тот, кем назвался
- Отписаться от рассылки в один клик, после вашего подтверждения, и отправить в архив её непрочитанные письма
- Gmail: до десяти аккаунтов, поиск по мере ввода и по всем аккаунтам, сохранённые поиски, его категории кнопками-фильтрами, звёздочки, отметка непрочитанным, выбранные ярлыки или только вкладка «Несортированные» и видеовстреча в один клик
- «Напомнить позже»: уберите письмо до вечера, до завтра или до следующей недели
- Прочитать, архивировать, удалить или пометить как спам из панели или уведомления, с отменой
- Картинки в письмах других сервисов загружаются, только когда вы об этом попросите
- Уведомления и звук по желанию, с тихими часами, тихими ящиками и правилами для отправителей
- В уведомлении виден ящик, и оно может повторяться, пока письмо не прочитано
- Счётчик на значке на ваш выбор: можно исключить ящик или считать только письма с последнего открытия панели
- Боковая панель, горячая клавиша, одна клавиша на каждое действие и ?, чтобы увидеть их все
- Во время чтения J и K открывают следующее или предыдущее письмо
- Светлая и тёмная тема, как в системе
- Настройки с поиском и резервная копия в файл или в синхронизацию Chrome
- Бесплатно, без ограничений на число аккаунтов и без платных тарифов

У других почтовых сервисов нет для этого публичного интерфейса, поэтому Mail Deck обращается к ним так же, как их собственные веб-приложения, и изменение на их стороне может остановить сервис, пока Mail Deck не обновится.

ИИ-помощник
Его кнопки на месте с самого начала, но ничего никуда не отправляется, пока вы его не включите.
- Спросите почту своими словами, например «когда мой рейс?» или «счета за октябрь»: помощник ищет во всех аккаунтах Gmail, читает найденное и отвечает со ссылкой на каждое письмо
- «Что важного»: сводка непрочитанной почты, сначала то, что скоро потребует вашего внимания
- Новое письмо или ответ на языке переписки, готовые к проверке и отправке из вашего почтового сервиса
- Сводка переписки, которую вы читаете, с её датами для Google Календаря и ответами на ваши вопросы о ней
- Непрочитанные письма по группам: ждут вашего ответа, важное и рассылки, которые можно убрать разом
- Перевод письма на ваш язык встроенным переводчиком Chrome, прямо на вашем компьютере
Он работает на встроенной модели Chrome на вашем компьютере или с поддерживаемым ИИ-провайдером: с вашим собственным API-ключом или со входом по вашей подписке, если провайдер это позволяет. Встроенная модель бесплатна и приватна, но работает не на каждом компьютере.

Конфиденциальность
У Mail Deck нет своих серверов и аналитики. Расширение обращается только к Google и к почтовым сервисам, которые вы включили, через сеансы, которые уже есть в браузере, и почта каждого сервиса уходит только в этот сервис. Единственное дополнение — ИИ-помощник, если вы подключите провайдера: тогда то, что нужно для запроса (переписка, по которой вы просите сводку или ответ, письма, найденные по вашему вопросу, отправитель, тема и начало непрочитанных писем, которые он сортирует), уходит из браузера прямо к этому провайдеру. Ключи и данные для входа остаются на этом компьютере, а со встроенной моделью Chrome почта его не покидает. Отписка отправляет один запрос на собственный адрес отписки отправителя, и только после вашего подтверждения. Адрес открытой страницы читается только внутри панели, не сохраняется и никуда не отправляется. Расширение никогда не спрашивает и не хранит ваш пароль, а настройки остаются в браузере.

Mail Deck — проект с открытым кодом под лицензией Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Расширение не создано ни одним почтовым провайдером и не связано ни с одним из них. Gmail — товарный знак Google LLC.
```

## Українська (uk)

**Summary:** Непрочитана пошта з усіх скриньок, у які ви ввійшли, в одній швидкій панелі. Читайте, архівуйте й видаляйте без нових вкладок.

```
Mail Deck збирає непрочитані листи з усіх скриньок, у які ви ввійшли, в одну панель на панелі інструментів.

Розширення працює через сеанс, який уже є у браузері, так само як вебсторінка кожного поштового сервісу: без пароля, без пароля застосунку, без OAuth і без наших серверів. Gmail працює одразу. Ще кілька популярних поштових вебсервісів можна ввімкнути в розділі «Налаштування» → «Інша пошта»; Chrome попросить дозволити доступ до сайтів цього сервісу, а коли ви його вимкнете, дозвіл буде знято. Які сервіси підтримує Mail Deck, зазначено на його сайті.

Натисніть на лист, щоб прочитати його просто в панелі. Лист можна позначити прочитаним, архівувати, видалити або позначити як спам, не відкриваючи вкладку. Натисніть на скриньку, щоб відкрити її на сайті сервісу.

Відкрийте панель на сайті — листи від нього опиняться вгорі, з усіх скриньок, а свіжий код для входу можна буде одразу скопіювати.

Можливості
- Усі скриньки, у які ви ввійшли, кожна зі своїм кольором, у тому порядку, у який ви їх перетягнете
- Усе листування просто в панелі, разом із вкладеннями
- Вкладення листа видно в його рядку ще до відкриття, із зазначенням типу; натискання відкриває файл
- Одноразові коди помітні в списку, у листі й у сповіщенні; натискання або клавіша C копіює код
- Пікселі стеження ніколи не завантажуються, а під час читання видно, скільки їх затримано; спокійне попередження, якщо відправник не той, ким назвався
- Відписатися від розсилки в один клік, після вашого підтвердження, і архівувати її непрочитані листи
- Gmail: до десяти акаунтів, пошук під час введення та в усіх акаунтах, збережені пошуки, його категорії кнопками-фільтрами, зірочки, позначення непрочитаним, вибрані мітки або лише вкладка «Основні» та відеозустріч в один клік
- «Нагадати пізніше»: відкладіть лист до вечора, до завтра або до наступного тижня
- Прочитати, архівувати, видалити або позначити як спам з панелі чи сповіщення, зі скасуванням
- Зображення в листах інших сервісів завантажуються, лише коли ви про це попросите
- Сповіщення і звук за бажанням, з тихими годинами, тихими скриньками та правилами для відправників
- У сповіщенні видно скриньку, і воно може повторюватися, доки лист не прочитано
- Лічильник на значку на ваш вибір: можна виключити скриньку або рахувати лише листи з останнього відкриття панелі
- Бічна панель, гаряча клавіша, одна клавіша на кожну дію та ?, щоб побачити їх усі
- Під час читання J і K відкривають наступний або попередній лист
- Світла й темна тема, як у системі
- Налаштування з пошуком і резервна копія у файл або в синхронізацію Chrome
- Безкоштовно, без обмежень на кількість акаунтів і без платних тарифів

Інші поштові сервіси не мають для цього публічного інтерфейсу, тож Mail Deck звертається до них так само, як їхні власні вебзастосунки, і зміна з їхнього боку може зупинити сервіс, доки Mail Deck не оновиться.

ШІ-помічник
Його кнопки на місці від самого початку, але нічого нікуди не надсилається, доки ви його не ввімкнете.
- Запитайте пошту своїми словами, наприклад «коли мій рейс?» або «рахунки за жовтень»: помічник шукає в усіх акаунтах Gmail, читає знайдене й відповідає з посиланням на кожен лист
- «Що важливого»: підсумок непрочитаної пошти, спершу те, що невдовзі потребуватиме вашої уваги
- Новий лист або відповідь мовою листування, готові до перевірки й надсилання з вашого поштового сервісу
- Підсумок листування, яке ви читаєте, з його датами для Google Календаря та відповідями на ваші запитання про нього
- Непрочитані листи за групами: чекають на вашу відповідь, важливе й розсилки, які можна прибрати за один раз
- Переклад листа вашою мовою вбудованим перекладачем Chrome, просто на вашому комп'ютері
Він працює на вбудованій моделі Chrome на вашому комп'ютері або з підтримуваним ШІ-провайдером: з вашим власним API-ключем або із входом за вашою підпискою, якщо провайдер це дозволяє. Вбудована модель безкоштовна й приватна, але працює не на кожному комп'ютері.

Конфіденційність
У Mail Deck немає власних серверів і аналітики. Розширення звертається лише до Google і до поштових сервісів, які ви ввімкнули, через сеанси, які вже є у браузері, і пошта кожного сервісу йде лише до нього. Єдине доповнення — ШІ-помічник, якщо ви підключите провайдера: тоді те, що потрібно для запиту (листування, для якого ви просите підсумок або відповідь, листи, знайдені за вашим запитанням, відправник, тема й початок непрочитаних листів, які він сортує), іде з браузера просто до цього провайдера. Ключі й дані для входу лишаються на цьому комп'ютері, а із вбудованою моделлю Chrome пошта його не залишає. Відписка надсилає один запит на власну адресу відписки відправника, і лише після вашого підтвердження. Адреса відкритої сторінки читається лише всередині панелі, не зберігається й нікуди не надсилається. Розширення ніколи не запитує і не зберігає ваш пароль, а налаштування залишаються у браузері.

Mail Deck — проєкт із відкритим кодом за ліцензією Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Розширення не створене жодним поштовим провайдером і не пов'язане з жодним із них. Gmail — торговельна марка Google LLC.
```

## Deutsch (de)

**Summary:** Ungelesene Mails aller Postfächer, in denen du angemeldet bist, im schnellen Panel. Lesen, archivieren, löschen ohne neuen Tab.

```
Mail Deck holt die ungelesenen Mails aller Postfächer, in denen du angemeldet bist, in ein Fenster in der Symbolleiste.

Es nutzt die Sitzung, die dein Browser schon hat, so wie die Webseite jedes E-Mail-Dienstes selbst: kein Passwort, kein App-Passwort, kein OAuth, keine Server von uns. Gmail funktioniert sofort. Mehrere andere beliebte Webmail-Dienste lassen sich unter Einstellungen → Weitere E-Mail-Dienste einschalten; Chrome fragt dann, ob du die Seiten dieses Dienstes erlaubst, und beim Ausschalten wird die Berechtigung wieder entzogen. Welche Dienste Mail Deck unterstützt, steht auf der Website.

Klicke auf eine Mail, um sie direkt im Fenster zu lesen. Du kannst sie als gelesen markieren, archivieren, löschen oder als Spam melden, ohne einen Tab zu öffnen. Ein Klick auf ein Postfach öffnet es auf der Seite des Dienstes.

Öffne das Fenster auf einer Website, und die Mails dieser Website stehen oben, aus allen Postfächern, mit einem frischen Anmeldecode zum Kopieren.

Funktionen
- Alle angemeldeten Postfächer, jedes in eigener Farbe und in der Reihenfolge, in die du sie ziehst
- Ganze Unterhaltungen im Fenster, samt Anhängen
- Die Anhänge einer Mail siehst du schon vor dem Öffnen in ihrer Zeile, samt Dateityp; ein Klick öffnet die Datei
- Einmalcodes fallen in der Liste, in der Mail und in der Benachrichtigung sofort auf; ein Klick oder C kopiert sie
- Tracking-Pixel werden nie geladen, und beim Lesen siehst du, wie viele zurückgehalten wurden; ein ruhiger Hinweis, wenn ein Absender nicht der ist, als der er sich ausgibt
- Einen Newsletter mit einem Klick abbestellen, nachdem du bestätigt hast, und archivieren, was er ungelesen hinterlassen hat
- Gmail: bis zu zehn Konten, Suche schon beim Tippen und in allen Konten, gespeicherte Suchen, seine Kategorien als Filterschaltflächen, Sterne, als ungelesen markieren, ausgewählte Labels oder nur der Tab „Allgemein“ und eine Videobesprechung mit einem Klick
- Später erinnern: eine Mail bis heute Abend, morgen oder nächste Woche beiseitelegen
- Lesen, archivieren, löschen oder als Spam melden im Fenster oder in einer Benachrichtigung, mit Rückgängig
- Bilder in Mails anderer Dienste werden erst geladen, wenn du darum bittest
- Benachrichtigungen und ein optionaler Ton, mit Ruhezeiten, stummen Postfächern und Regeln für Absender
- Eine Benachrichtigung nennt ihr Postfach und kann wiederkommen, solange die Mail ungelesen ist
- Du bestimmst, was der Zähler am Symbol zeigt: ein Postfach weglassen oder nur Mails seit dem letzten Öffnen des Fensters zählen
- Seitenleiste, ein Tastenkürzel, eine Taste pro Aktion und ?, um alle zu sehen
- Beim Lesen öffnen J und K die nächste oder vorherige Mail
- Helles und dunkles Design, passend zum System
- Einstellungen mit Suche und eine Sicherung als Datei oder in der Chrome-Synchronisierung
- Kostenlos, ohne Kontolimit und ohne Bezahlversion

Die anderen E-Mail-Dienste haben dafür keine öffentliche Schnittstelle. Mail Deck folgt deshalb ihren eigenen Web-Apps, und eine Änderung auf ihrer Seite kann einen Dienst stoppen, bis Mail Deck aktualisiert ist.

KI-Assistent
Seine Schaltflächen sind von Anfang an da, und nichts wird irgendwohin gesendet, bis du ihn einschaltest.
- Frag deine Mails in eigenen Worten, etwa „Wann geht mein Flug?“ oder „Rechnungen vom Oktober“: Er durchsucht alle Gmail-Konten, liest, was er findet, und antwortet mit einem Verweis auf jede Mail
- Was wichtig ist: deine ungelesenen Mails zusammengefasst, zuerst das, was bald deine Aufmerksamkeit braucht
- Eine neue Mail oder eine Antwort in der Sprache der Unterhaltung, zum Prüfen und Senden aus deinem E-Mail-Dienst
- Eine Zusammenfassung der Unterhaltung, die du liest, mit ihren Terminen für Google Kalender, und Antworten auf deine Fragen dazu
- Ungelesene Mails sortiert: was auf deine Antwort wartet, Wichtiges und Newsletter, die du in einem Rutsch aufräumst
- Übersetze eine Mail mit dem eigenen Übersetzer von Chrome in deine Sprache, auf deinem Computer
Er arbeitet mit dem integrierten Modell von Chrome auf deinem Computer oder mit einem unterstützten KI-Anbieter: mit deinem eigenen API-Schlüssel oder, wo der Anbieter es erlaubt, mit einer Anmeldung über dein Abo. Das integrierte Modell ist kostenlos und privat, läuft aber nicht auf jedem Computer.

Datenschutz
Mail Deck hat keine eigenen Server und keine Analyse. Es spricht nur mit Google und mit den E-Mail-Diensten, die du einschaltest, jeweils über die Sitzung, die dein Browser schon hat, und die Mails jedes Dienstes gehen nur an diesen Dienst. Hinzu kommt nur der KI-Assistent, wenn du einen Anbieter verbindest: Was eine Anfrage braucht (die Unterhaltung, die du zusammenfassen lässt oder beantwortest, die Mails, die eine Frage gefunden hat, Absender, Betreff und Vorschau der ungelesenen Mails, die er sortiert), geht dann direkt von deinem Browser an diesen Anbieter. Schlüssel und Anmeldungen bleiben auf diesem Computer, und mit dem integrierten Modell von Chrome verlassen deine Mails ihn nicht. Abbestellen schickt eine einzige Anfrage an die eigene Abmeldeadresse des Absenders, und erst, nachdem du bestätigt hast. Die Adresse der Seite, auf der du bist, wird nur im Fenster gelesen, nie gespeichert oder gesendet. Mail Deck fragt nie nach deinem Passwort und speichert es nicht, und deine Einstellungen bleiben in deinem Browser.

Mail Deck ist Open Source unter der Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Es stammt von keinem E-Mail-Anbieter und ist mit keinem verbunden. Gmail ist eine Marke von Google LLC.
```

## Español (es)

**Summary:** Correo sin leer de todos los buzones con sesión iniciada, en un panel rápido. Léelo, archívalo o elimínalo sin abrir pestañas.

```
Mail Deck reúne en un panel de la barra de herramientas el correo sin leer de todos los buzones en los que has iniciado sesión.

Funciona con la sesión que tu navegador ya tiene, igual que la propia página web de cada servicio de correo: sin contraseña, sin contraseña de aplicación, sin OAuth y sin servidores nuestros. Gmail funciona desde el primer momento. Otros servicios populares de correo web se pueden activar en Configuración → Otro correo; Chrome te pedirá que permitas los sitios de ese servicio, y al desactivarlo se retira el permiso. El sitio web indica qué servicios admite Mail Deck.

Haz clic en un mensaje para leerlo en el propio panel. Puedes marcarlo como leído, archivarlo, eliminarlo o denunciarlo como spam sin abrir ninguna pestaña. Haz clic en un buzón para abrirlo en el sitio del servicio.

Abre el panel en un sitio web y el correo de ese sitio aparece arriba, de todos los buzones, con un código de inicio de sesión reciente listo para copiar.

Funciones
- Todos los buzones con sesión iniciada, cada uno con su color y en el orden en que los arrastres
- Conversaciones completas en el panel, con los archivos adjuntos
- Los archivos adjuntos de un mensaje aparecen en su línea antes de abrirlo, con su tipo; un clic abre el archivo
- Los códigos de un solo uso destacan en la lista, en el mensaje y en la notificación; un clic o la tecla C los copia
- Los píxeles de seguimiento nunca se cargan, y el lector indica cuántos ha dejado fuera; un aviso tranquilo cuando un remitente no es quien dice ser
- Cancela la suscripción a un boletín con un clic, después de confirmarlo, y archiva lo que dejó sin leer
- Gmail: hasta diez cuentas, búsqueda mientras escribes y en todas las cuentas, búsquedas guardadas, sus categorías como botones de filtro, destacados, marcar como no leído, las etiquetas que elijas o solo la pestaña Principal, y una videorreunión con un clic
- Recordar más tarde: aparta un mensaje hasta esta tarde, mañana o la semana que viene
- Leer, archivar, eliminar o denunciar spam desde el panel o una notificación, con opción de deshacer
- Las imágenes del correo de otros servicios solo se cargan cuando las pides
- Notificaciones y un sonido opcional, con horas de silencio, buzones silenciados y reglas por remitente
- Cada notificación indica su buzón y puede repetirse mientras el correo siga sin leer
- Elige qué cuenta el contador del icono: deja fuera un buzón o cuenta solo el correo desde la última vez que abriste el panel
- Panel lateral, un atajo de teclado, una tecla para cada acción y ? para verlas todas
- Mientras lees, J y K abren el mensaje siguiente o el anterior
- Tema claro y oscuro, según tu sistema
- Ajustes con buscador, y copia de seguridad en un archivo o en la sincronización de Chrome
- Gratis, sin límite de cuentas y sin versión de pago

Los demás servicios de correo no tienen una interfaz pública para esto, así que Mail Deck sigue sus propias aplicaciones web, y un cambio por su parte puede detener alguno de ellos hasta que Mail Deck se actualice.

Asistente de IA
Sus botones están ahí desde el principio, y no se envía nada a ningún sitio hasta que lo actives.
- Pregunta a tu correo con tus propias palabras, como «¿cuándo es mi vuelo?» o «facturas de octubre»: busca en todas las cuentas de Gmail, lee lo que encuentra y responde con una referencia a cada mensaje
- Lo importante: un resumen de tu correo sin leer, primero lo que pronto requiere tu atención
- Un correo nuevo, o una respuesta en el idioma de la conversación, listos para que los revises y envíes desde tu servicio de correo
- Un resumen de la conversación que estás leyendo, con sus fechas para Google Calendar, y respuestas a tus preguntas sobre ella
- El correo sin leer, ordenado: lo que espera tu respuesta, lo importante y los boletines que puedes despejar de una vez
- Traduce un mensaje a tu idioma con el propio traductor de Chrome, en tu ordenador
Funciona con el modelo integrado de Chrome en tu ordenador o con un proveedor de IA compatible: tu propia clave de API, o un inicio de sesión con tu suscripción si el proveedor lo permite. El modelo integrado es gratis y privado, pero no funciona en todos los ordenadores.

Privacidad
Mail Deck no tiene servidores propios ni analítica. Solo se comunica con Google y con los servicios de correo que actives, cada uno con la sesión que tu navegador ya tiene, y el correo de cada servicio solo va a ese servicio. Lo único que se añade es el asistente de IA, si conectas un proveedor: lo que necesita cada petición (la conversación que resumes o a la que respondes, el correo que encontró una pregunta, el remitente, el asunto y la vista previa del correo sin leer que ordena) va entonces directamente desde tu navegador a ese proveedor. Las claves y los inicios de sesión se quedan en este ordenador, y con el modelo integrado de Chrome tu correo no sale de él. Cancelar una suscripción envía una sola petición a la propia dirección de baja del remitente, y solo después de que lo confirmes. La dirección de la página en la que estás solo se lee dentro del panel; nunca se guarda ni se envía. Mail Deck nunca pide ni guarda tu contraseña, y tus ajustes se quedan en tu navegador.

Mail Deck es de código abierto con la licencia Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
No está hecho por ningún proveedor de correo ni está afiliado a ninguno. Gmail es una marca comercial de Google LLC.
```

## Français (fr)

**Summary:** Les non-lus de toutes vos boîtes connectées, dans un panneau rapide. Lisez, archivez ou supprimez sans ouvrir d'onglet.

```
Mail Deck rassemble dans un panneau de la barre d'outils les e-mails non lus de toutes les boîtes auxquelles vous êtes connecté.

Il passe par la session que votre navigateur a déjà, comme la page web de chaque messagerie elle-même : pas de mot de passe, pas de mot de passe d'application, pas d'OAuth, pas de serveurs à nous. Gmail fonctionne tout de suite. Plusieurs autres webmails populaires peuvent être activés dans Paramètres → Autres messageries ; Chrome vous demande alors d'autoriser les sites de ce service, et le désactiver retire l'autorisation. Le site web indique les services pris en charge par Mail Deck.

Cliquez sur un message pour le lire directement dans le panneau. Vous pouvez le marquer comme lu, l'archiver, le supprimer ou le signaler comme spam sans ouvrir d'onglet. Cliquez sur une boîte de réception pour l'ouvrir sur le site du service.

Ouvrez le panneau sur un site web : les e-mails de ce site s'affichent en haut, de toutes vos boîtes, avec un code de connexion récent prêt à copier.

Fonctionnalités
- Toutes les boîtes connectées, chacune avec sa couleur et dans l'ordre où vous les faites glisser
- Conversations entières dans le panneau, pièces jointes comprises
- Les pièces jointes d'un message s'affichent sur sa ligne avant même de l'ouvrir, avec leur type ; un clic ouvre le fichier
- Les codes à usage unique ressortent dans la liste, dans le message et dans la notification ; un clic ou la touche C les copie
- Les pixels de suivi ne se chargent jamais, et le lecteur indique combien il en a bloqué ; un avertissement calme quand un expéditeur n'est pas celui qu'il prétend être
- Désabonnez-vous d'une newsletter en un clic, après confirmation, et archivez ce qu'elle a laissé non lu
- Gmail : jusqu'à dix comptes, recherche dès la saisie et dans tous les comptes, recherches enregistrées, ses catégories en boutons de filtre, messages suivis, marquer comme non lu, libellés choisis ou seulement l'onglet Principale, et une réunion vidéo en un clic
- Me le rappeler plus tard : mettez un message de côté jusqu'à ce soir, demain ou la semaine prochaine
- Lire, archiver, supprimer ou signaler comme spam depuis le panneau ou une notification, avec annulation
- Les images des e-mails des autres services ne se chargent que si vous le demandez
- Notifications et son facultatif, avec heures calmes, boîtes silencieuses et règles par expéditeur
- Une notification indique sa boîte et peut revenir tant que le message reste non lu
- Choisissez ce que compte l'icône : laissez une boîte de côté, ou ne comptez que les messages arrivés depuis la dernière ouverture du panneau
- Panneau latéral, raccourci clavier, une touche par action, et ? pour les voir toutes
- Pendant la lecture, J et K ouvrent le message suivant ou précédent
- Thème clair et sombre, selon votre système
- Réglages avec recherche, et sauvegarde dans un fichier ou dans la synchronisation Chrome
- Gratuit, sans limite de comptes et sans version payante

Les autres messageries n'ont pas d'interface publique pour cela : Mail Deck suit donc leurs propres applications web, et un changement de leur côté peut arrêter l'une d'elles jusqu'à une mise à jour de Mail Deck.

Assistant IA
Ses boutons sont là dès le départ, et rien n'est envoyé nulle part tant que vous ne l'activez pas.
- Interrogez votre courrier avec vos propres mots, comme « quand part mon vol ? » ou « factures d'octobre » : il cherche dans tous les comptes Gmail, lit ce qu'il trouve et répond en renvoyant à chaque message
- L'important : un résumé de vos messages non lus, en commençant par ce qui demande bientôt votre attention
- Un nouveau message ou une réponse dans la langue de la conversation, à vérifier et envoyer depuis votre messagerie
- Un résumé de la conversation que vous lisez, avec ses dates pour Google Agenda, et des réponses à vos questions à son sujet
- Les messages non lus triés : en attente de votre réponse, importants, et newsletters à écarter en une fois
- Traduisez un message dans votre langue avec le traducteur de Chrome lui-même, sur votre ordinateur
Il fonctionne avec le modèle intégré de Chrome sur votre ordinateur, ou avec un fournisseur d'IA pris en charge : votre propre clé API, ou une connexion avec votre abonnement quand le fournisseur le permet. Le modèle intégré est gratuit et privé, mais ne fonctionne pas sur tous les ordinateurs.

Confidentialité
Mail Deck n'a ni serveurs ni outils d'analyse. Il ne communique qu'avec Google et avec les messageries que vous activez, chacune grâce à la session déjà ouverte dans votre navigateur, et le courrier de chaque service ne va qu'à ce service. Seul s'y ajoute l'assistant IA, si vous connectez un fournisseur : ce dont une demande a besoin (la conversation que vous résumez ou à laquelle vous répondez, les messages trouvés pour une question, l'expéditeur, l'objet et l'aperçu des messages non lus qu'il trie) part alors directement de votre navigateur vers ce fournisseur. Les clés et les connexions restent sur cet ordinateur, et avec le modèle intégré de Chrome vos messages ne le quittent pas. Le désabonnement envoie une seule requête à l'adresse de désabonnement de l'expéditeur lui-même, et seulement après votre confirmation. L'adresse de la page où vous êtes n'est lue que dans le panneau, jamais enregistrée ni envoyée. Mail Deck ne demande ni ne stocke jamais votre mot de passe, et vos réglages restent dans votre navigateur.

Mail Deck est open source sous licence Mozilla Public License 1.1 : https://github.com/nord-express/mail-deck
Il n'est ni conçu par un fournisseur de messagerie, ni affilié à l'un d'eux. Gmail est une marque de Google LLC.
```

## Italiano (it)

**Summary:** Posta non letta di tutte le caselle a cui hai eseguito l'accesso, in un pannello veloce. Leggi, archivia o elimina senza schede.

```
Mail Deck raccoglie in un pannello della barra degli strumenti la posta non letta di tutte le caselle a cui hai eseguito l'accesso.

Usa la sessione che il browser ha già, come la pagina web di ciascun servizio di posta: niente password, niente password per le app, niente OAuth, nessun server nostro. Gmail funziona subito. Diversi altri servizi di webmail popolari si possono attivare in Impostazioni → Altra posta; Chrome ti chiede di consentire i siti di quel servizio, e disattivandolo il permesso viene revocato. Il sito web elenca i servizi supportati da Mail Deck.

Fai clic su un messaggio per leggerlo direttamente nel pannello. Puoi segnarlo come letto, archiviarlo, eliminarlo o segnalarlo come spam senza aprire una scheda. Fai clic su una casella per aprirla sul sito del servizio.

Apri il pannello su un sito e la posta di quel sito compare in cima, da tutte le caselle, con un codice di accesso recente pronto da copiare.

Funzioni
- Tutte le caselle collegate, ognuna con il suo colore e nell'ordine in cui le trascini
- Conversazioni intere nel pannello, allegati compresi
- Gli allegati di un messaggio compaiono sulla sua riga prima di aprirlo, con il loro tipo; un clic apre il file
- I codici monouso risaltano nell'elenco, nel messaggio e nella notifica; un clic o il tasto C li copia
- I pixel di tracciamento non si caricano mai, e il lettore dice quanti ne ha tenuti fuori; un avviso pacato quando un mittente non è chi dice di essere
- Annulla l'iscrizione a una newsletter con un clic, dopo la tua conferma, e archivia ciò che ha lasciato non letto
- Gmail: fino a dieci account, ricerca mentre scrivi e in tutti gli account, ricerche salvate, le sue categorie come pulsanti di filtro, stelle, segna come da leggere, etichette scelte o solo la scheda Principale, e una riunione video con un clic
- Ricordamelo più tardi: metti da parte un messaggio fino a stasera, domani o la settimana prossima
- Leggi, archivia, elimina o segnala come spam dal pannello o da una notifica, con annullamento
- Le immagini nella posta degli altri servizi si caricano solo quando lo chiedi
- Notifiche e un suono facoltativo, con ore di silenzio, caselle silenziose e regole per mittente
- Ogni notifica indica la sua casella e può ripetersi finché la posta resta non letta
- Scegli cosa conta l'icona: lascia fuori una casella o conta solo la posta arrivata dall'ultima apertura del pannello
- Pannello laterale, una scorciatoia da tastiera, un tasto per ogni azione e ? per vederli tutti
- Mentre leggi, J e K aprono il messaggio successivo o precedente
- Tema chiaro e scuro, come il sistema
- Impostazioni con una ricerca, e backup su file o nella sincronizzazione di Chrome
- Gratuito, senza limiti di account e senza versione a pagamento

Gli altri servizi di posta non hanno un'interfaccia pubblica per questo, quindi Mail Deck segue le loro app web, e una modifica da parte loro può fermarne uno finché Mail Deck non viene aggiornato.

Assistente IA
I suoi pulsanti ci sono fin dall'inizio, e non viene inviato nulla da nessuna parte finché non lo attivi.
- Chiedi alla tua posta con parole tue, come «quando parte il mio volo?» o «fatture di ottobre»: cerca in tutti gli account Gmail, legge quello che trova e risponde con un riferimento a ogni messaggio
- Cosa è importante: un riepilogo della posta non letta, prima ciò che a breve richiede la tua attenzione
- Un nuovo messaggio o una risposta nella lingua della conversazione, da controllare e inviare dal tuo servizio di posta
- Un riepilogo della conversazione che stai leggendo, con le sue date per Google Calendar, e risposte alle tue domande su di essa
- La posta non letta ordinata: in attesa della tua risposta, importante e newsletter da togliere di mezzo in un colpo solo
- Traduci un messaggio nella tua lingua con il traduttore di Chrome stesso, sul tuo computer
Funziona con il modello integrato di Chrome sul tuo computer, oppure con un fornitore di IA supportato: la tua chiave API, o un accesso con il tuo abbonamento dove il fornitore lo consente. Il modello integrato è gratuito e privato, ma non funziona su tutti i computer.

Privacy
Mail Deck non ha server propri né strumenti di analisi. Comunica solo con Google e con i servizi di posta che attivi, ognuno tramite la sessione già aperta nel browser, e la posta di ogni servizio va solo a quel servizio. L'unica aggiunta è l'assistente IA, se colleghi un fornitore: ciò che serve a una richiesta (la conversazione che riassumi o a cui rispondi, la posta trovata da una domanda, mittente, oggetto e anteprima della posta non letta che ordina) va allora direttamente dal tuo browser a quel fornitore. Chiavi e accessi restano su questo computer, e con il modello integrato di Chrome la tua posta non lo lascia. L'annullamento dell'iscrizione invia una sola richiesta all'indirizzo di disiscrizione del mittente stesso, e solo dopo la tua conferma. L'indirizzo della pagina in cui ti trovi viene letto solo nel pannello, mai salvato né inviato. Mail Deck non chiede né conserva mai la tua password, e le impostazioni restano nel tuo browser.

Mail Deck è open source con licenza Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Non è realizzato da alcun fornitore di posta né affiliato ad alcuno di essi. Gmail è un marchio di Google LLC.
```

## Polski (pl)

**Summary:** Nieprzeczytana poczta ze wszystkich zalogowanych skrzynek w jednym szybkim panelu. Czytaj, archiwizuj i usuwaj bez nowej karty.

```
Mail Deck zbiera w jednym panelu na pasku narzędzi nieprzeczytaną pocztę ze wszystkich skrzynek, na których jesteś zalogowany.

Działa przez sesję, którą przeglądarka już ma, tak jak strona internetowa każdej usługi pocztowej: bez hasła, bez hasła aplikacji, bez OAuth i bez naszych serwerów. Gmail działa od razu. Kilka innych popularnych usług poczty internetowej można włączyć w Ustawieniach → Inna poczta; Chrome poprosi o zezwolenie na strony tej usługi, a wyłączenie jej cofa to uprawnienie. Usługi obsługiwane przez Mail Deck są wymienione na jego stronie internetowej.

Kliknij wiadomość, aby przeczytać ją w panelu. Możesz oznaczyć ją jako przeczytaną, zarchiwizować, usunąć lub zgłosić jako spam bez otwierania karty. Kliknij skrzynkę, aby otworzyć ją na stronie usługi.

Otwórz panel na stronie internetowej, a poczta od tej strony pojawi się na górze, ze wszystkich skrzynek, ze świeżym kodem logowania gotowym do skopiowania.

Funkcje
- Wszystkie zalogowane skrzynki, każda w swoim kolorze i w kolejności, w jakiej je przeciągniesz
- Całe rozmowy w panelu, razem z załącznikami
- Załączniki wiadomości widać w jej wierszu jeszcze przed otwarciem, razem z ich typem; kliknięcie otwiera plik
- Kody jednorazowe wyróżniają się na liście, w wiadomości i w powiadomieniu; kliknięcie albo klawisz C je kopiuje
- Piksele śledzące nigdy się nie wczytują, a podczas czytania widać, ile ich zatrzymano; spokojne ostrzeżenie, gdy nadawca nie jest tym, za kogo się podaje
- Wypisz się z newslettera jednym kliknięciem, po potwierdzeniu, i zarchiwizuj to, co zostawił nieprzeczytane
- Gmail: do dziesięciu kont, wyszukiwanie już podczas pisania i we wszystkich kontach, zapisane wyszukiwania, jego kategorie jako przyciski filtrów, gwiazdki, oznaczanie jako nieprzeczytane, wybrane etykiety lub tylko karta Główne oraz spotkanie wideo jednym kliknięciem
- Przypomnij później: odłóż wiadomość do wieczora, do jutra albo do przyszłego tygodnia
- Czytaj, archiwizuj, usuwaj lub zgłaszaj spam z panelu albo z powiadomienia, z możliwością cofnięcia
- Obrazy w wiadomościach z innych usług wczytują się dopiero wtedy, gdy o to poprosisz
- Powiadomienia i opcjonalny dźwięk, z godzinami ciszy, wyciszonymi skrzynkami i regułami dla nadawców
- Powiadomienie podaje swoją skrzynkę i może wracać, dopóki wiadomość jest nieprzeczytana
- Wybierz, co pokazuje licznik na ikonie: pomiń skrzynkę albo licz tylko pocztę od ostatniego otwarcia panelu
- Panel boczny, skrót klawiszowy, jeden klawisz na każdą czynność i ?, by zobaczyć je wszystkie
- Podczas czytania J i K otwierają następną lub poprzednią wiadomość
- Jasny i ciemny motyw, zgodnie z systemem
- Ustawienia z wyszukiwarką oraz kopia zapasowa w pliku lub w synchronizacji Chrome
- Za darmo, bez limitu kont i bez płatnej wersji

Pozostałe usługi pocztowe nie mają do tego publicznego interfejsu, więc Mail Deck postępuje tak jak ich własne aplikacje internetowe, a zmiana po ich stronie może zatrzymać którąś z usług do czasu aktualizacji Mail Deck.

Asystent AI
Jego przyciski są na miejscu od początku, ale nic nie jest nigdzie wysyłane, dopóki go nie włączysz.
- Pytaj pocztę własnymi słowami, np. „kiedy mam lot?” albo „faktury z października”: asystent przeszukuje wszystkie konta Gmail, czyta, co znajdzie, i odpowiada z odnośnikiem do każdej wiadomości
- Co ważne: streszczenie nieprzeczytanej poczty, najpierw to, co wkrótce wymaga twojej uwagi
- Nowa wiadomość albo odpowiedź w języku rozmowy, do sprawdzenia i wysłania z twojej usługi pocztowej
- Streszczenie czytanej rozmowy z jej datami dla Kalendarza Google oraz odpowiedzi na twoje pytania o nią
- Nieprzeczytana poczta posortowana: to, co czeka na twoją odpowiedź, ważne i newslettery do uprzątnięcia za jednym zamachem
- Przetłumacz wiadomość na swój język wbudowanym tłumaczem Chrome, na swoim komputerze
Działa na wbudowanym modelu Chrome na twoim komputerze albo z obsługiwanym dostawcą AI: z twoim własnym kluczem API albo przez logowanie w ramach twojej subskrypcji, jeśli dostawca na to pozwala. Wbudowany model jest bezpłatny i prywatny, ale nie działa na każdym komputerze.

Prywatność
Mail Deck nie ma własnych serwerów ani analityki. Łączy się tylko z Google i z usługami pocztowymi, które włączysz, z każdą przez sesję, którą przeglądarka już ma, a poczta każdej usługi trafia tylko do niej. Jedynym dodatkiem jest asystent AI, jeśli połączysz dostawcę: to, czego wymaga zapytanie (rozmowa, którą streszczasz lub na którą odpowiadasz, poczta znaleziona dla pytania, nadawca, temat i podgląd nieprzeczytanej poczty, którą sortuje), trafia wtedy prosto z przeglądarki do tego dostawcy. Klucze i dane logowania zostają na tym komputerze, a przy wbudowanym modelu Chrome poczta go nie opuszcza. Wypisanie się wysyła jedno żądanie na własny adres wypisu nadawcy i dopiero po twoim potwierdzeniu. Adres strony, na której jesteś, jest odczytywany tylko w panelu i nigdy nie jest zapisywany ani wysyłany. Mail Deck nigdy nie prosi o hasło ani go nie przechowuje, a ustawienia zostają w przeglądarce.

Mail Deck jest otwartym oprogramowaniem na licencji Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Nie jest tworzony przez żadnego dostawcę poczty ani z żadnym z nich powiązany. Gmail jest znakiem towarowym Google LLC.
```

## Türkçe (tr)

**Summary:** Oturum açtığınız tüm posta kutularındaki okunmamış postalar hızlı bir panelde. Sekme açmadan okuyun, arşivleyin veya silin.

```
Mail Deck, oturum açtığınız tüm posta kutularındaki okunmamış postaları araç çubuğundaki tek bir panelde toplar.

Tarayıcınızda zaten açık olan oturumla, her e-posta hizmetinin kendi web sayfası gibi çalışır: şifre yok, uygulama şifresi yok, OAuth yok, bizim sunucularımız yok. Gmail hemen çalışır. Diğer birkaç popüler web postası hizmeti de Ayarlar → Diğer e-posta hizmetleri bölümünden etkinleştirilebilir; Chrome o hizmetin sitelerine izin vermenizi ister, kapattığınızda izin geri alınır. Mail Deck'in desteklediği hizmetler web sitesinde listelenir.

Bir iletiyi doğrudan panelde okumak için tıklayın. İletiyi sekme açmadan okundu olarak işaretleyebilir, arşivleyebilir, silebilir veya spam olarak bildirebilirsiniz. Bir posta kutusunu hizmetin sitesinde açmak için tıklayın.

Paneli bir web sitesinde açın; o sitenin postaları, tüm posta kutularından, kopyalanmaya hazır yeni bir giriş koduyla en üstte görünür.

Özellikler
- Oturum açılmış tüm posta kutuları, her biri kendi renginde ve sürüklediğiniz sırada
- Ekleriyle birlikte yazışmanın tamamı panelde
- Bir iletinin ekleri, iletiyi açmadan önce satırında türleriyle birlikte görünür; tıklayınca dosya açılır
- Tek kullanımlık kodlar listede, iletide ve bildirimde öne çıkar; bir tıklama veya C tuşu onları kopyalar
- İzleme pikselleri asla yüklenmez ve okurken kaç tanesinin engellendiğini görürsünüz; gönderen, adının söylediği kişi değilse sakin bir uyarı
- Onayladıktan sonra bir bültenden tek tıkla abonelikten çıkın ve okunmamış bıraktıklarını arşivleyin
- Gmail: ona kadar hesap, yazarken ve tüm hesaplarda arama, kayıtlı aramalar, filtre düğmeleri olarak kategorileri, yıldızlar, okunmadı olarak işaretleme, seçtiğiniz etiketler veya yalnızca Birincil sekmesi ve tek tıkla görüntülü toplantı
- Sonra hatırlat: bir iletiyi bu akşama, yarına veya gelecek haftaya kadar kenara koyun
- Panelden veya bir bildirimden okuma, arşivleme, silme veya spam bildirme, geri alma ile
- Diğer hizmetlerden gelen postalardaki resimler yalnızca siz istediğinizde yüklenir
- Bildirimler ve isteğe bağlı ses; sessiz saatler, sessiz kutular ve gönderen kurallarıyla
- Bildirim hangi posta kutusuna geldiğini gösterir ve posta okunmadıkça yinelenebilir
- Simgedeki sayacın ne göstereceğini seçin: bir posta kutusunu dışarıda bırakın veya yalnızca paneli son açtığınızdan beri gelen postaları sayın
- Yan panel, bir klavye kısayolu, her işlem için tek tuş ve hepsini görmek için ?
- Okurken J ve K sonraki veya önceki iletiyi açar
- Sisteminize uyan açık ve koyu tema
- Aranabilir ayarlar ve bunların bir dosyaya veya Chrome senkronizasyonuna yedeklenmesi
- Ücretsiz, hesap sınırı ve ücretli sürüm yok

Diğer e-posta hizmetlerinin bunun için herkese açık bir arayüzü yoktur; bu yüzden Mail Deck onların kendi web uygulamalarını izler ve onların tarafındaki bir değişiklik, Mail Deck güncellenene kadar bir hizmeti durdurabilir.

Yapay zekâ asistanı
Düğmeleri baştan beri yerindedir ve siz açana kadar hiçbir şey hiçbir yere gönderilmez.
- Postanıza kendi kelimelerinizle sorun, örneğin “uçuşum ne zaman?” veya “ekim faturaları”: tüm Gmail hesaplarında arar, bulduklarını okur ve her iletiye bir bağlantı vererek yanıtlar
- Önemli olanlar: okunmamış postalarınızın özeti, önce yakında ilgilenmeniz gerekenler
- Kontrol edip kendi e-posta hizmetinizden göndereceğiniz yeni bir e-posta veya yazışmanın dilinde bir yanıt
- Okuduğunuz yazışmanın özeti, Google Takvim için tarihleri ve yazışmayla ilgili sorularınıza yanıtlar
- Okunmamış postalar gruplara ayrılır: yanıtınızı bekleyenler, önemliler ve tek seferde temizleyebileceğiniz bültenler
- Bir iletiyi Chrome'un kendi çevirmeniyle, bilgisayarınızda kendi dilinize çevirin
Bilgisayarınızda Chrome'un yerleşik modeliyle veya desteklenen bir yapay zekâ sağlayıcısıyla çalışır: kendi API anahtarınızla ya da sağlayıcının izin verdiği durumlarda aboneliğinizle oturum açarak. Yerleşik model ücretsiz ve gizlidir, ama her bilgisayarda çalışmaz.

Gizlilik
Mail Deck'in kendi sunucuları ve analitiği yoktur. Yalnızca Google ve etkinleştirdiğiniz e-posta hizmetleriyle, her biri için tarayıcınızda zaten açık olan oturumla konuşur ve her hizmetin postası yalnızca o hizmete gider. Tek ek, bir sağlayıcı bağlarsanız yapay zekâ asistanıdır: o zaman bir isteğin gerektirdikleri (özetlediğiniz veya yanıtladığınız yazışma, bir sorunun bulduğu postalar, sıraladığı okunmamış postaların göndereni, konusu ve önizlemesi) doğrudan tarayıcınızdan o sağlayıcıya gider. Anahtarlar ve oturum açma bilgileri bu bilgisayarda kalır; Chrome'un yerleşik modeliyle de postanız bilgisayardan çıkmaz. Abonelikten çıkma, gönderenin kendi abonelikten çıkma adresine yalnızca tek bir istek gönderir, o da ancak siz onayladıktan sonra. Bulunduğunuz sayfanın adresi yalnızca panelin içinde okunur, asla saklanmaz veya gönderilmez. Mail Deck şifrenizi asla istemez veya saklamaz, ayarlarınız tarayıcınızda kalır.

Mail Deck, Mozilla Public License 1.1 lisansıyla açık kaynaklıdır: https://github.com/nord-express/mail-deck
Hiçbir e-posta sağlayıcısı tarafından yapılmamıştır ve hiçbiriyle bağlantılı değildir. Gmail, Google LLC'nin ticari markasıdır.
```

## Nederlands (nl)

**Summary:** Ongelezen mail uit elke inbox waarop je bent ingelogd, in één snel paneel. Lees, archiveer of verwijder zonder nieuwe tab.

```
Mail Deck zet de ongelezen mail van elke inbox waarop je bent ingelogd in één paneel op de werkbalk.

Het werkt via de sessie die je browser al heeft, zoals de webpagina van elke maildienst zelf: geen wachtwoord, geen app-wachtwoord, geen OAuth, geen servers van ons. Gmail werkt meteen. Verschillende andere populaire webmaildiensten kun je aanzetten bij Instellingen → Andere mail; Chrome vraagt dan of je de sites van die dienst toestaat, en uitzetten trekt de toestemming weer in. Op de website staat welke diensten Mail Deck ondersteunt.

Klik op een bericht om het direct in het paneel te lezen. Je kunt het als gelezen markeren, archiveren, verwijderen of als spam melden zonder een tabblad te openen. Klik op een inbox om hem op de site van de dienst te openen.

Open het paneel op een website en de mail van die site staat bovenaan, uit elke inbox, met een verse inlogcode klaar om te kopiëren.

Functies
- Alle ingelogde mailboxen, elk met een eigen kleur en in de volgorde waarin je ze sleept
- Hele gesprekken in het paneel, met bijlagen
- De bijlagen van een bericht staan al op de regel ervan voordat je het opent, met hun bestandstype; een klik opent het bestand
- Eenmalige codes springen eruit in de lijst, in het bericht en in de melding; een klik of C kopieert ze
- Trackingpixels laden nooit, en tijdens het lezen zie je hoeveel er zijn tegengehouden; een rustige waarschuwing als een afzender niet is wie hij zegt te zijn
- Meld je met één klik af voor een nieuwsbrief, nadat je hebt bevestigd, en archiveer wat die ongelezen achterliet
- Gmail: tot tien accounts, zoeken terwijl je typt en in alle accounts, opgeslagen zoekopdrachten, zijn categorieën als filterknoppen, sterren, markeren als ongelezen, gekozen labels of alleen het tabblad Primair, en een videovergadering met één klik
- Later herinneren: leg een bericht weg tot vanavond, morgen of volgende week
- Lezen, archiveren, verwijderen of als spam melden vanuit het paneel of een melding, met ongedaan maken
- Afbeeldingen in mail van andere diensten laden pas als je erom vraagt
- Meldingen en een optioneel geluid, met stille uren, stille inboxen en regels voor afzenders
- Een melding noemt de inbox waar de mail binnenkwam en kan terugkomen zolang de mail ongelezen is
- Kies wat de teller op het pictogram telt: laat een inbox weg, of tel alleen mail sinds je het paneel laatst opende
- Zijpaneel, een sneltoets, één toets per actie, en ? om ze allemaal te zien
- Tijdens het lezen openen J en K het volgende of vorige bericht
- Licht en donker thema, zoals je systeem
- Instellingen met een zoekfunctie, en een back-up in een bestand of in Chrome-synchronisatie
- Gratis, zonder limiet op accounts en zonder betaalde versie

De andere maildiensten hebben hiervoor geen openbare interface. Mail Deck volgt daarom hun eigen webapps, en een wijziging aan hun kant kan een dienst stilleggen tot Mail Deck is bijgewerkt.

AI-assistent
De knoppen zijn er vanaf het begin, en er wordt nergens iets heen gestuurd tot je hem aanzet.
- Vraag je mail iets in gewone woorden, zoals ‘wanneer gaat mijn vlucht?’ of ‘facturen van oktober’: hij zoekt in alle Gmail-accounts, leest wat hij vindt en antwoordt met een verwijzing naar elke mail
- Wat belangrijk is: je ongelezen mail samengevat, eerst wat binnenkort je aandacht vraagt
- Een nieuwe e-mail of een antwoord in de taal van het gesprek, om na te kijken en te versturen vanuit je maildienst
- Een samenvatting van het gesprek dat je leest, met de datums voor Google Agenda, en antwoorden op je vragen erover
- Ongelezen mail gesorteerd: wacht op je antwoord, belangrijk, en nieuwsbrieven om in één keer op te ruimen
- Vertaal een bericht naar je eigen taal met de eigen vertaler van Chrome, op je computer
Hij werkt met het ingebouwde model van Chrome op je computer, of met een ondersteunde AI-aanbieder: je eigen API-sleutel, of inloggen met je abonnement waar de aanbieder dat toestaat. Het ingebouwde model is gratis en privé, maar werkt niet op elke computer.

Privacy
Mail Deck heeft geen eigen servers en geen analyse. Het praat alleen met Google en met de maildiensten die je aanzet, elk via de sessie die je browser al heeft, en de mail van elke dienst gaat alleen naar die dienst. Het enige wat erbij komt is de AI-assistent, als je een aanbieder koppelt: wat een verzoek nodig heeft (het gesprek dat je samenvat of beantwoordt, de mail die een vraag vond, de afzender, het onderwerp en het voorbeeld van ongelezen mail die hij sorteert) gaat dan rechtstreeks vanuit je browser naar die aanbieder. Sleutels en aanmeldingen blijven op deze computer, en met het ingebouwde model van Chrome verlaat je mail hem niet. Afmelden stuurt één verzoek naar het eigen afmeldadres van de afzender, en pas nadat je hebt bevestigd. Het adres van de pagina waarop je bent, wordt alleen in het paneel gelezen, nooit opgeslagen of verstuurd. Mail Deck vraagt nooit naar je wachtwoord en bewaart het niet, en je instellingen blijven in je browser.

Mail Deck is open source onder de Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Het is niet gemaakt door of verbonden met welke mailprovider dan ook. Gmail is een handelsmerk van Google LLC.
```

## 日本語 (ja)

**Summary:** ログイン中のすべての受信トレイの未読メールを 1 つの高速パネルに。タブを開かずに読む、アーカイブ、削除。

```
Mail Deck は、ログインしているすべての受信トレイの未読メールを、ツールバーの 1 つのパネルにまとめます。

各メールサービスのウェブページと同じように、ブラウザにすでにあるセッションを使って動作します。パスワードもアプリ パスワードも OAuth も不要で、私たちのサーバーも介しません。Gmail はすぐに使えます。ほかにもいくつかの人気ウェブメール サービスを [設定] → [その他のメール] でオンにできます。Chrome がそのサービスのサイトへのアクセス許可を求め、オフにすると許可は取り消されます。Mail Deck が対応しているサービスの一覧はウェブサイトに掲載しています。

メールをクリックすると、パネル内でそのまま読めます。タブを開かずに、既読にする、アーカイブ、削除、迷惑メールとして報告ができます。メールボックスをクリックすると、そのサービスのサイトで開きます。

ウェブサイトでパネルを開くと、すべての受信トレイからそのサイトのメールが一番上に表示され、届いたばかりのログイン コードをすぐにコピーできます。

機能
- ログイン中のすべてのメールボックス。それぞれに色が付き、ドラッグで並べ替え可能
- 添付ファイルを含むスレッド全体をパネル内で表示
- メールを開く前から、その行に添付ファイルを種類付きで表示。クリックでファイルを開く
- ワンタイム コードを一覧、メール内、通知で目立つように表示。クリックか C キーでコピー
- トラッキング ピクセルは読み込まず、ブロックした数を閲覧中に表示。送信者が名乗っている相手ではないときは穏やかに警告
- 確認のうえ、ワンクリックでニュースレターを配信停止。未読のまま残ったメールもアーカイブ
- Gmail: 最大 10 アカウント、入力しながらの検索と全アカウントの検索、保存した検索、カテゴリのフィルタ ボタン、スター、未読にする、選んだラベルまたはメインタブのみの表示、ワンクリックでビデオ会議
- 後でリマインド: メールを今夜、明日、来週まで一時的に非表示
- パネルや通知から既読、アーカイブ、削除、迷惑メール報告。元に戻すことも可能
- 他のサービスのメールに含まれる画像は、表示を選んだときだけ読み込み
- 通知と任意のサウンド。おやすみ時間、通知しないメールボックス、送信者ごとのルール付き
- 通知にはどの受信トレイ宛てかを表示。未読のあいだ通知を繰り返すことも可能
- アイコンの件数は選択可能: 受信トレイを件数から外す、または前回パネルを開いてから届いたメールだけを数える
- サイドパネル、キーボード ショートカット、操作ごとに 1 つのキー、? キーですべてのキーを一覧表示
- 読んでいるあいだは J と K で次のメール、前のメールを開く
- システムに合わせたライト テーマとダーク テーマ
- 設定の検索と、ファイルまたは Chrome の同期へのバックアップ
- 無料。アカウント数の制限や有料プランはありません

その他のメールサービスにはこのための公開インターフェースがないため、Mail Deck は各サービスのウェブアプリと同じ方法で動作します。サービス側の変更により、Mail Deck が更新されるまでそのサービスが使えなくなることがあります。

AI アシスタント
ボタンは最初から表示されていますが、オンにするまでどこにも何も送信されません。
- 「フライトはいつ？」「10 月の請求書」のように、ふだんの言葉でメールに質問。すべての Gmail アカウントを検索し、見つかったメールを読んで、各メールへの参照付きで回答
- 重要なこと: 未読メールの要約。早めの対応が必要なものから表示
- 新しいメールや、スレッドと同じ言語での返信を作成。内容を確認してから、お使いのメールサービスで送信
- 読んでいるスレッドの要約。日時は Google カレンダーに追加でき、スレッドについての質問にも回答
- 未読メールを分類: 返信待ち、重要、まとめて片付けられるニュースレター
- Chrome 自身の翻訳機能を使い、パソコン上でメールをお使いの言語に翻訳
お使いのパソコン上の Chrome の内蔵モデル、または対応する AI プロバイダで動作します。プロバイダでは、ご自身の API キーか、プロバイダが認めている場合はサブスクリプションでのログインを使います。内蔵モデルは無料でプライベートですが、すべてのパソコンで動くわけではありません。

プライバシー
Mail Deck は独自のサーバーも分析ツールも持ちません。通信するのは Google と、オンにしたメールサービスだけで、いずれもブラウザにすでにあるセッションを使います。各サービスのメールはそのサービスにだけ送られます。例外は、プロバイダを接続した場合の AI アシスタントだけです。このときはリクエストに必要なもの、つまり要約や返信の対象のスレッド、質問で見つかったメール、分類する未読メールの送信者、件名、冒頭部分を、ブラウザから直接そのプロバイダに送信します。キーとログイン情報はこのパソコンに保存されたままで、Chrome の内蔵モデルならメールがパソコンの外に出ることはありません。配信停止は、確認したあとにだけ、送信者自身の配信停止用アドレスにリクエストを 1 回送ります。開いているページのアドレスはパネル内でのみ読み取られ、保存も送信もされません。パスワードを尋ねたり保存したりすることはなく、設定はブラウザ内に保存されます。

Mail Deck は Mozilla Public License 1.1 のオープンソースです: https://github.com/nord-express/mail-deck
どのメール プロバイダが作成したものでもなく、いずれのメール プロバイダとも関係ありません。Gmail は Google LLC の商標です。
```

## 简体中文 (zh_CN)

**Summary:** 将你已登录的所有邮箱中的未读邮件集中到一个快速面板中。无需打开标签页，即可阅读、归档或删除。

```
Mail Deck 将你已登录的所有邮箱中的未读邮件，集中到工具栏上的一个面板中。

它像各邮件服务自己的网页一样，使用浏览器中已有的会话工作：无需密码、应用专用密码或 OAuth，也不经过我们的任何服务器。Gmail 安装后即可使用。另外几个常用的网页邮箱服务可以在“设置”→“其他邮箱”中开启；Chrome 会请求你允许访问该服务的网站，关闭后该权限即被移除。Mail Deck 支持的服务列表见其网站。

点击一封邮件，即可直接在面板中阅读。无需打开标签页，即可将其标为已读、归档、删除或举报为垃圾邮件。点击某个邮箱即可在该服务的网站中打开它。

在某个网站上打开面板，来自该网站的邮件会显示在顶部，涵盖所有邮箱，刚收到的登录验证码可以直接复制。

功能
- 所有已登录的邮箱，每个邮箱一种颜色，可拖动调整顺序
- 在面板中查看完整会话，包括附件
- 邮件的附件在打开之前就显示在该邮件所在的行中，并标明类型；点击即可打开文件
- 一次性验证码在列表、邮件和通知中醒目显示；点击或按 C 即可复制
- 跟踪像素一律不加载，阅读时会显示拦截了多少个；发件人与其名称不符时，给出平和的提醒
- 你确认后，一键退订订阅邮件，并归档它留下的未读邮件
- Gmail：最多十个账号，边输入边搜索、跨账号搜索，已保存的搜索，以筛选按钮显示其分类，星标，标记为未读，选定的标签或仅“主要”标签页，一键发起视频会议
- 稍后提醒：把邮件暂时放到今晚、明天或下周
- 在面板或通知中阅读、归档、删除或举报垃圾邮件，并可撤销
- 其他服务邮件中的图片仅在你要求时才加载
- 新邮件通知和可选提示音，支持免打扰时段、静音邮箱和发件人规则
- 通知会写明是哪个邮箱，并可在邮件未读期间重复提醒
- 自选图标上的计数：可以排除某个邮箱，或只计算上次打开面板以来的邮件
- 侧边栏、键盘快捷键，每个操作一个按键，按 ? 查看全部按键
- 阅读时，按 J 和 K 打开下一封或上一封邮件
- 浅色和深色主题，跟随系统
- 可搜索的设置，并可备份到文件或 Chrome 同步
- 完全免费，不限账号数量，没有付费版本

其他邮件服务没有为此提供公开接口，因此 Mail Deck 采用与它们自己的网页应用相同的方式；如果这些服务做出改动，相应服务可能会停止工作，直到 Mail Deck 更新。

AI 助手
它的按钮从一开始就在，但在你开启之前，不会向任何地方发送任何内容。
- 用日常语言向邮件提问，例如“我的航班是什么时候？”或“十月的发票”：它会搜索所有 Gmail 账号，阅读找到的邮件，并在回答中注明每封邮件的出处
- 重要事项：汇总你的未读邮件，需要你尽快处理的排在最前
- 撰写新邮件，或用会话的语言撰写回复，由你检查后从你的邮件服务发送
- 你正在阅读的会话的摘要，其中的日期可添加到 Google 日历，还能回答你关于该会话的问题
- 未读邮件分类：等待你回复、重要，以及可一次性清理的订阅邮件
- 使用 Chrome 自带的翻译功能，在你的电脑上把邮件翻译成你的语言
它可以使用你电脑上 Chrome 的内置模型，也可以使用受支持的 AI 服务商：用你自己的 API 密钥，或在服务商允许的情况下用你的订阅登录。内置模型免费且私密，但并非每台电脑都能运行。

隐私
Mail Deck 没有自己的服务器，也不做任何统计分析。它只与 Google 和你开启的邮件服务通信，并且都使用浏览器中已有的会话；每个服务的邮件只发送到该服务。唯一的例外是 AI 助手，前提是你连接了服务商：这时，请求所需的内容（你要总结或回复的会话、提问找到的邮件、它所分类的未读邮件的发件人、主题和预览）会直接从你的浏览器发送到该服务商。密钥和登录信息保存在这台电脑上；使用 Chrome 的内置模型时，邮件不会离开这台电脑。退订只会在你确认后，向发件人自己的退订地址发送一次请求。当前页面的地址只在面板内读取，从不保存或发送。Mail Deck 从不询问或保存你的密码，你的设置只保存在浏览器中。

Mail Deck 采用 Mozilla Public License 1.1 开源：https://github.com/nord-express/mail-deck
本扩展并非由任何邮件服务提供商开发，也与它们无关。Gmail 是 Google LLC 的商标。
```

## Português do Brasil (pt_BR)

**Summary:** E-mails não lidos de todas as caixas em que você está conectado, em um painel rápido. Leia, arquive ou exclua sem abrir uma guia.

```
O Mail Deck reúne em um painel na barra de ferramentas os e-mails não lidos de todas as caixas de entrada em que você está conectado.

Ele funciona com a sessão que o navegador já tem, como a própria página web de cada serviço de e-mail: sem senha, sem senha de app, sem OAuth e sem servidores nossos. O Gmail funciona na hora. Vários outros serviços populares de webmail podem ser ativados em Configurações → Outros e-mails; o Chrome pede que você permita os sites desse serviço, e desativá-lo retira a permissão. O site lista os serviços compatíveis com o Mail Deck.

Clique em uma mensagem para lê-la no próprio painel. Você pode marcá-la como lida, arquivá-la, excluí-la ou denunciá-la como spam sem abrir uma guia. Clique em uma caixa de entrada para abri-la no site do serviço.

Abra o painel em um site e os e-mails desse site aparecem no topo, de todas as caixas de entrada, com um código de login recente pronto para copiar.

Recursos
- Todas as caixas de entrada conectadas, cada uma com sua cor e na ordem em que você arrastar
- Conversas inteiras no painel, com os anexos
- Os anexos de uma mensagem aparecem na linha dela antes de você abri-la, com o tipo de cada um; um clique abre o arquivo
- Códigos de uso único se destacam na lista, na mensagem e na notificação; um clique ou a tecla C copia o código
- Pixels de rastreamento nunca carregam, e o leitor mostra quantos deixou de fora; um aviso tranquilo quando um remetente não é quem diz ser
- Cancele a inscrição em uma newsletter com um clique, depois que você confirmar, e arquive o que ela deixou não lido
- Gmail: até dez contas, pesquisa enquanto você digita e em todas as contas, pesquisas salvas, as categorias dele como botões de filtro, estrelas, marcar como não lido, os marcadores escolhidos ou só a guia Principal, e uma reunião por vídeo com um clique
- Lembrar mais tarde: deixe uma mensagem de lado até hoje à noite, amanhã ou a próxima semana
- Ler, arquivar, excluir ou denunciar spam pelo painel ou por uma notificação, com opção de desfazer
- As imagens nos e-mails de outros serviços só carregam quando você pede
- Notificações e um som opcional, com horário silencioso, caixas silenciadas e regras por remetente
- A notificação mostra a caixa de entrada e pode se repetir enquanto o e-mail continuar não lido
- Escolha o que o contador do ícone mostra: deixe uma caixa de fora ou conte só os e-mails desde a última vez que você abriu o painel
- Painel lateral, um atalho de teclado, uma tecla para cada ação e ? para ver todas
- Durante a leitura, J e K abrem a mensagem seguinte ou a anterior
- Tema claro e escuro, de acordo com o sistema
- Configurações com pesquisa, e backup em um arquivo ou na sincronização do Chrome
- Gratuito, sem limite de contas e sem versão paga

Os outros serviços de e-mail não têm uma interface pública para isso, então o Mail Deck segue os próprios apps web deles, e uma mudança do lado deles pode parar um serviço até o Mail Deck ser atualizado.

Assistente de IA
Os botões dele estão lá desde o início, e nada é enviado a lugar nenhum até você ativá-lo.
- Pergunte ao seu e-mail com suas próprias palavras, como “quando é meu voo?” ou “faturas de outubro”: ele pesquisa em todas as contas do Gmail, lê o que encontra e responde com uma referência a cada e-mail
- O que é importante: um resumo dos seus e-mails não lidos, primeiro o que pede sua atenção logo
- Um novo e-mail, ou uma resposta no idioma da conversa, para você revisar e enviar pelo seu serviço de e-mail
- Um resumo da conversa que você está lendo, com as datas para o Google Agenda, e respostas às suas perguntas sobre ela
- E-mails não lidos organizados: aguardando sua resposta, importantes e newsletters para limpar de uma vez
- Traduza uma mensagem para o seu idioma com o próprio tradutor do Chrome, no seu computador
Ele funciona com o modelo integrado do Chrome no seu computador ou com um provedor de IA compatível: sua própria chave de API ou um login com sua assinatura, quando o provedor permite. O modelo integrado é gratuito e privado, mas não funciona em todos os computadores.

Privacidade
O Mail Deck não tem servidores próprios nem análises. Ele se comunica só com o Google e com os serviços de e-mail que você ativar, cada um com a sessão que o navegador já tem, e o e-mail de cada serviço vai só para esse serviço. O único acréscimo é o assistente de IA, se você conectar um provedor: aí o que uma solicitação precisa (a conversa que você resume ou à qual responde, os e-mails que uma pergunta encontrou, o remetente, o assunto e a prévia dos e-mails não lidos que ele organiza) vai direto do seu navegador para esse provedor. Chaves e logins ficam neste computador e, com o modelo integrado do Chrome, seus e-mails não saem dele. O cancelamento de inscrição envia uma única solicitação ao próprio endereço de cancelamento do remetente, e só depois que você confirma. O endereço da página em que você está é lido só dentro do painel e nunca é salvo nem enviado. O Mail Deck nunca pede nem guarda sua senha, e suas configurações ficam no navegador.

O Mail Deck é de código aberto sob a Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Ele não é feito por nenhum provedor de e-mail nem afiliado a nenhum deles. Gmail é uma marca registrada da Google LLC.
```

## العربية (ar)

**Summary:** البريد غير المقروء من كل صناديق البريد التي سجّلت الدخول إليها في لوحة واحدة سريعة. اقرأه أو أرشفه أو احذفه دون فتح علامة تبويب.

```
يجمع Mail Deck في لوحة واحدة على شريط الأدوات البريد غير المقروء من كل صناديق البريد التي سجّلت الدخول إليها.

يعمل عبر الجلسة الموجودة أصلًا في متصفحك، كما تفعل صفحة الويب الخاصة بكل خدمة بريد: لا كلمة مرور، ولا كلمة مرور للتطبيقات، ولا OAuth، ولا خوادم تابعة لنا. يعمل Gmail مباشرة. ويمكن تفعيل عدد من خدمات بريد الويب الشائعة الأخرى من الإعدادات ← بريد آخر؛ سيطلب منك Chrome السماح بمواقع تلك الخدمة، وعند إيقافها يُسحب الإذن. ويعرض موقع Mail Deck الخدمات التي يدعمها.

انقر على رسالة لتقرأها داخل اللوحة مباشرة. يمكنك تعليمها كمقروءة أو أرشفتها أو حذفها أو الإبلاغ عنها كرسالة غير مرغوب فيها دون فتح علامة تبويب. وانقر على صندوق بريد لفتحه على موقع خدمته.

افتح اللوحة على أي موقع ويب، فيظهر بريد ذلك الموقع في الأعلى، من كل صناديق البريد، مع رمز تسجيل دخول حديث جاهز للنسخ.

الميزات
- كل صناديق البريد التي سجّلت الدخول إليها، لكلٍّ منها لونه الخاص، وبالترتيب الذي تختاره بالسحب
- المحادثات كاملة داخل اللوحة، مع المرفقات
- تظهر مرفقات الرسالة في سطرها قبل أن تفتحها، مع نوع كلٍّ منها؛ وبنقرة يُفتح الملف
- تبرز رموز التحقق لمرة واحدة في القائمة وفي الرسالة وفي الإشعار، وتنسخها نقرة أو المفتاح C
- لا تُحمَّل بكسلات التتبّع أبدًا، ويذكر القارئ عدد ما منعه منها؛ وتحذير هادئ عندما لا يكون المرسل من يدّعي أنه هو
- إلغاء الاشتراك في نشرة بريدية بنقرة واحدة بعد أن تؤكّد، وأرشفة ما تركته غير مقروء
- Gmail: حتى عشرة حسابات، والبحث أثناء الكتابة وفي كل الحسابات، وعمليات البحث المحفوظة، وفئاته كأزرار للتصفية، والنجوم، ووضع علامة كغير مقروءة، والتصنيفات التي تختارها أو علامة التبويب «الأساسية» فقط، واجتماع فيديو بنقرة واحدة
- «ذكّرني لاحقًا»: ضع الرسالة جانبًا حتى هذا المساء أو الغد أو الأسبوع القادم
- تعليم الرسائل كمقروءة وأرشفتها وحذفها والإبلاغ عن الرسائل غير المرغوب فيها من اللوحة أو من إشعار، مع إمكانية التراجع
- لا تُحمَّل الصور في رسائل الخدمات الأخرى إلا عندما تطلب ذلك
- إشعارات وصوت اختياري، مع ساعات الهدوء وصناديق بريد صامتة وقواعد حسب المرسل
- يذكر الإشعار صندوق البريد الذي وصلت إليه الرسالة، ويمكن أن يتكرر ما دامت غير مقروءة
- اختر ما يعدّه العدّاد على الرمز: استبعد صندوق بريد، أو احسب فقط البريد الذي وصل منذ آخر فتح للوحة
- لوحة جانبية واختصار لوحة مفاتيح ومفتاح واحد لكل إجراء، والمفتاح ? لعرضها كلها
- أثناء القراءة، يفتح المفتاحان J و K الرسالة التالية أو السابقة
- مظهر فاتح وآخر داكن يتبعان إعدادات نظامك
- إعدادات يمكن البحث فيها، ونسخ احتياطي لها في ملف أو عبر مزامنة Chrome
- مجاني، بلا حدّ لعدد الحسابات وبلا أي نسخة مدفوعة

ليس لدى خدمات البريد الأخرى واجهة عامة لهذا الغرض، لذلك يتبع Mail Deck تطبيقات الويب الخاصة بها، وقد يوقف تغييرٌ من جهتها إحدى الخدمات إلى أن يُحدَّث Mail Deck.

مساعد الذكاء الاصطناعي
أزراره موجودة منذ البداية، ولا يُرسل أي شيء إلى أي مكان إلى أن تشغّله.
- اسأل بريدك بكلماتك الخاصة، مثل «متى موعد رحلتي؟» أو «فواتير أكتوبر»: يبحث في كل حسابات Gmail، ويقرأ ما يجده، ويجيب مع إشارة إلى كل رسالة
- «ما المهم»: ملخّص لبريدك غير المقروء، يبدأ بما يحتاج إلى اهتمامك قريبًا
- كتابة رسالة جديدة، أو ردّ بلغة المحادثة، لتراجعه وترسله من خدمة البريد التي تستخدمها
- ملخّص للمحادثة التي تقرؤها، مع مواعيدها لتقويم Google، وإجابات عن أسئلتك حولها
- فرز البريد غير المقروء: بانتظار ردّك، والمهم، والنشرات البريدية التي يمكنك التخلص منها دفعة واحدة
- ترجمة الرسالة إلى لغتك بمترجم Chrome نفسه، على جهازك
يعمل بالنموذج المدمج في Chrome على جهازك، أو مع أحد مزوّدي الذكاء الاصطناعي المدعومين: بمفتاح API خاص بك، أو بتسجيل الدخول باشتراكك حيث يسمح المزوّد بذلك. النموذج المدمج مجاني وخاص، لكنه لا يعمل على كل كمبيوتر.

الخصوصية
ليس لدى Mail Deck خوادم خاصة به ولا أدوات تحليلات. لا يتواصل إلا مع Google ومع خدمات البريد التي تفعّلها، مستخدمًا لكلٍّ منها الجلسة الموجودة أصلًا في متصفحك، ولا يذهب بريد كل خدمة إلا إليها. والإضافة الوحيدة هي مساعد الذكاء الاصطناعي إذا ربطت به مزوّدًا: عندها يذهب ما يحتاج إليه الطلب (المحادثة التي تلخّصها أو تردّ عليها، والبريد الذي وجده سؤال، والمرسل والموضوع ومقتطف البريد غير المقروء الذي يفرزه) مباشرة من متصفحك إلى ذلك المزوّد. تبقى المفاتيح وبيانات تسجيل الدخول على هذا الكمبيوتر، ومع النموذج المدمج في Chrome لا يغادره بريدك. ولا يُرسل إلغاء الاشتراك إلا طلبًا واحدًا إلى عنوان إلغاء الاشتراك الخاص بالمرسل نفسه، وبعد أن تؤكّد فقط. ولا يُقرأ عنوان الصفحة المفتوحة إلا داخل اللوحة، ولا يُخزَّن ولا يُرسل أبدًا. لا يطلب Mail Deck كلمة مرورك أبدًا ولا يخزّنها، وتبقى إعداداتك في متصفحك.

يتوفر Mail Deck كبرنامج مفتوح المصدر بموجب رخصة Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
لم يطوّره أي مزوّد بريد وليس تابعًا لأيٍّ منهم. Gmail علامة تجارية لشركة Google LLC.
```

## Български (bg)

**Summary:** Непрочетената поща от всички кутии, в които сте влезли, в един бърз панел. Четете, архивирайте и изтривайте без нов раздел.

```
Mail Deck събира в един панел в лентата с инструменти непрочетената поща от всички пощенски кутии, в които сте влезли.

Работи чрез сесията, която браузърът ви вече има, както уеб страницата на всяка пощенска услуга: без парола, без парола за приложение, без OAuth и без наши сървъри. Gmail работи веднага. Още няколко популярни услуги за уеб поща могат да се включат от „Настройки“ → „Друга поща“; Chrome ще поиска да разрешите сайтовете на тази услуга, а изключването ѝ отнема разрешението. На уебсайта е посочено кои услуги поддържа Mail Deck.

Щракнете върху писмо, за да го прочетете направо в панела. Можете да го маркирате като прочетено, да го архивирате, да го изтриете или да подадете сигнал за спам, без да отваряте раздел. Щракнете върху пощенска кутия, за да я отворите в сайта на услугата.

Отворете панела на някой сайт и писмата от този сайт излизат най-отгоре, от всички пощенски кутии, с пресен код за вход, готов за копиране.

Функции
- Всички пощенски кутии, в които сте влезли, всяка със свой цвят и в реда, в който ги подредите с плъзгане
- Цели разговори в панела, с прикачените файлове
- Прикачените файлове на писмото се виждат на реда му още преди да го отворите, заедно с вида им; с щракване файлът се отваря
- Еднократните кодове се открояват в списъка, в писмото и в известието; щракване или клавишът C ги копира
- Пикселите за проследяване никога не се зареждат, а при четене се вижда колко от тях са спрени; спокойно предупреждение, когато подателят не е този, за когото се представя
- Отписване от бюлетин с едно щракване, след като потвърдите, и архивиране на непрочетеното, което е оставил
- Gmail: до десет профила, търсене още докато пишете и във всички профили, запазени търсения, категориите му като бутони за филтриране, звезди, маркиране като непрочетено, избрани етикети или само разделът „Основни“ и видеосреща с едно щракване
- „Напомняне по-късно“: отложете писмо до довечера, до утре или до следващата седмица
- Маркиране като прочетено, архивиране, изтриване и сигнал за спам от панела или от известие, с отмяна
- Изображенията в писмата от други услуги се зареждат само когато поискате
- Известия и звук по желание, с тихи часове, тихи пощенски кутии и правила за податели
- Известието посочва своята пощенска кутия и може да се повтаря, докато писмото е непрочетено
- Изберете какво брои броячът на иконата: изключете кутия или бройте само писмата от последното отваряне на панела
- Страничен панел, клавишна комбинация, по един клавиш за всяко действие и ?, за да ги видите всички
- Докато четете, J и K отварят следващото или предишното писмо
- Светла и тъмна тема според системата
- Настройки с търсене и резервно копие във файл или в синхронизирането на Chrome
- Безплатно, без ограничение на броя профили и без платена версия

Другите пощенски услуги нямат публичен интерфейс за това, затова Mail Deck следва собствените им уеб приложения, а промяна от тяхна страна може да спре някоя услуга, докато Mail Deck не бъде обновен.

ИИ асистент
Бутоните му са там от самото начало, но нищо не се изпраща никъде, докато не го включите.
- Питайте пощата си със свои думи, например „кога е полетът ми?“ или „фактури от октомври“: асистентът търси във всички профили в Gmail, чете намереното и отговаря с препратка към всяко писмо
- „Кое е важно“: обобщение на непрочетената поща, първо това, което скоро изисква вниманието ви
- Ново писмо или отговор на езика на разговора, готови да ги прегледате и изпратите от пощенската си услуга
- Обобщение на разговора, който четете, с датите в него за Google Календар и отговори на въпросите ви за него
- Непрочетената поща, подредена: очакващи вашия отговор, важни и бюлетини за изчистване наведнъж
- Превод на писмо на вашия език със собствения преводач на Chrome, на вашия компютър
Работи с вградения модел на Chrome на вашия компютър или с поддържан доставчик на ИИ: с ваш собствен API ключ или с вход чрез абонамента ви, където доставчикът го позволява. Вграденият модел е безплатен и поверителен, но не работи на всеки компютър.

Поверителност
Mail Deck няма собствени сървъри и не използва аналитика. Разширението се свързва само с Google и с пощенските услуги, които включите, с всяка чрез сесията, която браузърът ви вече има, и пощата на всяка услуга отива само към нея. Единственото допълнение е ИИ асистентът, ако свържете доставчик: тогава това, което е нужно за заявката (разговорът, който обобщавате или на който отговаряте, писмата, намерени по въпрос, подателят, темата и началото на непрочетените писма, които той подрежда), отива направо от браузъра ви до този доставчик. Ключовете и данните за вход остават на този компютър, а с вградения модел на Chrome пощата ви не го напуска. Отписването изпраща една-единствена заявка до собствения адрес за отписване на подателя и само след като потвърдите. Адресът на страницата, на която сте, се чете само в панела и никога не се съхранява или изпраща. Разширението никога не иска и не съхранява паролата ви, а настройките ви остават в браузъра.

Mail Deck е с отворен код под лиценза Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Разширението не е създадено от пощенски доставчик и не е свързано с никой от тях. Gmail е търговска марка на Google LLC.
```

## Català (ca)

**Summary:** Correu no llegit de totes les bústies amb la sessió iniciada, en un tauler ràpid. Llegeix, arxiva o suprimeix sense cap pestanya.

```
Mail Deck reuneix en un sol tauler de la barra d'eines el correu no llegit de totes les bústies amb què has iniciat la sessió.

Funciona amb la sessió que el navegador ja té, igual que la pàgina web de cada servei de correu: sense contrasenya, sense contrasenya d'aplicació, sense OAuth i sense servidors nostres. Gmail funciona de seguida. Uns quants serveis de correu web populars més es poden activar a Opcions → Altre correu; Chrome et demanarà que permetis els llocs d'aquell servei, i desactivar-lo retira el permís. El lloc web indica quins serveis admet Mail Deck.

Fes clic en un missatge per llegir-lo al mateix tauler. Pots marcar-lo com a llegit, arxivar-lo, suprimir-lo o marcar-lo com a correu brossa sense obrir cap pestanya. Fes clic en una bústia per obrir-la al lloc del servei.

Obre el tauler en un lloc web i el correu d'aquell lloc apareix a dalt de tot, de totes les bústies, amb un codi d'inici de sessió recent a punt per copiar.

Funcions
- Totes les bústies amb la sessió iniciada, cadascuna amb el seu color i en l'ordre en què les arrosseguis
- Converses senceres al tauler, amb els fitxers adjunts
- Els fitxers adjunts d'un missatge es veuen a la seva línia abans d'obrir-lo, amb el seu tipus; un clic obre el fitxer
- Els codis d'un sol ús destaquen a la llista, al missatge i a la notificació; un clic o la tecla C els copia
- Els píxels de seguiment no es carreguen mai, i el lector diu quants n'ha deixat fora; un avís tranquil quan un remitent no és qui diu ser
- Cancel·la la subscripció a un butlletí amb un clic, després de confirmar-ho, i arxiva el que ha deixat sense llegir
- Gmail: fins a deu comptes, cerca mentre escrius i a tots els comptes, cerques desades, les seves categories com a botons de filtre, estrelles, marcar com a no llegit, les etiquetes que triïs o només la pestanya «Principal», i una reunió de vídeo amb un clic
- «Recorda-m'ho més tard»: aparta un missatge fins aquesta tarda, fins demà o fins a la setmana que ve
- Marcar com a llegit, arxivar, suprimir o marcar com a correu brossa des del tauler o d'una notificació, amb opció de desfer
- Les imatges del correu d'altres serveis només es carreguen quan les demanes
- Notificacions i un so opcional, amb hores de silenci, bústies silenciades i regles per remitent
- Cada notificació indica la seva bústia i es pot repetir mentre el correu continuï sense llegir
- Tria què compta el comptador de la icona: deixa fora una bústia o compta només el correu des de l'última vegada que vas obrir el tauler
- Tauler lateral, una drecera de teclat, una tecla per a cada acció i ? per veure-les totes
- Mentre llegeixes, J i K obren el missatge següent o l'anterior
- Tema clar i fosc, segons el sistema
- Opcions amb un cercador, i còpia de seguretat en un fitxer o a la sincronització de Chrome
- Gratuït, sense límit de comptes i sense cap versió de pagament

Els altres serveis de correu no tenen cap interfície pública per a això, així que Mail Deck segueix les seves pròpies aplicacions web, i un canvi per part seva en pot aturar un fins que Mail Deck s'actualitzi.

Assistent d'IA
Els seus botons hi són des del principi, i no s'envia res enlloc fins que l'activis.
- Pregunta al teu correu amb les teves paraules, com ara «quan és el meu vol?» o «factures d'octubre»: cerca a tots els comptes de Gmail, llegeix el que troba i respon amb una referència a cada missatge
- «Què és important»: un resum del correu no llegit, primer el que aviat requereix la teva atenció
- Un correu nou, o una resposta en la llengua de la conversa, per revisar-los i enviar-los des del teu servei de correu
- Un resum de la conversa que llegeixes, amb les seves dates per a Google Calendar, i respostes a les teves preguntes sobre ella
- El correu no llegit, ordenat: el que espera la teva resposta, l'important i els butlletins per netejar d'un sol cop
- Tradueix un missatge a la teva llengua amb el traductor del mateix Chrome, al teu ordinador
Funciona amb el model integrat de Chrome al teu ordinador o amb un proveïdor d'IA compatible: la teva pròpia clau d'API, o un inici de sessió amb la teva subscripció on el proveïdor ho permeti. El model integrat és gratuït i privat, però no funciona a tots els ordinadors.

Privadesa
Mail Deck no té servidors propis ni cap eina d'analítica. Només es comunica amb Google i amb els serveis de correu que activis, cadascun amb la sessió que el navegador ja té oberta, i el correu de cada servei només va a aquell servei. L'únic afegit és l'assistent d'IA, si connectes un proveïdor: el que necessita una petició (la conversa que resumeixes o a la qual respons, el correu que ha trobat una pregunta, el remitent, l'assumpte i la previsualització del correu no llegit que ordena) va llavors directament del teu navegador a aquell proveïdor. Les claus i els inicis de sessió es queden en aquest ordinador, i amb el model integrat de Chrome el teu correu no en surt. Cancel·lar una subscripció envia una sola petició a l'adreça de baixa del mateix remitent, i només després que ho confirmis. L'adreça de la pàgina on ets només es llegeix dins del tauler; mai no es desa ni s'envia. Mail Deck mai no et demana la contrasenya ni la desa, i les teves opcions es queden al navegador.

Mail Deck és de codi obert, amb la llicència Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
No l'ha creat cap proveïdor de correu ni hi està vinculat. Gmail és una marca comercial de Google LLC.
```

## Ελληνικά (el)

**Summary:** Αδιάβαστα από κάθε γραμματοκιβώτιο όπου είστε συνδεδεμένοι, σε γρήγορο πλαίσιο. Διαβάστε, αρχειοθετήστε ή διαγράψτε χωρίς καρτέλες.

```
Το Mail Deck συγκεντρώνει σε έναν πίνακα στη γραμμή εργαλείων τα αδιάβαστα μηνύματα από όλα τα γραμματοκιβώτια στα οποία είστε συνδεδεμένοι.

Λειτουργεί μέσω της περιόδου σύνδεσης που έχει ήδη το πρόγραμμα περιήγησής σας, όπως η ίδια η ιστοσελίδα κάθε υπηρεσίας αλληλογραφίας: χωρίς κωδικό πρόσβασης, χωρίς κωδικό εφαρμογής, χωρίς OAuth και χωρίς δικούς μας διακομιστές. Το Gmail λειτουργεί αμέσως. Αρκετές άλλες δημοφιλείς υπηρεσίες webmail ενεργοποιούνται στις Ρυθμίσεις → Άλλη αλληλογραφία· το Chrome θα σας ζητήσει να επιτρέψετε τους ιστότοπους αυτής της υπηρεσίας, και η απενεργοποίηση αφαιρεί την άδεια. Ο ιστότοπος του Mail Deck αναφέρει ποιες υπηρεσίες υποστηρίζει.

Κάντε κλικ σε ένα μήνυμα για να το διαβάσετε μέσα στον πίνακα. Μπορείτε να το επισημάνετε ως αναγνωσμένο, να το αρχειοθετήσετε, να το διαγράψετε ή να το αναφέρετε ως spam χωρίς να ανοίξετε καρτέλα. Κάντε κλικ σε ένα γραμματοκιβώτιο για να το ανοίξετε στον ιστότοπο της υπηρεσίας.

Ανοίξτε τον πίνακα σε έναν ιστότοπο και η αλληλογραφία από αυτόν εμφανίζεται πρώτη, από όλα τα γραμματοκιβώτια, με έναν πρόσφατο κωδικό σύνδεσης έτοιμο για αντιγραφή.

Λειτουργίες
- Όλα τα γραμματοκιβώτια στα οποία είστε συνδεδεμένοι, το καθένα με δικό του χρώμα και με τη σειρά που ορίζετε σύροντάς τα
- Ολόκληρες συζητήσεις μέσα στον πίνακα, μαζί με τα συνημμένα
- Τα συνημμένα ενός μηνύματος εμφανίζονται στη γραμμή του πριν το ανοίξετε, με τον τύπο τους· ένα κλικ ανοίγει το αρχείο
- Οι κωδικοί μίας χρήσης ξεχωρίζουν στη λίστα, στο μήνυμα και στην ειδοποίηση· ένα κλικ ή το πλήκτρο C τους αντιγράφει
- Τα pixel παρακολούθησης δεν φορτώνονται ποτέ, και κατά την ανάγνωση φαίνεται πόσα κρατήθηκαν έξω· μια ήρεμη προειδοποίηση όταν ένας αποστολέας δεν είναι αυτός που λέει ότι είναι
- Κατάργηση εγγραφής από ένα ενημερωτικό δελτίο με ένα κλικ, αφού επιβεβαιώσετε, και αρχειοθέτηση όσων άφησε αδιάβαστα
- Gmail: έως δέκα λογαριασμοί, αναζήτηση καθώς πληκτρολογείτε και σε όλους τους λογαριασμούς, αποθηκευμένες αναζητήσεις, οι κατηγορίες του ως κουμπιά φίλτρων, αστέρια, επισήμανση ως μη αναγνωσμένου, επιλεγμένες ετικέτες ή μόνο η καρτέλα «Κύρια», και βιντεοσύσκεψη με ένα κλικ
- «Υπενθύμιση αργότερα»: αφήστε ένα μήνυμα στην άκρη μέχρι σήμερα το απόγευμα, μέχρι αύριο ή μέχρι την επόμενη εβδομάδα
- Επισήμανση ως αναγνωσμένο, αρχειοθέτηση, διαγραφή ή αναφορά ως spam από τον πίνακα ή από μια ειδοποίηση, με δυνατότητα αναίρεσης
- Οι εικόνες στα μηνύματα άλλων υπηρεσιών φορτώνονται μόνο όταν το ζητήσετε
- Ειδοποιήσεις και προαιρετικός ήχος, με ώρες ησυχίας, σιωπηλά γραμματοκιβώτια και κανόνες ανά αποστολέα
- Η ειδοποίηση αναφέρει το γραμματοκιβώτιό της και μπορεί να επανέρχεται όσο το μήνυμα μένει αδιάβαστο
- Επιλέξτε τι μετρά ο μετρητής στο εικονίδιο: αφήστε έξω ένα γραμματοκιβώτιο ή μετρήστε μόνο τα μηνύματα από το τελευταίο άνοιγμα του πίνακα
- Πλαϊνός πίνακας, συντόμευση πληκτρολογίου, ένα πλήκτρο για κάθε ενέργεια και ? για να τα δείτε όλα
- Κατά την ανάγνωση, τα J και K ανοίγουν το επόμενο ή το προηγούμενο μήνυμα
- Ανοιχτό και σκούρο θέμα, ανάλογα με το σύστημά σας
- Ρυθμίσεις με αναζήτηση, και αντίγραφο ασφαλείας σε αρχείο ή στον συγχρονισμό του Chrome
- Δωρεάν, χωρίς όριο λογαριασμών και χωρίς έκδοση επί πληρωμή

Οι άλλες υπηρεσίες αλληλογραφίας δεν έχουν δημόσια διεπαφή για αυτό, γι' αυτό το Mail Deck ακολουθεί τις δικές τους εφαρμογές ιστού, και μια αλλαγή από την πλευρά τους μπορεί να σταματήσει μια υπηρεσία μέχρι να ενημερωθεί το Mail Deck.

Βοηθός τεχνητής νοημοσύνης
Τα κουμπιά του υπάρχουν από την αρχή, και τίποτα δεν στέλνεται πουθενά μέχρι να τον ενεργοποιήσετε.
- Ρωτήστε την αλληλογραφία σας με δικά σας λόγια, όπως «πότε είναι η πτήση μου;» ή «τιμολόγια Οκτωβρίου»: ψάχνει σε όλους τους λογαριασμούς Gmail, διαβάζει ό,τι βρίσκει και απαντά με αναφορά σε κάθε μήνυμα
- «Τι είναι σημαντικό»: σύνοψη των αδιάβαστων μηνυμάτων σας, πρώτα ό,τι χρειάζεται σύντομα την προσοχή σας
- Ένα νέο μήνυμα ή μια απάντηση στη γλώσσα της συζήτησης, για να το ελέγξετε και να το στείλετε από την υπηρεσία αλληλογραφίας σας
- Σύνοψη της συζήτησης που διαβάζετε, με τις ημερομηνίες της για το Ημερολόγιο Google, και απαντήσεις στις ερωτήσεις σας γι' αυτήν
- Τα αδιάβαστα ταξινομημένα: όσα περιμένουν την απάντησή σας, τα σημαντικά, και τα ενημερωτικά δελτία που καθαρίζετε μονομιάς
- Μετάφραση ενός μηνύματος στη γλώσσα σας με τον μεταφραστή του ίδιου του Chrome, στον υπολογιστή σας
Λειτουργεί με το ενσωματωμένο μοντέλο του Chrome στον υπολογιστή σας ή με έναν υποστηριζόμενο πάροχο τεχνητής νοημοσύνης: με το δικό σας κλειδί API ή με σύνδεση μέσω της συνδρομής σας, όπου το επιτρέπει ο πάροχος. Το ενσωματωμένο μοντέλο είναι δωρεάν και ιδιωτικό, αλλά δεν λειτουργεί σε κάθε υπολογιστή.

Απόρρητο
Το Mail Deck δεν έχει δικούς του διακομιστές ούτε εργαλεία ανάλυσης. Επικοινωνεί μόνο με την Google και με τις υπηρεσίες αλληλογραφίας που ενεργοποιείτε, με την καθεμία μέσω της περιόδου σύνδεσης που έχει ήδη το πρόγραμμα περιήγησής σας, και η αλληλογραφία κάθε υπηρεσίας πηγαίνει μόνο σε αυτήν. Η μόνη προσθήκη είναι ο βοηθός τεχνητής νοημοσύνης, αν συνδέσετε έναν πάροχο: τότε ό,τι χρειάζεται ένα αίτημα (η συζήτηση που συνοψίζετε ή στην οποία απαντάτε, τα μηνύματα που βρήκε μια ερώτηση, ο αποστολέας, το θέμα και η αρχή των αδιάβαστων μηνυμάτων που ταξινομεί) πηγαίνει κατευθείαν από το πρόγραμμα περιήγησής σας σε αυτόν τον πάροχο. Τα κλειδιά και οι συνδέσεις μένουν σε αυτόν τον υπολογιστή, και με το ενσωματωμένο μοντέλο του Chrome η αλληλογραφία σας δεν φεύγει από αυτόν. Η κατάργηση εγγραφής στέλνει ένα μόνο αίτημα στη διεύθυνση κατάργησης εγγραφής του ίδιου του αποστολέα, και μόνο αφού επιβεβαιώσετε. Η διεύθυνση της σελίδας όπου βρίσκεστε διαβάζεται μόνο μέσα στον πίνακα και δεν αποθηκεύεται ούτε στέλνεται ποτέ. Το Mail Deck δεν ζητά ούτε αποθηκεύει ποτέ τον κωδικό πρόσβασής σας, και οι ρυθμίσεις σας μένουν στο πρόγραμμα περιήγησης.

Το Mail Deck είναι ανοιχτού κώδικα, με την άδεια Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Δεν έχει δημιουργηθεί από κανέναν πάροχο αλληλογραφίας και δεν συνδέεται με κανέναν από αυτούς. Το Gmail είναι εμπορικό σήμα της Google LLC.
```

## עברית (he)

**Summary:** הדואר שלא נקרא מכל התיבות שאליהן התחברתם, בחלונית מהירה אחת. קראו, העבירו לארכיון או מחקו בלי לפתוח כרטיסייה.

```
התוסף Mail Deck מרכז בחלונית אחת בסרגל הכלים את הדואר שלא נקרא מכל תיבות הדואר שאליהן התחברתם.

הוא עובד דרך ההתחברות שכבר פעילה בדפדפן, בדיוק כמו דף האינטרנט של כל שירות דואר: בלי סיסמה, בלי סיסמת אפליקציה, בלי OAuth ובלי שרתים שלנו. Gmail עובד מיד. כמה שירותי דואר אינטרנטי פופולריים נוספים אפשר להפעיל בהגדרות ← דואר אחר; Chrome יבקש מכם לאשר את האתרים של אותו שירות, וכיבוי השירות מבטל את ההרשאה. רשימת השירותים ש-Mail Deck תומך בהם נמצאת באתר שלו.

לחצו על הודעה כדי לקרוא אותה ישירות בחלונית. אפשר לסמן אותה כנקראה, להעביר אותה לארכיון, למחוק אותה או לדווח עליה כספאם בלי לפתוח כרטיסייה. לחצו על תיבת דואר כדי לפתוח אותה באתר השירות.

פתחו את החלונית באתר כלשהו, והדואר מאותו אתר יופיע למעלה, מכל התיבות, עם קוד כניסה טרי שמוכן להעתקה.

תכונות
- כל תיבות הדואר שאליהן התחברתם, כל אחת בצבע משלה ובסדר שתקבעו בגרירה
- שיחות שלמות בחלונית, כולל קבצים מצורפים
- הקבצים המצורפים להודעה מופיעים בשורה שלה עוד לפני שפותחים אותה, עם הסוג שלהם; לחיצה פותחת את הקובץ
- קודים חד-פעמיים בולטים ברשימה, בהודעה ובהתראה; לחיצה או המקש C מעתיקים אותם
- פיקסלי מעקב אף פעם לא נטענים, ובזמן הקריאה רואים כמה מהם נחסמו; אזהרה רגועה כשהשולח אינו מי שהוא טוען שהוא
- ביטול הרשמה לניוזלטר בלחיצה אחת, אחרי שתאשרו, והעברה לארכיון של מה שהשאיר שלא נקרא
- Gmail: עד עשרה חשבונות, חיפוש תוך כדי הקלדה ובכל החשבונות, חיפושים שמורים, הקטגוריות שלו ככפתורי סינון, כוכבים, סימון כלא נקרא, תוויות נבחרות או רק הכרטיסייה ״ראשי״, ופגישת וידאו בלחיצה אחת
- ״הזכר לי מאוחר יותר״: הניחו הודעה בצד עד הערב, עד מחר או עד השבוע הבא
- סימון כנקראה, העברה לארכיון, מחיקה ודיווח כספאם מהחלונית או מהתראה, עם אפשרות ביטול
- תמונות בדואר משירותים אחרים נטענות רק כשאתם מבקשים
- התראות וצליל לבחירה, עם שעות שקט, תיבות דואר שקטות וכללים לפי שולח
- כל התראה מציינת את התיבה שלה, ויכולה לחזור כל עוד ההודעה לא נקראה
- בחרו מה המונה שעל הסמל סופר: השאירו תיבה מחוץ למונה, או ספרו רק דואר מאז הפתיחה האחרונה של החלונית
- חלונית צד, קיצור מקלדת, מקש אחד לכל פעולה, והמקש ? כדי לראות את כולם
- בזמן הקריאה, J ו-K פותחים את ההודעה הבאה או הקודמת
- ערכת נושא בהירה וכהה, בהתאם למערכת
- הגדרות עם חיפוש, וגיבוי שלהן לקובץ או לסנכרון של Chrome
- חינם, בלי הגבלה על מספר החשבונות ובלי גרסה בתשלום

לשירותי הדואר האחרים אין ממשק ציבורי לכך, ולכן Mail Deck פועל כמו אפליקציות האינטרנט שלהם עצמם, ושינוי בצד שלהם עלול לעצור שירות עד ש-Mail Deck יעודכן.

עוזר בינה מלאכותית
הכפתורים שלו שם מההתחלה, ושום דבר לא נשלח לשום מקום עד שתפעילו אותו.
- שאלו את הדואר שלכם במילים פשוטות, כמו ״מתי הטיסה שלי?״ או ״חשבוניות מאוקטובר״: הוא מחפש בכל חשבונות Gmail, קורא את מה שהוא מוצא ועונה עם הפניה לכל הודעה
- ״מה חשוב״: סיכום של הדואר שלא נקרא, קודם מה שידרוש את תשומת לבכם בקרוב
- הודעה חדשה או תשובה בשפת השיחה, לבדיקה ולשליחה משירות הדואר שלכם
- סיכום של השיחה שאתם קוראים, עם התאריכים שבה ליומן Google, ותשובות לשאלות שלכם עליה
- מיון הדואר שלא נקרא: מחכים לתשובה שלך, חשוב, וניוזלטרים שאפשר לנקות בבת אחת
- תרגום הודעה לשפה שלכם עם המתרגם של Chrome עצמו, במחשב שלכם
הוא פועל עם המודל המובנה של Chrome במחשב שלכם, או עם ספק בינה מלאכותית נתמך: מפתח API משלכם, או התחברות עם המינוי שלכם כשהספק מאפשר זאת. המודל המובנה חינמי ופרטי, אבל לא פועל בכל מחשב.

פרטיות
ל-Mail Deck אין שרתים משלו ואין כלי ניתוח נתונים. הוא מתקשר רק עם Google ועם שירותי הדואר שהפעלתם, כל אחד דרך ההתחברות שכבר פעילה בדפדפן שלכם, והדואר של כל שירות נשלח רק אליו. התוספת היחידה היא עוזר הבינה המלאכותית, אם תחברו ספק: אז מה שבקשה צריכה (השיחה שאתם מסכמים או עונים עליה, הדואר שנמצא בעקבות שאלה, השולח, הנושא והתצוגה המקדימה של דואר שלא נקרא שהוא ממיין) נשלח ישירות מהדפדפן שלכם לאותו ספק. המפתחות וההתחברויות נשארים במחשב הזה, ועם המודל המובנה של Chrome הדואר שלכם לא יוצא ממנו. ביטול הרשמה שולח בקשה אחת בלבד לכתובת ביטול ההרשמה של השולח עצמו, ורק אחרי שתאשרו. כתובת הדף שבו אתם נמצאים נקראת רק בתוך החלונית, ולעולם לא נשמרת או נשלחת. Mail Deck אף פעם לא מבקש את הסיסמה שלכם ולא שומר אותה, וההגדרות שלכם נשארות בדפדפן.

הקוד של Mail Deck פתוח, ברישיון Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
התוסף לא נוצר על ידי אף ספק דואר ואינו קשור לאף אחד מהם. Gmail הוא סימן מסחרי של Google LLC.
```

## Magyar (hu)

**Summary:** Minden bejelentkezett postafiók olvasatlan levelei egy gyors panelen. Olvasd, archiváld vagy töröld lapnyitás nélkül.

```
A Mail Deck egyetlen panelre gyűjti az eszköztáron az összes olyan postafiók olvasatlan leveleit, amelybe be vagy jelentkezve.

A böngésződben már meglévő munkamenettel működik, ugyanúgy, mint az egyes levelezőszolgáltatások saját weboldala: nincs jelszó, nincs alkalmazásjelszó, nincs OAuth, és nincsenek saját szervereink. A Gmail azonnal működik. Több más népszerű webes levelezőszolgáltatás is bekapcsolható a Beállítások → Más levelezőszolgáltatók részben; a Chrome engedélyt kér a szolgáltatás oldalaihoz, kikapcsoláskor pedig az engedély megszűnik. A weboldalon megtalálod, mely szolgáltatásokat támogatja a Mail Deck.

Kattints egy levélre, és magában a panelen olvashatod el. Olvasottnak jelölheted, archiválhatod, törölheted vagy spamként jelentheted anélkül, hogy lapot nyitnál. Ha egy postafiókra kattintasz, megnyílik a szolgáltatás oldalán.

Nyisd meg a panelt egy weboldalon, és az onnan érkezett levelek kerülnek felülre, az összes postafiókból, egy friss belépési kóddal, amelyet rögtön kimásolhatsz.

Funkciók
- Az összes bejelentkezett postafiók, mindegyik saját színnel, abban a sorrendben, ahogy áthúzással elrendezed őket
- Teljes beszélgetések a panelen, a mellékletekkel együtt
- Egy levél mellékletei már megnyitás előtt látszanak a sorában, a típusukkal együtt; egy kattintás megnyitja a fájlt
- Az egyszer használatos kódok kiemelve látszanak a listában, a levélben és az értesítésben; egy kattintás vagy a C billentyű kimásolja őket
- A követőpixelek sosem töltődnek be, és olvasás közben látszik, hányat tartott vissza; nyugodt figyelmeztetés, ha a feladó nem az, akinek mondja magát
- Leiratkozás egy hírlevélről egy kattintással, miután megerősítetted, és az olvasatlanul hagyott leveleinek archiválása
- Gmail: legfeljebb tíz fiók, keresés már gépelés közben és az összes fiókban, mentett keresések, a kategóriái szűrőgombokként, csillagok, megjelölés olvasatlanként, kiválasztott címkék vagy csak az „Elsődleges” lap, és videomegbeszélés egy kattintással
- „Emlékeztetés később”: tedd félre a levelet ma estig, holnapig vagy jövő hétig
- Olvasottnak jelölés, archiválás, törlés és spam bejelentése a panelről vagy egy értesítésből, visszavonási lehetőséggel
- A más szolgáltatásoktól érkező levelek képei csak kérésre töltődnek be
- Értesítések és választható hang, csendes órákkal, néma postafiókokkal és feladók szerinti szabályokkal
- Az értesítés megnevezi a postafiókját, és ismétlődhet, amíg a levél olvasatlan
- Te döntöd el, mit számol az ikon számlálója: kihagyhatsz egy postafiókot, vagy csak a panel legutóbbi megnyitása óta érkezett leveleket számolhatod
- Oldalsó panel, billentyűparancs, műveletenként egy billentyű, és a ?, amely mindet megmutatja
- Olvasás közben a J és a K a következő vagy az előző levelet nyitja meg
- Világos és sötét téma, a rendszerhez igazodva
- Kereshető beállítások, és biztonsági mentésük fájlba vagy a Chrome-szinkronizálásba
- Ingyenes, fiókkorlát és fizetős változat nélkül

A többi levelezőszolgáltatás nem kínál ehhez nyilvános felületet, ezért a Mail Deck a saját webalkalmazásaikat követi, és egy változás az ő oldalukon leállíthat egy szolgáltatást, amíg a Mail Deck frissítést nem kap.

MI-asszisztens
A gombjai kezdettől ott vannak, de semmi nem megy sehová, amíg be nem kapcsolod.
- Kérdezd a leveleidet a saját szavaiddal, például „mikor indul a járatom?” vagy „októberi számlák”: az összes Gmail-fiókban keres, elolvassa, amit talál, és minden levélre hivatkozva válaszol
- „Mi a fontos”: az olvasatlan leveleid összefoglalva, elöl az, ami hamarosan a figyelmedet igényli
- Új levél vagy válasz a beszélgetés nyelvén, amelyet átnézhetsz és elküldhetsz a saját levelezőszolgáltatásodból
- Az olvasott beszélgetés összefoglalója, az időpontjaival a Google Naptárhoz, és válaszok a vele kapcsolatos kérdéseidre
- Rendezett olvasatlan levelek: válaszodra vár, fontos, és hírlevelek, amelyeket egy mozdulattal eltakaríthatsz
- Levél fordítása a saját nyelvedre a Chrome saját fordítójával, a számítógépeden
A Chrome beépített modelljével fut a számítógépeden, vagy egy támogatott MI-szolgáltatóval: a saját API-kulcsoddal, vagy ahol a szolgáltató engedi, az előfizetéseddel bejelentkezve. A beépített modell ingyenes és privát, de nem minden számítógépen fut.

Adatvédelem
A Mail Deck nem rendelkezik saját szerverekkel, és nem használ analitikát. Csak a Google-lal és a bekapcsolt levelezőszolgáltatásokkal kommunikál, mindegyikkel a böngésződben már meglévő munkameneten keresztül, és minden szolgáltatás levelei csak az adott szolgáltatáshoz jutnak el. Egyetlen kivétel az MI-asszisztens, ha összekapcsolod egy szolgáltatóval: ekkor az, amire egy kérésnek szüksége van (az összefoglalt vagy megválaszolt beszélgetés, a kérdésre talált levelek, az általa rendezett olvasatlan levelek feladója, tárgya és előnézete), egyenesen a böngésződből jut el ahhoz a szolgáltatóhoz. A kulcsok és a bejelentkezések ezen a számítógépen maradnak, a Chrome beépített modelljével pedig a leveleid el sem hagyják. A leiratkozás egyetlen kérést küld a feladó saját leiratkozási címére, és csak azután, hogy megerősítetted. A Mail Deck az éppen megnyitott oldal címét csak a panelen belül olvassa, soha nem tárolja és nem küldi el. Soha nem kéri el és nem tárolja a jelszavadat, a beállításaid pedig a böngésződben maradnak.

A Mail Deck nyílt forráskódú, a Mozilla Public License 1.1 feltételei szerint: https://github.com/nord-express/mail-deck
Egyetlen levelezőszolgáltató sem készítette, és egyikkel sem áll kapcsolatban. A Gmail a Google LLC védjegye.
```

## Српски (sr)

**Summary:** Непрочитана пошта из свих сандучића на које сте пријављени, у брзом панелу. Читајте, архивирајте, бришите без нове картице.

```
Mail Deck окупља у један панел на траци с алаткама непрочитану пошту из свих сандучића на које сте пријављени.

Ради преко сесије коју ваш прегледач већ има, као и веб-страница сваког сервиса е-поште: без лозинке, без лозинке за апликацију, без OAuth-а и без наших сервера. Gmail ради одмах. Још неколико популарних сервиса веб-поште можете да укључите у Подешавањима → Друга пошта; Chrome ће затражити да дозволите сајтове тог сервиса, а искључивање повлачи дозволу. На веб-сајту пише које сервисе Mail Deck подржава.

Кликните на поруку да бисте је прочитали у самом панелу. Можете је означити као прочитану, архивирати, избрисати или пријавити као непожељну, без отварања картице. Кликните на сандуче да бисте га отворили на сајту сервиса.

Отворите панел на неком сајту и пошта са тог сајта биће на врху, из свих сандучића, са свежим кодом за пријаву спремним за копирање.

Функције
- Сва сандучад на која сте пријављени, свако у својој боји и редоследом који одредите превлачењем
- Цела преписка у панелу, с прилозима
- Прилози поруке виде се у њеном реду и пре него што је отворите, заједно са врстом; клик отвара датотеку
- Једнократни кодови се истичу у листи, у поруци и у обавештењу; клик или тастер C их копира
- Пиксели за праћење се никада не учитавају, а при читању се види колико их је задржано; мирно упозорење када пошиљалац није онај за кога се представља
- Отказивање пријаве на билтен једним кликом, пошто потврдите, и архивирање онога што је оставио непрочитано
- Gmail: до десет налога, претрага док куцате и претрага свих налога, сачуване претраге, његове категорије као дугмад за филтрирање, звездице, означавање као непрочитано, изабране ознаке или само картица „Примарно“ и видео-састанак једним кликом
- „Подсети ме касније“: склоните поруку до вечерас, до сутра или до следеће недеље
- Означавање као прочитано, архивирање, брисање и пријава непожељне поште из панела или из обавештења, уз опозив
- Слике у пошти других сервиса учитавају се тек када то затражите
- Обавештења и звук по избору, с тихим сатима, тихим сандучићима и правилима за пошиљаоце
- Обавештење наводи своје сандуче и може да се понавља док је порука непрочитана
- Изаберите шта броји бројач на икони: изоставите неко сандуче или бројте само пошту од последњег отварања панела
- Бочна табла, пречица на тастатури, по један тастер за сваку радњу и ? да их све видите
- Док читате, J и K отварају следећу или претходну поруку
- Светла и тамна тема, према систему
- Подешавања с претрагом и резервна копија у датотеци или у Chrome синхронизацији
- Бесплатно, без ограничења броја налога и без плаћене верзије

Остали сервиси е-поште немају јавни интерфејс за ово, па Mail Deck прати њихове сопствене веб-апликације, а промена на њиховој страни може да заустави неки сервис док се Mail Deck не ажурира.

Асистент вештачке интелигенције
Његова дугмад су ту од почетка, а ништа се никуда не шаље док га не укључите.
- Питајте пошту својим речима, на пример „када је мој лет?“ или „рачуни из октобра“: претражује све Gmail налоге, чита оно што нађе и одговара уз упућивање на сваку поруку
- „Шта је важно“: сажетак непрочитане поште, прво оно што ускоро тражи вашу пажњу
- Нова порука или одговор на језику преписке, да их проверите и пошаљете из свог сервиса е-поште
- Сажетак преписке коју читате, са њеним датумима за Google календар, и одговори на ваша питања о њој
- Непрочитана пошта разврстана: чека ваш одговор, важно и билтени које можете да очистите одједном
- Превод поруке на ваш језик сопственим преводиоцем Chrome-а, на вашем рачунару
Ради са уграђеним моделом у Chrome-у на вашем рачунару или са подржаним добављачем вештачке интелигенције: са вашим сопственим API кључем или пријавом преко ваше претплате, где добављач то дозвољава. Уграђени модел је бесплатан и приватан, али не ради на сваком рачунару.

Приватност
Mail Deck нема сопствене сервере ни аналитику. Комуницира само са Google-ом и са сервисима е-поште које укључите, са сваким преко сесије коју ваш прегледач већ има, а пошта сваког сервиса иде само том сервису. Једини додатак је асистент вештачке интелигенције, ако повежете добављача: тада оно што је потребно за захтев (преписка коју сажимате или на коју одговарате, пошта коју је пронашло питање, пошиљалац, наслов и почетак непрочитаних порука које разврстава) иде право из вашег прегледача том добављачу. Кључеви и пријаве остају на овом рачунару, а са уграђеним моделом у Chrome-у ваша пошта га не напушта. Отказивање пријаве шаље један захтев на сопствену адресу пошиљаоца за одјаву, и то тек пошто потврдите. Адреса странице на којој сте чита се само унутар панела и никада се не чува нити шаље. Mail Deck никада не тражи и не чува вашу лозинку, а ваша подешавања остају у прегледачу.

Mail Deck је отвореног кода, под лиценцом Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
Није га направио ниједан добављач е-поште и није повезан ни са једним од њих. Gmail је заштитни знак компаније Google LLC.
```
