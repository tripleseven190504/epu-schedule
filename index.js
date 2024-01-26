const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { get } = require('http');

async function getScheduleHtmlContent(page) {
    const scheduleElement = await page.$('.div-ChiTietLich');
    const scheduleHtmlContent = await page.evaluate(scheduleElement => {
        return scheduleElement ? scheduleElement.innerHTML : null;
    }, scheduleElement);
    await page.click('#ctl00_ContentPlaceHolder_btnSau');
    await page.waitForTimeout(3000);
    const nextscheduleElement = await page.$('.div-ChiTietLich');
    const nextScheduleHtmlContent = await page.evaluate(nextscheduleElement => {
        return nextscheduleElement ? nextscheduleElement.innerHTML : null;
    }, nextscheduleElement);
    const finalHtmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/tripleseven190504/epu-schedule@page/style.css"> -->
            <link rel="stylesheet" href="./style.css">
            <link rel="icon" href="https://raw.githubusercontent.com/tripleseven190504/epu-schedule/page/favicon.ico" type="image/x-icon">
            <title>EPU Schedule</title>
        </head>
        <body>
            <div id="noiDungDiv">
            ${scheduleHtmlContent}
            </div>
            <div class="container">
                <button id="tuanNayButton" onclick="chuyenTrang('truoc')">Tuần này</button>
                <button id="tuanSauButton" onclick="chuyenTrang('sau')">Tuần sau</button>
                <button id="xemDiem">Xem điểm</button>
            </div>
            <script>
                document.getElementById("xemDiem").addEventListener("click", function() {
                    window.location.href = "https://linhcute.shop/scores";
                });
            </script>
            <script>
                var noiDungTuanNay = \`
                ${scheduleHtmlContent}
                \`;
                var noiDungTuanSau = \`
                ${nextScheduleHtmlContent}
                \`;
                function chuyenTrang(huong) {
                    var noiDungMoi;
                    if (huong === 'sau') {
                        noiDungMoi = noiDungTuanSau;
                    } else if (huong === 'truoc') {
                        noiDungMoi = noiDungTuanNay;
                    }
                    document.getElementById("noiDungDiv").innerHTML = noiDungMoi;
                }
            </script>
        </body>
    </html>
    `;
    return finalHtmlContent;
}
async function getScoresHtmlContent(page) {
    const scoresElement = await page.$('.tblKetQuaHocTap');
    const scoresHtmlContent = await page.evaluate(scoresElement => {
        return scoresElement ? scoresElement.innerHTML : null;
    }, scoresElement);
    const finalHtmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/tripleseven190504/epu-schedule@page/style.css"> -->
            <link rel="stylesheet" href="./style.css">
            <link rel="stylesheet" href="https://sinhvien.epu.edu.vn/css/mainpage/stylePhongDaotao.css">
            <link rel="icon" href="https://raw.githubusercontent.com/tripleseven190504/epu-schedule/page/favicon.ico" type="image/x-icon">
            <title>Điểm số</title>
        </head>
        <body>
            <table class="grid grid-color2 tblKetQuaHocTap">
            ${scoresHtmlContent.replace(/src="\.\.\//g, 'src="https://sinhvien.epu.edu.vn/')}
            </table>
            <button id="quayVe">Quay về trang chủ</button>
            <script>
                document.getElementById("quayVe").addEventListener("click", function() {
                    window.location.href = "https://linhcute.shop/";
                });
            </script>
        </body>
    </html>
    `;
    return finalHtmlContent;
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
        console.log('Đang lấy dữ liệu...');
        const scheduleHtmlContent = await getScheduleHtmlContent(page);
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
        const scoresHtmlContent = await getScoresHtmlContent(page);
        await fs.promises.writeFile('index.html', scheduleHtmlContent);
        await fs.promises.writeFile('scores.html', scoresHtmlContent);
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
