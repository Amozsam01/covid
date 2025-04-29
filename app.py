import os
import logging
import requests
from flask import Flask, render_template, request, jsonify

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# COVID-19 API base URL
COVID_API_BASE_URL = "https://disease.sh/v3/covid-19"

@app.route('/')
def index():
    try:
        # Get global COVID-19 data
        global_data = requests.get(f"{COVID_API_BASE_URL}/all").json()
        return render_template('index.html', global_data=global_data)
    except Exception as e:
        logging.error(f"Error fetching global data: {e}")
        return render_template('index.html', error=True)

@app.route('/symptoms-prevention')
def symptoms_prevention():
    return render_template('symptoms_prevention.html')

@app.route('/live-updates')
def live_updates():
    return render_template('live_updates.html')

@app.route('/assessment')
def assessment():
    return render_template('assessment.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/api/countries')
def get_countries():
    try:
        countries = requests.get(f"{COVID_API_BASE_URL}/countries").json()
        return jsonify(countries)
    except Exception as e:
        logging.error(f"Error fetching countries data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/country/<country_name>')
def get_country_data(country_name):
    try:
        country_data = requests.get(f"{COVID_API_BASE_URL}/countries/{country_name}").json()
        return jsonify(country_data)
    except Exception as e:
        logging.error(f"Error fetching data for {country_name}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/historical/<country_name>')
def get_historical_data(country_name):
    try:
        days = request.args.get('days', 30)
        historical_data = requests.get(f"{COVID_API_BASE_URL}/historical/{country_name}?lastdays={days}").json()
        return jsonify(historical_data)
    except Exception as e:
        logging.error(f"Error fetching historical data for {country_name}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
