const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function getScheduleHtmlContent(page) {
    const targetUrl = 'https://sinhvien.epu.edu.vn/LichHocLichThiTuan.aspx';
    let retryCount = 1;
    while (page.url() !== targetUrl) {
        await page.goto(targetUrl);
        console.log("Đang lấy lịch học lần thứ ", retryCount);
        retryCount += 1;
        await page.waitForTimeout(1000);
        if (retryCount > 5) {
            break;
        }
    }
    const scheduleElement = await page.$('.div-ChiTietLich');
    const scheduleHtmlContent = await page.evaluate(scheduleElement => {
        return scheduleElement ? scheduleElement.innerHTML : null;
    }, scheduleElement);
    return scheduleHtmlContent;
}
async function nextWeek(page) {
    await page.click('#ctl00_ContentPlaceHolder_btnSau');
    await page.waitForTimeout(3000);
    const nextscheduleElement = await page.$('.div-ChiTietLich');
    const nextScheduleHtmlContent = await page.evaluate(nextscheduleElement => {
        return nextscheduleElement ? nextscheduleElement.innerHTML : null;
    }, nextscheduleElement);
    return nextScheduleHtmlContent;
}
async function getScoresHtmlContent(page) {
    const scoreUrl = 'https://sinhvien.epu.edu.vn/Xemdiem.aspx';
    let retry = 1;
    while (page.url() !== scoreUrl) {
        await page.goto(scoreUrl);
        console.log("Đang lấy điểm lần thứ ", retry);
        retry += 1;
        await page.waitForTimeout(1000);
        if (retry > 5) {
            break;
        }
    }
    const scoresElement = await page.$('.tblKetQuaHocTap');
    const scoresHtmlContent = await page.evaluate(scoresElement => {
        return scoresElement ? scoresElement.innerHTML : null;
    }, scoresElement);
    const finalScoreHtmlContent = `
        <table class="grid grid-color2 tblKetQuaHocTap">
        ${scoresHtmlContent.replace(/src="\.\.\//g, 'src="https://sinhvien.epu.edu.vn/')}
        </table>
    `;
    return finalScoreHtmlContent;
}
const main = async () => {
    const browser = await puppeteer.launch({ headless: "new" });
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
        console.log("Đã truy cập website");
        await page.type('#ctl00_ucRight1_txtMaSV', process.env.USERNAME);
        console.log("Đã điền tài khoản");
        await page.type('#ctl00_ucRight1_txtMatKhau', process.env.PASSWORD);
        console.log("Đã điền mật khẩu");
        await page.waitForSelector('#imgSecurityCode');
        console.log("Đã phát hiện captcha");
        const captchaImageSrc = await page.$eval('#imgSecurityCode', img => img.src);
        const captchaImageBuffer = await axios.get(captchaImageSrc, { responseType: 'arraybuffer' });
        await fs.promises.writeFile('image.png', captchaImageBuffer.data);
        const captchaText = await processImage('./image.png', 'https://lens.google.com/v3/upload');
        await page.type('#ctl00_ucRight1_txtSercurityCode', captchaText);
        console.log("Đang điền captcha");
        await page.waitForTimeout(1500);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        console.log('Đang lấy dữ liệu...');
        const scheduleHtmlContent = await getScheduleHtmlContent(page);
        const nextScheduleHtmlContent = await nextWeek(page);
        const scoresHtmlContent = await getScoresHtmlContent(page);
        const finalHtmlContent = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>EPU Schedule</title>
            <link rel="stylesheet" href="./style.css">
            <link rel="stylesheet" href="https://sinhvien.epu.edu.vn/css/mainpage/stylePhongDaotao.css">
            <link rel="icon" href="./favicon.ico" type="image/x-icon">
        </head>
        <body>
        <div id="noiDungDiv">
        ${scheduleHtmlContent}
        </div>
        <div class="container">
            <button id="tuanNayButton" onclick="chuyenTrang('truoc')">Tuần này</button>
            <button id="tuanSauButton" onclick="chuyenTrang('sau')">Tuần sau</button>
            <button id="xemDiem" onclick="chuyenTrang('diem')">Xem điểm</button>
        </div>
        <script>
            const chuyenTrang = (trang) => {
                const noiDungDiv = document.getElementById('noiDungDiv');
                if (trang === 'truoc') {
                    noiDungDiv.innerHTML = \`
                    ${scheduleHtmlContent}
                    \`;
                } else if (trang === 'sau') {
                    noiDungDiv.innerHTML = \`
                    ${nextScheduleHtmlContent}
                    \`;
                } else if (trang === 'diem') {
                    noiDungDiv.innerHTML = \`
                    ${scoresHtmlContent}
                    \`;
                }
            }
        </script>
        </body>
        `
        await fs.promises.writeFile('index.html', finalHtmlContent);
        console.log('Hoàn tất!');
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