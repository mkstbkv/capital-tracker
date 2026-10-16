const axios = require('axios');
const xml2js = require('xml2js');
const iconv = require('iconv-lite');

exports.getExchangeRates = async (req, res) => {
  try {
    // 1. Скачиваем XML от Нацбанка как бинарный буфер (чтобы не сломать кодировку windows-1251)
    const response = await axios.get('https://www.nbkr.kg/XML/daily.xml', {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    // 2. Декодируем буфер из windows-1251 в нормальную JS-строку UTF-8
    const xmlText = iconv.decode(response.data, 'windows-1251');

    // 3. Парсим полученный XML-текст в JavaScript объект
    xml2js.parseString(xmlText, { explicitArray: false }, (err, result) => {
      if (err) throw new Error('Ошибка парсинга XML Нацбанка');

      if (result && result.CurrencyRates && result.CurrencyRates.Currency) {
        const currencyArray = result.CurrencyRates.Currency;
        const nbkrRates = {};

        // Проходимся по всем валютам Нацбанка и вытаскиваем значения
        currencyArray.forEach(c => {
          const isoCode = c.$.ISOCode; // 'USD', 'RUB', 'EUR'
          // Заменяем запятую на точку, чтобы JavaScript понял число (например, "87,4500" -> 87.45)
          const value = parseFloat(c.Value.replace(',', '.'));
          const nominal = parseFloat(c.Nominal || 1);
          
          // Получаем чистую стоимость 1 единицы валюты в сомах
          nbkrRates[isoCode] = value / nominal;
        });

        // 4. Пересчитываем коэффициенты под нужды нашего фронтенда КапиталТрекера
        // Наш фронтенд делит баланс на коэффициент. Формула: коэффициент = 1 / курс_в_сомах
        const kgsRates = {
          KGS: 1,
          USD: nbkrRates['USD'] ? parseFloat((1 / nbkrRates['USD']).toFixed(6)) : 0.0114,
          RUB: nbkrRates['RUB'] ? parseFloat((1 / nbkrRates['RUB']).toFixed(6)) : 0.96,
          EUR: nbkrRates['EUR'] ? parseFloat((1 / nbkrRates['EUR']).toFixed(6)) : 0.0102
        };

        return res.json({
          success: true,
          base: 'KGS',
          source: 'Официальный шлюз НБКР (nbkr.kg)',
          rates: kgsRates,
          updated_at: result.CurrencyRates.$.Date
        });
      }

      throw new Error('Неверная структура XML от НБКР');
    });

  } catch (error) {
    console.error('Шлюз НБКР временно недоступен, включен резервный хардкод:', error.message);
    
    // Подушка безопасности (если сайт Нацбанка временно упадет)
    res.json({
      success: false,
      base: 'KGS',
      source: 'Резервный хардкод КапиталТрекера',
      rates: {
        KGS: 1,
        USD: 0.011435, // ~86.50 сомов за доллар
        RUB: 0.9607,   // ~1.04 сома за рубль
        EUR: 0.010195  // ~98.08 сомов за евро
      },
      updated_at: new Date().toLocaleDateString('ru-RU')
    });
  }
};
