const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function getScheduleHtmlContent(page) {
    const scheduleElement = await page.$('.div-ChiTietLich');
    const scheduleHtmlContent = await page.evaluate(scheduleElement => {
        return scheduleElement ? scheduleElement.innerHTML : null;
    }, scheduleElement);
    const externalCssLink = '<link rel="stylesheet" href="./style.css">';
    const faviconAndTitle = `
        <link rel="icon" href="https://raw.githubusercontent.com/tripleseven190504/epu-schedule/page/favicon.ico" type="image/x-icon">
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
    let retryCount = 1;
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const processImage = async (imagePath, endpointUrl) => {
        const formData = new FormData();
        const data = await fs.promises.readFile(imagePath);
        console.log('Đang đọc captcha', imagePath);
        formData.append('encoded_image', data, 'image.jpg');

        const response = await axios.post(endpointUrl, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        console.log('Đọc captcha thành công');
        const regexPattern = /",\[\[(\[".*?"\])\],"/;
        const match = response.data.match(regexPattern);
        if (match && match[1]) {
            const extractedData = JSON.parse(match[1]);
            if (Array.isArray(extractedData) && extractedData.length > 0) {
                const firstValue = extractedData[0];
                return firstValue;
            }
        }
    };
    try {
        await page.goto('https://sinhvien.epu.edu.vn/');
        await page.type('#ctl00_ucRight1_txtMaSV', process.env.USERNAME);
        await page.type('#ctl00_ucRight1_txtMatKhau', process.env.PASSWORD);
        await page.waitForSelector('#imgSecurityCode');
        const captchaImageSrc = await page.$eval('#imgSecurityCode', img => img.src);
        const captchaImageBuffer = await axios.get(captchaImageSrc, { responseType: 'arraybuffer' });
        await fs.promises.writeFile('image.png', captchaImageBuffer.data);
        const captchaText = await processImage('./image.png', 'https://lens.google.com/v3/upload');
        await page.type('#ctl00_ucRight1_txtSercurityCode', captchaText);
        await page.keyboard.press('Enter');
        await page.waitForNavigation();
        const targetUrl = 'https://sinhvien.epu.edu.vn/LichHocLichThiTuan.aspx';

        while (page.url() !== targetUrl) {
            await page.goto(targetUrl);
            retryCount += 1;
            await page.waitForTimeout(1000);

            if (retryCount > 5) {
                break;
            }
        }
        console.log('Đang lấy dữ liệu...');
        const scheduleHtmlContent = await getScheduleHtmlContent(page);
        await fs.promises.writeFile('index.html', scheduleHtmlContent);
        console.log('Lấy dữ liệu thành công!');
    } catch (error) {
        console.error('Lỗi không xác định');
        console.log('Đang đóng trình duyệt...')
        await browser.close();
        console.log('Đang thử lại...')
        main();
    } finally {
        await browser.close();
    }
};
try {
    main();
} catch (error) {
    process.exit(0);
}
