const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const readImageFile = async (filePath) => {
    try {
        const data = await fs.promises.readFile(filePath);
        return data;
    } catch (err) {
        throw err;
    }
};

const postImage = async (imagePath, endpointUrl) => {
    try {
        const imageBuffer = await readImageFile(imagePath);

        const formData = new FormData();
        formData.append('encoded_image', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg',
        });

        const response = await axios.post(endpointUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        const regexPattern = /",\[\[(\[".*?"\])\],"/;
        const match = response.data.match(regexPattern);

        if (match && match[1]) {
            const extractedData = JSON.parse(match[1]);
            if (Array.isArray(extractedData) && extractedData.length > 0) {
                const firstValue = extractedData[0];
                return firstValue;
            }
        }
    } catch (error) {
        process.exit(0);
    }
};
async function navigateToSchedulePage(page) {
    let retryCount = 1;
    const targetUrl = 'https://sinhvien.epu.edu.vn/LichHocLichThiTuan.aspx';

    while (page.url() !== targetUrl) {
        await page.goto(targetUrl);
        retryCount += 1;
        await page.waitForTimeout(1000);

        if (retryCount > 5) {
            break;
        }
    }
}
async function getScheduleHtmlContent(page) {
    const scheduleElement = await page.$('.div-ChiTietLich');
    const scheduleHtmlContent = await page.evaluate(scheduleElement => {
        return scheduleElement ? scheduleElement.innerHTML : null;
    }, scheduleElement);
    const externalCssLink = '<link rel="stylesheet" href="style.css">';
        const faviconAndTitle = `
        <link rel="icon" href="favicon.ico" type="image/x-icon">
        <title>EPU Schedule</title>
    `;
    const finalHtmlContent = `
        <head>
            ${externalCssLink}
            ${faviconAndTitle}
        </head>
        <body>
            ${scheduleHtmlContent}
        </body>
    `;

    return finalHtmlContent;
}
const main = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://sinhvien.epu.edu.vn/');
        await page.type('#ctl00_ucRight1_txtMaSV', process.env.USERNAME);
        await page.type('#ctl00_ucRight1_txtMatKhau', process.env.PASSWORD);

        const cookies = await page.cookies();
        const userAgent = await page.evaluate(() => navigator.userAgent);
        const session = axios.create({
            headers: {
                'User-Agent': userAgent,
                'Cookie': cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
            },
            withCredentials: true,
        });

        await page.waitForSelector('#imgSecurityCode');
        const captchaImageSrc = await page.$eval('#imgSecurityCode', img => img.src);
        const captchaImageBuffer = await axios.get(captchaImageSrc, { responseType: 'arraybuffer' });
        await fs.promises.writeFile('image.png', captchaImageBuffer.data);
        const captchaText = await postImage('./image.png', 'https://lens.google.com/v3/upload');
        await page.type('#ctl00_ucRight1_txtSercurityCode', captchaText);
        await page.keyboard.press('Enter');
        await page.waitForNavigation();
        await navigateToSchedulePage(page);
        const scheduleHtmlContent = await getScheduleHtmlContent(page);
        fs.writeFileSync('index.html', scheduleHtmlContent);
    } catch (error) {
        process.exit(0);
    } finally {
        await browser.close();
    }
};
try {
    main();
} catch (error) {
    process.exit(0);
}