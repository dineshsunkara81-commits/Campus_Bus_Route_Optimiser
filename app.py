from flask import Flask, render_template, request, jsonify
import pandas as pd
import os

app = Flask(__name__)

# ==================== LOAD DATA ====================
def load_data():
    csv_path = os.path.join(os.path.dirname(__file__), 'database', 'bus_routes.csv')
    
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        
        # Ensure numeric columns
        df['distance'] = pd.to_numeric(df['distance'], errors='coerce').fillna(0)
        df['duration'] = pd.to_numeric(df['duration'], errors='coerce').fillna(0)
        
        # Convert stops to string
        df['stops'] = df['stops'].astype(str)
        
        return df
    else:
        # Fallback data if CSV doesn't exist
        data = {
            'route_id': ['R1', 'R2', 'R3', 'R4', 'R5'],
            'route_name': ['Main Campus Route', 'North Campus Route', 'South Campus Route', 
                           'East Campus Route', 'West Campus Route'],
            'source': ['Gate A', 'Gate B', 'Gate C', 'Gate D', 'Gate E'],
            'destination': ['Admin Block', 'Library', 'Sports Complex', 'Hostel', 'Academic Block'],
            'distance': [2.5, 3.2, 1.8, 2.0, 2.7],
            'duration': [10, 15, 8, 12, 14],
            'stops': ['Stop1,Stop2,Stop3', 'Stop4,Stop5,Stop6', 'Stop7,Stop8,Stop9', 
                      'Stop10,Stop11,Stop12', 'Stop13,Stop14,Stop15']
        }
        return pd.DataFrame(data)

df = load_data()

# ==================== ROUTES ====================
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/routes')
def get_routes():
    """Get all routes"""
    return jsonify(df.to_dict('records'))

@app.route('/api/search')
def search_routes():
    """Search routes by source and destination"""
    source = request.args.get('source', 'All')
    destination = request.args.get('destination', 'All')
    
    result = df.copy()
    if source != 'All':
        result = result[result['source'] == source]
    if destination != 'All':
        result = result[result['destination'] == destination]
    
    return jsonify(result.to_dict('records'))

@app.route('/api/shortest')
def shortest_route():
    """Find shortest route between source and destination"""
    source = request.args.get('source')
    destination = request.args.get('destination')
    
    if not source or not destination:
        return jsonify({'error': 'Source and destination required'}), 400
    
    matches = df[(df['source'] == source) & (df['destination'] == destination)]
    
    if matches.empty:
        return jsonify({'error': 'No route found'}), 404
    
    shortest = matches.loc[matches['distance'].idxmin()].to_dict()
    return jsonify(shortest)

@app.route('/api/stats')
def get_stats():
    """Get statistics"""
    total_stops = sum(len(str(s).split(',')) for s in df['stops'])
    stats = {
        'total_routes': len(df),
        'avg_distance': round(df['distance'].mean(), 1),
        'avg_duration': round(df['duration'].mean(), 0),
        'total_stops': total_stops
    }
    return jsonify(stats)

@app.route('/api/sources')
def get_sources():
    """Get unique sources"""
    return jsonify(df['source'].unique().tolist())

@app.route('/api/destinations')
def get_destinations():
    """Get unique destinations"""
    return jsonify(df['destination'].unique().tolist())

if __name__ == '__main__':
    print(f"✅ Loaded {len(df)} routes from database")
    print(f"📍 Sources: {df['source'].nunique()}")
    print(f"🏁 Destinations: {df['destination'].nunique()}")
    print("\n🚀 Server running at: http://127.0.0.1:5000")
    app.run(debug=True, host='127.0.0.1', port=5000)