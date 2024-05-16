const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });
const webAppUrl = 'https://faq-jetbra.netlify.app';


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.chat.first_name;

    bot.sendMessage(chatId, `Привет, ${name}!`).then(() => {
        return bot.sendMessage(chatId, 'Тебе нужна лицензия на продукты Jetbrains? \nТы по адресу!\nТут ты получишь лицензию All pack + плагины.\nСрок действия-до 2026года. \n\nВ меню ты найдешь ответы на самые часто задаваемые вопросы!');
    }).then(() => {
        return bot.sendSticker(chatId, 'CAADBQADiQMAAukKyAPZH7wCI2BwFxYE');
    }).then(() => {
        return bot.sendMessage(chatId, 'Оплата переводом по номеру по СБП \n\nНомер для перевода тут: \n👉||\\+79533402141Озонбанк||\n\nОплатил? Жми кнопку ниже👇', {
            parse_mode: "MarkdownV2",
            reply_markup: {
                keyboard: [
                    [{ text: "Я оплатил!" }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }).catch(error => {
        console.error('Ошибка при отправке сообщения:', error);
    });
});


bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, `${msg.chat.first_name}, пиши в чат с ботом свой вопрос. По мере возможности я отвечу в этом чате.`).catch(error => {
        console.error('Ошибка при отправке сообщения:', error);
    });
});

bot.onText(/\/faq/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, `Тут собраны все ответы на вопросы\n\nЖми FAQ`, {
        parse_mode: "MarkdownV2",
        reply_markup: {
            inline_keyboard: [
                [{text: 'FAQ', web_app: {url: webAppUrl}}]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    }).catch(error => {
        console.error('Ошибка при отправке сообщения:', error);
    });
});

bot.onText(/\/send (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const [userId, ...messageArray] = match[1].split(' ');
    const message = messageArray.join(' ');

    bot.sendMessage(userId, message)
        .then(() => {
            bot.sendMessage(chatId, `Сообщение успешно отправлено пользователю ${userId}`).catch(error => {
                console.error('Ошибка при отправке сообщения:', error);
            });
        })
        .catch((error) => {
            bot.sendMessage(chatId, `Ошибка при отправке сообщения: ${error}`).catch(error => {
                console.error('Ошибка при отправке сообщения:', error);
            });
        });
});

const paymentInfo = {};

bot.on('photo', async img => {
    const photo = img.photo[img.photo.length - 1];
    const chatId = img.chat.id;
    const targetChatId = '1213801763';

    paymentInfo[targetChatId] = {
        originalChatId: chatId,
        messageId: img.message_id,
        photo: photo.file_id
    };

    await bot.sendPhoto(targetChatId, photo.file_id, {
        caption: `Пользователь ${img.from.first_name} отправил вам скрин об оплате или фейк. Нужно проверить!.`,
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Подтвердить оплату', callback_data: 'confirm_payment' }]
            ]
        }
    }).catch(error => {
        console.error('Ошибка при отправке фото:', error);
    });
});

// Функция для обработки выбора пользователя, когда доступ есть
async function handleAccessYes(chatId) {
    await bot.sendMessage(chatId, 'Какая у тебя операционная система?', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Windows ', callback_data: 'windows' }],
                [{ text: 'Mac или Linux', callback_data: 'mac-or-linux' }]
            ]
        }
    });
}

// Функция для обработки выбора пользователя, когда доступа нет
async function handleAccessNo(chatId) {
    await bot.sendMessage(chatId, 'Сперва посмотри эту инструкцию:\n' +
        'ПОДГОТОВИЛ ДЛЯ ВАС PDF ФАИЛ С ПОЛНЫМ ОПИСАНИЕМ ПРОЦЕССА + СКРИНЫ https://disk.yandex.ru/d/73SS2SfrjGs8Fg ЧТОБЫ ПОЛУЧИТЬ ПАРОЛЬ НАПИШИ БОТУ ДАЙ ПАРОЛЬ =)\n' +
    'ПОСЛЕ ПРОСМОТРА И ПЕРВИЧНОЙ ПОДГОТОВКИ ВЕРНИСЬ В ВЕТКУ - ДОСТУП ЕСТЬ');

    // Здесь также можете добавить дополнительные действия, если нужно
}

bot.on('callback_query', async callbackQuery => {
    const chatId = callbackQuery.message.chat.id;

    if (callbackQuery.data === 'confirm_payment') {
        if (paymentInfo && paymentInfo[chatId]) {
            const { originalChatId, messageId, photo } = paymentInfo[chatId];

            await bot.sendMessage(originalChatId, 'Отлично, оплата подтверждена, продолжим.');

            // Отправляем сообщение о выборе операционной системы
            await bot.sendMessage(originalChatId, 'У тебя сейчас есть доступ в интерфейс программы? Или ты сразу видишь запрос лицензии?', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Доступ есть', callback_data: 'access_yep'}],
                        [{ text: 'Доступа нет', callback_data: 'access_noy'}]
                    ]
                }
            });

            delete paymentInfo[chatId];
        } else {
            console.error('Информация о платеже для данного чата не найдена или объект paymentInfo не определен.');
        }
    }

    // Обработка выбора пользователя
    if (callbackQuery.data === 'access_yep') {
        await handleAccessYes(chatId);
    } else if (callbackQuery.data === 'access_noy') {
        await handleAccessNo(chatId);
    }

    if (callbackQuery.data === 'windows') {
        bot.sendMessage(chatId, 'ПОДГОТОВИЛ ДЛЯ ВАС PDF ФАИЛ С ПОЛНЫМ ОПИСАНИЕМ ПРОЦЕССА + СКРИНЫ https://disk.yandex.ru/d/73SS2SfrjGs8Fg ЧТОБЫ ПОЛУЧИТЬ ПАРОЛЬ НАПИШИ БОТУ ДАЙ ПАРОЛЬ =)\n' +
            '1. ПУНКТ УТРАТИЛ СИЛУ (Качаем с офф сайта {ТВОЯ ПРОГРАММА}, ставим его обычным способом, триал версию.)\n' +
            '\n' +
            '2)Идем на сайт https://3.jetbra.in и выбираем живой сервер -> качаем архив jetbra (ссылка в Хэдере сайта). Разархивируем его в любое место на ПК, главное не удалять. После разархивации заходим в папку, чтобы было видно все файлы в ней. Копируем путь к этой папке путь к этой папке в буфер обмена!\n' +
            '\n' +
            '3)Запускаем {ТВОЯ ПРОГРАММА} ->Создать новый проект. Верхнем меню  давим Help->Edit custom VM Options. \n' +
            '\n' +
            '4)3. Без пробелов вставляем эти настройки ->  \n' +
            '--add-opens=java.base/jdk.internal.org.objectweb.asm=ALL-UNNAMED   \n' +
            '--add-opens=java.base/jdk.internal.org.objectweb.asm.tree=ALL-UNNAMED   \n' +
            '-javaagent:\\Users\\ТУТ ИМЯ ЮЗЕРА\\ТУТ МЫ КАК РАЗ ДОЛЖНЫ ВСТАВИТЬ СВОЙ ПУТЬ ДО ПАПКИ\\jetbra\\ja-netfilter.jar=jetbrains  \n' +
            'Все дефисыс новой строки!!! \n' +
            '-javaagent:\\Users\\ТУТ ИМЯ ЮЗЕРА\\ТУТ МЫ КАК РАЗ ДОЛЖНЫ ВСТАВИТЬ СВОЙ ПУТЬ ДО ПАПКИ\\jetbra\\ja-netfilter.jar=jetbrains  - ТУТ МЫ ВСТАВЛЯЕМ ТОТ ПУТЬ, КОТОРЫЙ КОПИРОВАЛИ В БУФЕР ОБМЕНА ДО ТОЙ САМОЙ ПАПКИ, КОТОРУЮ СКАЧАЛИ!\n' +
            'ПРИМЕР:\n' +
            '--add-opens=java.base/jdk.internal.org.objectweb.asm=ALL-UNNAMED--add-opens=java.base/jdk.internal.org.objectweb.asm.tree=ALL-UNNAMED\n' +
            '-javaagent:\\Users\\Alex\\wsActivate\\jetbra\\jetbra\\ja-netfilter.jar=jetbrains\n' +
            '5)На том же сайте где качали папку копируем ключ активации {ТВОЯ ПРОГРАММА} Запускаем {ТВОЯ ПРОГРАММА} -> help -> registr -> activate new license->activation code \n' +
            'и в поле вставляем скопированный ключ с сайта. Жмет activate и все ок' );
    } else if (callbackQuery.data === 'mac-or-linux') {
        bot.sendMessage(chatId, 'На маке или линукс, разница от винды лишь в том, что в этой строчке:' +
        '-javaagent:\\Users\\ИМЯ ТВОЕЙ СИСТЕМЫ\\*\\*\\*\\jetbra\\ja-netfilter.jar=jetbrains СЛЭШИ В ПУТИ В ДРУГУЮ СТОРОНУ, ДУМАЮ САМ ПОЙМЕШЬ)))\n' +
        'Поэтому выбирай windows и следуй инструкции');
    }
});


bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text || {};
    const userId = msg.from.id;
    const { video, sticker, audio, voice, video_note, document, animation } = msg;

    if (msg.photo) {
        await bot.sendMessage(chatId, 'Спасибо, проверяю оплату. Скоро вернусь..Ожидайте.', {
            reply_markup: { remove_keyboard: true }
        });
    } else if (video || sticker || audio || voice || video_note || document || animation) {
        await bot.sendMessage(chatId, `Пришли скрин оплаты сюда в чат. После подтверждения оплаты мы сможем продолжить.`);
    } else {
        const replyText = `Пользователь ${userId} прислал: ${messageText || video || sticker || audio || voice || video_note || document || animation}`;
        await bot.sendMessage('1213801763', replyText, {
            reply_markup: {
                inline_keyboard: [[{ text: 'Ответить юзеру', callback_data: JSON.stringify({ userId: userId }) }]]
            }
        });
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (messageText === "Я оплатил!") {
        await bot.sendMessage(chatId, 'Отлично, пришли мне скрин оплаты сюда в чат. После проверки, мы продолжим. Спасибо.', {
            reply_markup: { remove_keyboard: true }
        });
    }
});

bot.on('callback_query', (callbackQuery) => {
    const userId = JSON.parse(callbackQuery.data).userId;

    bot.answerCallbackQuery(callbackQuery.id)
        .then(() => {
            bot.sendMessage(callbackQuery.message.chat.id, `/send ${userId}`);
        });
});


console.log('bot started')