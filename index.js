const SEND_SMS = false

require('dotenv').config();
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const fs = require('fs')
const writeStream = fs.createWriteStream('wohnungen.csv')

// Twilio settings
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const numberSentFrom = process.env.TWILIO_NUMBER;
const numberToSendTo = process.env.NUMBER_TO_SEND_TO;

var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

// CSV headers
writeStream.write(`Überschrift, Link, Beschreibung, Größe, Zimmer, Preis, Datum \n`)

const kleinanzeigenQueryLink = "";

fetch(kleinanzeigenQueryLink)
    .then((res) => res.text())
    .then((body) => {
        const $ = cheerio.load(body)

        $('.ad-listitem').each((i, el) => {
            const title = $(el).find('.text-module-begin').text().replace(/\s\s+/g, '').replace(/\,/g, ' ')
            const link = 'https://www.ebay-kleinanzeigen.de/' + $(el).find('.text-module-begin').find('a').attr('href')
            const description = $(el).find('.text-module-begin').next().text().replace(/\r?\n|\r/g, '').replace(/\,/g, ' ')
            const rooms = $(el).find('.text-module-begin').next().next().children().last().text().replace(/\s\s+/g, '')
            const price = $(el).find('.aditem-details').children().first().text().replace(/\s\s+/g, '')
            const uploadDate = $(el).find('.aditem-details').next().text().replace(/\r?\n|\r/g, '').replace(/\s\s+/g, '').replace(/\,/, '')
            var size = $(el).find('.text-module-begin').next().next().children().first().text().replace(/\s\s+/g, '')
            if(size.includes(',')) size = size.substring(0, size.indexOf(','))
            if(size.includes(' ')) size = size.substring(0, size.indexOf(' '))

            if(uploadDate.toLowerCase().includes('heute')) {
                console.log(
                    'title = '+title+ '\n' +
                    'link = '+link+  '\n' +
                    'description = '+description+ '\n' +
                    'size = '+size+  '\n' +
                    'rooms = '+rooms+ '\n' +
                    'price = '+price+ '\n' +
                    'uploadDate = '+uploadDate
                 )
                console.log('________________________')
                
                // Write row to CSV
                writeStream.write(`${title}, ${link}, ${description}, ${size+'m²'}, ${rooms}, ${price}, ${uploadDate} \n`)

                // Send SMS
                if(SEND_SMS) {
                    sendMessage(
                        title+ '\n' +
                        link+  '\n' +
                        description+ '\n' +
                        size+'m²' +  '\n' +
                        rooms+ '\n' +
                        price+ '\n' +
                        uploadDate
                    )
                }
            }
        })
    });

const sendMessage = (message) => {
    client.messages.create({
        body: message,
        to: numberToSendTo,  // Text this number
        from: numberSentFrom // From a valid Twilio number
    }).then((message) => console.log(message.sid));
}