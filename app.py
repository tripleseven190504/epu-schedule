import threading
import time

import schedule
from flask import Flask, request
from flask_cors import CORS

from epu_schedule import main

app = Flask(__name__)
CORS(app)

schedule_html_content = None


def get_schedule(mssv, password):
    global schedule_html_content
    schedule_html = main(mssv, password)
    schedule_html_content = f"""
        <html>
        <head>
            <style>
                body {{
                    background-color: #282a36;
                    color: #f8f8f2;
                    margin: 0;
                    padding: 20px;
                    font-family: 'Courier New', monospace;
                }}

                table {{
                    width: 100%;
                    border-collapse: collapse;
                    background-color: #44475a;
                    border-radius: 4px;
                    overflow: hidden;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }}

                th {{
                    background-color: #bd93f9;
                    font-weight: bold;
                    padding: 12px;
                    text-align: left;
                }}

                td {{
                    padding: 12px;
                }}

                tr:nth-child(even) {{
                    background-color: #6272a4;
                }}

                tr:hover {{
                    background-color: #44475a;
                }}

                @media screen and (max-width: 600px) {{
                    table {{
                        font-size: 12px;
                    }}

                    th, td {{
                        padding: 8px;
                    }}

                    body {{
                        transform: rotate(90deg);
                        transform-origin: left top;
                        width: 100vh;
                        overflow-x: hidden;
                        position: absolute;
                        top: 0;
                        left: 0;
                    }}
                }}
            </style>
        </head>
        <body>
            {schedule_html}
        </body>
        </html>
    """
    return schedule_html


schedule.every().day.at("00:00").do(get_schedule)


def run_schedule():
    while True:
        schedule.run_pending()
        time.sleep(1)


schedule_thread = threading.Thread(target=run_schedule)
schedule_thread.start()


@app.route('/', methods=['GET'])
def return_schedule():
    global schedule_html_content
    if schedule_html_content is None:
        # get_schedule('bimat', 'bimat')
        pass # remove it if u want to clone
    return schedule_html_content


@app.route('/schedule', methods=['POST'])
def update_schedule():
    mssv = request.form.get('mssv')
    password = request.form.get('password')
    return get_schedule(mssv, password)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9999)