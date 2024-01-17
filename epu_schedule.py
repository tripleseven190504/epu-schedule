import os
import time

import pytesseract
import requests
from bs4 import BeautifulSoup
from PIL import Image
from selenium import webdriver
from selenium.common.exceptions import UnexpectedAlertPresentException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By


def initialize_driver():
    options = Options()
    options.add_argument("--no-sandbox")
    # options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    driver = webdriver.Chrome(options=options)
    return driver


def remove_inline_styles(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    for tag in soup.recursiveChildGenerator():
        if hasattr(tag, 'attrs'):
            tag.attrs = {key: value for key,
                         value in tag.attrs.items() if key != 'style'}
    return str(soup)


def process_captcha(driver, session):
    captcha_image = driver.find_element(
        By.ID, 'imgSecurityCode').get_attribute('src')
    with open('captcha.png', 'wb') as file:
        file.write(session.get(captcha_image).content)
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    captcha_text = pytesseract.image_to_string(Image.open(
        'captcha.png'), lang='eng', config='--psm 6')
    os.remove('captcha.png')
    return captcha_text


def navigate_to_schedule_page(driver):
    retry_count = 1
    while driver.current_url != 'https://sinhvien.epu.edu.vn/LichHocLichThiTuan.aspx':
        driver.get('https://sinhvien.epu.edu.vn/LichHocLichThiTuan.aspx')
        retry_count += 1
        time.sleep(1)
        if retry_count > 5:
            break


def main(mssv, password):
    try:
        driver = initialize_driver()
        try:
            driver.get("https://sinhvien.epu.edu.vn/Default.aspx")
            cookies = {cookie['name']: cookie['value']
                    for cookie in driver.get_cookies()}
            user_agent = driver.execute_script("return navigator.userAgent;")
            session = requests.Session()
            session.headers.update({"User-Agent": user_agent})
            session.cookies.update(cookies)
            captcha_text = process_captcha(driver, session)
            driver.find_element(
                By.NAME, "ctl00$ucRight1$txtMaSV").send_keys(mssv)
            driver.find_element(
                By.NAME, "ctl00$ucRight1$txtMatKhau").send_keys(password)
            driver.find_element(
                By.NAME, "ctl00$ucRight1$txtSercurityCode").send_keys(captcha_text)
            navigate_to_schedule_page(driver)
            schedule_html_content = driver.find_element(
                By.CLASS_NAME, 'div-ChiTietLich').get_attribute('innerHTML')
            schedule_html_content = remove_inline_styles(schedule_html_content)
            driver.quit()
            return schedule_html_content
        except UnexpectedAlertPresentException:
            driver.quit()
            main(mssv, password)
        except Exception as e:
            return e
    except Exception as e:
        return e
