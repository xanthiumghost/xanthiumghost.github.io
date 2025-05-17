import os
import csv
import logging
import pytz
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file, Response

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

# Ensure data directory exists
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(data_dir, exist_ok=True)

# CSV file path
CSV_FILE = os.path.join(data_dir, 'activities.csv')

def initialize_csv():
    """Initialize the CSV file with headers if it doesn't exist."""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Date', 'Time', 'Activity'])
        logger.debug(f"Created new CSV file at {CSV_FILE}")

# Initialize CSV file on startup
initialize_csv()

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/add_activity', methods=['POST'])
def add_activity():
    """Add a new activity to the CSV file."""
    try:
        activity = request.form.get('activity', '').strip()
        
        # Validate input
        if not activity:
            flash('Activity cannot be empty', 'danger')
            return redirect(url_for('index'))
        
        # Get current date and time in IST timezone
        ist_timezone = pytz.timezone('Asia/Kolkata')
        now = datetime.now(ist_timezone)
        date_str = now.strftime('%Y-%m-%d')
        time_str = now.strftime('%H:%M:%S')
        
        # Append to CSV file
        with open(CSV_FILE, 'a', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([date_str, time_str, activity])
        
        logger.debug(f"Added activity: {activity} at {date_str} {time_str}")
        flash('Activity added successfully!', 'success')
        return redirect(url_for('index'))
        
    except Exception as e:
        logger.error(f"Error adding activity: {str(e)}")
        flash(f'An error occurred: {str(e)}', 'danger')
        return redirect(url_for('index'))

@app.route('/get_activities', methods=['GET'])
def get_activities():
    """Get the list of activities from the CSV file."""
    try:
        activities = []
        if os.path.exists(CSV_FILE):
            with open(CSV_FILE, 'r') as csvfile:
                reader = csv.reader(csvfile)
                next(reader)  # Skip header row
                for row in reader:
                    if len(row) >= 3:  # Ensure row has enough columns
                        activities.append({
                            'date': row[0],
                            'time': row[1],
                            'activity': row[2]
                        })
        
        return jsonify({'activities': activities})
    
    except Exception as e:
        logger.error(f"Error getting activities: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download_csv', methods=['GET'])
def download_csv():
    """Download the activities CSV file."""
    try:
        if os.path.exists(CSV_FILE):
            return send_file(CSV_FILE, 
                             mimetype='text/csv',
                             download_name='activities.csv',
                             as_attachment=True)
        else:
            flash('No activities file found', 'danger')
            return redirect(url_for('index'))
            
    except Exception as e:
        logger.error(f"Error downloading CSV: {str(e)}")
        flash(f'An error occurred: {str(e)}', 'danger')
        return redirect(url_for('index'))

@app.route('/clear_activities', methods=['POST'])
def clear_activities():
    """Clear all activities from the CSV file."""
    try:
        # Re-initialize the CSV file with just the headers
        with open(CSV_FILE, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Date', 'Time', 'Activity'])
        
        logger.debug("Cleared all activities")
        flash('All activities cleared successfully!', 'success')
        return redirect(url_for('index'))
        
    except Exception as e:
        logger.error(f"Error clearing activities: {str(e)}")
        flash(f'An error occurred: {str(e)}', 'danger')
        return redirect(url_for('index'))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)