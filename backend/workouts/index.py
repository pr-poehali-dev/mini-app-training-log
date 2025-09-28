import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List, Optional
from datetime import datetime, date

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage workout data for VK Mini App users
    Args: event - HTTP request with method, body, headers, queryStringParameters
          context - object with request_id, function_name attributes
    Returns: HTTP response with statusCode, headers, body
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-VK-User-ID, X-VK-User-Data, x-vk-user-id, x-vk-user-data',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Get VK user data from headers (case-insensitive)
    headers = event.get('headers', {})
    print(f"All headers received: {headers}")
    
    # Try different case variations
    vk_user_id = (headers.get('X-VK-User-ID') or 
                  headers.get('x-vk-user-id') or
                  headers.get('X-Vk-User-Id') or
                  headers.get('HTTP_X_VK_USER_ID'))
    
    vk_user_data = (headers.get('X-VK-User-Data') or 
                    headers.get('x-vk-user-data') or
                    headers.get('X-Vk-User-Data') or
                    headers.get('HTTP_X_VK_USER_DATA'))
    
    print(f"Extracted VK User ID: {vk_user_id}")
    print(f"Extracted VK User Data: {vk_user_data}")
    
    if not vk_user_id:
        print("No VK user ID found, using fallback")
        vk_user_id = "123456789"  # Fallback for testing
    
    try:
        # Log request details
        print(f"Request method: {method}")
        print(f"VK User ID: {vk_user_id}")
        print(f"Headers: {headers}")
        print(f"Body: {event.get('body', '')}")
        
        # Connect to database
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if not DATABASE_URL:
            raise Exception('DATABASE_URL not configured')
        
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Ensure user exists
        user_id = ensure_user_exists(cur, vk_user_id, vk_user_data)
        
        if method == 'GET':
            result = handle_get_workouts(cur, user_id, event.get('queryStringParameters', {}))
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            result = handle_create_workout(cur, user_id, body_data)
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            result = handle_update_workout(cur, user_id, body_data)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(result, default=json_serializer)
        }
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def ensure_user_exists(cur, vk_user_id: str, vk_user_data: Optional[str]) -> int:
    '''Ensure VK user exists in database, create if not'''
    
    # Check if user exists
    cur.execute("SELECT id FROM users WHERE vk_user_id = %s", (int(vk_user_id),))
    user = cur.fetchone()
    
    if user:
        return user['id']
    
    # Parse VK user data if provided
    first_name = None
    last_name = None
    avatar_url = None
    
    if vk_user_data:
        try:
            user_info = json.loads(vk_user_data)
            first_name = user_info.get('first_name')
            last_name = user_info.get('last_name')
            avatar_url = user_info.get('photo_100')
        except:
            pass
    
    # Create new user
    cur.execute("""
        INSERT INTO users (vk_user_id, first_name, last_name, avatar_url) 
        VALUES (%s, %s, %s, %s) 
        RETURNING id
    """, (int(vk_user_id), first_name, last_name, avatar_url))
    
    return cur.fetchone()['id']

def handle_get_workouts(cur, user_id: int, params: Dict[str, str]) -> Dict[str, Any]:
    '''Get workouts for user, optionally filtered by date'''
    
    workout_date = params.get('date')
    
    if workout_date:
        # Get specific workout with exercises
        cur.execute("""
            SELECT w.id, w.name, w.workout_date, w.created_at, w.updated_at
            FROM workouts w 
            WHERE w.user_id = %s AND w.workout_date = %s
        """, (user_id, workout_date))
        
        workout = cur.fetchone()
        
        if not workout:
            return {'workout': None}
        
        # Get exercises for this workout
        cur.execute("""
            SELECT id, name, sets, reps, weight, notes, exercise_order
            FROM exercises 
            WHERE workout_id = %s 
            ORDER BY exercise_order, id
        """, (workout['id'],))
        
        exercises = cur.fetchall()
        
        return {
            'workout': {
                'id': workout['id'],
                'name': workout['name'],
                'date': workout['workout_date'].isoformat(),
                'exercises': [dict(ex) for ex in exercises]
            }
        }
    else:
        # Get all workouts for user (recent first)
        cur.execute("""
            SELECT w.id, w.name, w.workout_date, 
                   COUNT(e.id) as exercise_count
            FROM workouts w
            LEFT JOIN exercises e ON w.id = e.workout_id
            WHERE w.user_id = %s 
            GROUP BY w.id, w.name, w.workout_date
            ORDER BY w.workout_date DESC
            LIMIT 50
        """, (user_id,))
        
        workouts = cur.fetchall()
        
        return {
            'workouts': [
                {
                    'id': w['id'],
                    'name': w['name'],
                    'date': w['workout_date'].isoformat(),
                    'exercise_count': w['exercise_count']
                }
                for w in workouts
            ]
        }

def handle_create_workout(cur, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    '''Create new workout with exercises'''
    
    workout_name = data.get('name', 'Новая тренировка')
    workout_date = data.get('date')
    exercises = data.get('exercises', [])
    
    if not workout_date:
        raise ValueError('Workout date is required')
    
    # Create or update workout
    cur.execute("""
        INSERT INTO workouts (user_id, name, workout_date) 
        VALUES (%s, %s, %s) 
        ON CONFLICT (user_id, workout_date) 
        DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
        RETURNING id
    """, (user_id, workout_name, workout_date))
    
    workout_id = cur.fetchone()['id']
    
    # Delete existing exercises for this workout
    cur.execute("DELETE FROM exercises WHERE workout_id = %s", (workout_id,))
    
    # Insert new exercises
    for idx, exercise in enumerate(exercises):
        cur.execute("""
            INSERT INTO exercises 
            (workout_id, name, sets, reps, weight, notes, exercise_order)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            workout_id,
            exercise.get('name', ''),
            exercise.get('sets', 0),
            exercise.get('reps', 0),
            exercise.get('weight', 0),
            exercise.get('notes', ''),
            idx
        ))
    
    return {'success': True, 'workout_id': workout_id}

def handle_update_workout(cur, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    '''Update existing workout'''
    return handle_create_workout(cur, user_id, data)

def json_serializer(obj):
    '''JSON serializer for datetime objects'''
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")