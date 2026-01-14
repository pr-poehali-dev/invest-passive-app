import json
import os
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from decimal import Decimal

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """API для управления инвестиционной платформой"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    path = event.get('queryStringParameters', {}).get('action', '')
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'register':
                return register_user(cur, conn, body)
            elif path == 'deposit':
                return create_deposit_request(cur, conn, body)
            elif path == 'withdraw':
                return create_withdraw_request(cur, conn, body)
            elif path == 'claim_chat_bonus':
                return claim_chat_bonus(cur, conn, body)
            elif path == 'admin_approve':
                return admin_approve_transaction(cur, conn, body)
            elif path == 'admin_reject':
                return admin_reject_transaction(cur, conn, body)
        
        elif method == 'GET':
            telegram_id = event.get('queryStringParameters', {}).get('telegram_id')
            
            if path == 'user':
                return get_user_data(cur, telegram_id)
            elif path == 'transactions':
                return get_transactions(cur, telegram_id)
            elif path == 'referrals':
                return get_referrals(cur, telegram_id)
            elif path == 'admin_pending':
                return get_admin_pending(cur, telegram_id)
            elif path == 'accrue':
                return accrue_profits(cur, conn)
        
        return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Not found'}), 'isBase64Encoded': False}
    
    except Exception as e:
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': str(e)}), 'isBase64Encoded': False}
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def register_user(cur, conn, body):
    telegram_id = body['telegram_id']
    username = body.get('username', '')
    first_name = body.get('first_name', '')
    referral_code = body.get('referral_code', f'ref_{telegram_id}')
    referrer_code = body.get('referrer_code')
    
    cur.execute("SELECT telegram_id FROM users WHERE telegram_id = %s", (telegram_id,))
    existing = cur.fetchone()
    
    if existing:
        cur.execute("""
            SELECT u.*, 
                   (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.telegram_id) as referral_count,
                   (SELECT SUM(amount) FROM deposits WHERE user_id = u.telegram_id AND status = 'active') as active_deposits
            FROM users u WHERE telegram_id = %s
        """, (telegram_id,))
        user = cur.fetchone()
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(dict(user), default=str), 'isBase64Encoded': False}
    
    referrer_id = None
    if referrer_code:
        cur.execute("SELECT telegram_id FROM users WHERE referral_code = %s", (referrer_code,))
        referrer = cur.fetchone()
        if referrer:
            referrer_id = referrer['telegram_id']
    
    cur.execute("""
        INSERT INTO users (telegram_id, username, first_name, referral_code, referrer_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *
    """, (telegram_id, username, first_name, referral_code, referrer_id))
    
    user = cur.fetchone()
    
    if referrer_id:
        cur.execute("""
            INSERT INTO referrals (referrer_id, referred_id)
            VALUES (%s, %s)
        """, (referrer_id, telegram_id))
    
    conn.commit()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({**dict(user), 'referral_count': 0, 'active_deposits': 0}, default=str), 'isBase64Encoded': False}

def create_deposit_request(cur, conn, body):
    telegram_id = body['telegram_id']
    amount = Decimal(str(body['amount']))
    currency = body.get('currency', 'RUB')
    
    cur.execute("""
        INSERT INTO transactions (user_id, type, amount, status, currency, description)
        VALUES (%s, 'deposit', %s, 'pending', %s, 'Заявка на пополнение')
        RETURNING *
    """, (telegram_id, amount, currency))
    
    transaction = cur.fetchone()
    conn.commit()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(dict(transaction), default=str), 'isBase64Encoded': False}

def create_withdraw_request(cur, conn, body):
    telegram_id = body['telegram_id']
    amount = Decimal(str(body['amount']))
    card_number = body['card_number']
    
    cur.execute("SELECT balance FROM users WHERE telegram_id = %s", (telegram_id,))
    user = cur.fetchone()
    
    if not user or user['balance'] < amount:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Insufficient balance'}), 'isBase64Encoded': False}
    
    cur.execute("""
        INSERT INTO transactions (user_id, type, amount, status, card_number, description)
        VALUES (%s, 'withdraw', %s, 'pending', %s, 'Заявка на вывод')
        RETURNING *
    """, (telegram_id, amount, card_number))
    
    transaction = cur.fetchone()
    
    cur.execute("""
        UPDATE users SET balance = balance - %s WHERE telegram_id = %s
    """, (amount, telegram_id))
    
    conn.commit()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(dict(transaction), default=str), 'isBase64Encoded': False}

def claim_chat_bonus(cur, conn, body):
    telegram_id = body['telegram_id']
    
    cur.execute("SELECT chat_bonus_claimed FROM users WHERE telegram_id = %s", (telegram_id,))
    user = cur.fetchone()
    
    if not user:
        return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'User not found'}), 'isBase64Encoded': False}
    
    if user['chat_bonus_claimed']:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Bonus already claimed'}), 'isBase64Encoded': False}
    
    bonus_amount = Decimal('100.00')
    
    cur.execute("""
        UPDATE users 
        SET balance = balance + %s, 
            total_earned = total_earned + %s,
            chat_bonus_claimed = TRUE
        WHERE telegram_id = %s
    """, (bonus_amount, bonus_amount, telegram_id))
    
    cur.execute("""
        INSERT INTO transactions (user_id, type, amount, status, description)
        VALUES (%s, 'bonus', %s, 'completed', 'Бонус за вступление в чат')
    """, (telegram_id, bonus_amount))
    
    conn.commit()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'amount': float(bonus_amount)}), 'isBase64Encoded': False}

def get_user_data(cur, telegram_id):
    cur.execute("""
        SELECT u.*, 
               (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.telegram_id) as referral_count,
               (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE user_id = u.telegram_id AND status = 'active') as active_deposits,
               (SELECT COALESCE(SUM(bonus_earned), 0) FROM referrals WHERE referrer_id = u.telegram_id) as referral_earnings
        FROM users u WHERE telegram_id = %s
    """, (telegram_id,))
    
    user = cur.fetchone()
    
    if not user:
        return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'User not found'}), 'isBase64Encoded': False}
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(dict(user), default=str), 'isBase64Encoded': False}

def get_transactions(cur, telegram_id):
    cur.execute("""
        SELECT * FROM transactions 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT 50
    """, (telegram_id,))
    
    transactions = cur.fetchall()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps([dict(t) for t in transactions], default=str), 'isBase64Encoded': False}

def get_referrals(cur, telegram_id):
    cur.execute("""
        SELECT u.telegram_id, u.username, u.first_name, r.bonus_earned, r.created_at,
               (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE user_id = u.telegram_id) as total_deposits
        FROM referrals r
        JOIN users u ON r.referred_id = u.telegram_id
        WHERE r.referrer_id = %s
        ORDER BY r.created_at DESC
    """, (telegram_id,))
    
    referrals = cur.fetchall()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps([dict(r) for r in referrals], default=str), 'isBase64Encoded': False}

def get_admin_pending(cur, telegram_id):
    cur.execute("SELECT is_admin FROM users WHERE telegram_id = %s", (telegram_id,))
    user = cur.fetchone()
    
    if not user or not user['is_admin']:
        return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Forbidden'}), 'isBase64Encoded': False}
    
    cur.execute("""
        SELECT t.*, u.username, u.first_name 
        FROM transactions t
        JOIN users u ON t.user_id = u.telegram_id
        WHERE t.status = 'pending'
        ORDER BY t.created_at DESC
    """)
    
    transactions = cur.fetchall()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps([dict(t) for t in transactions], default=str), 'isBase64Encoded': False}

def admin_approve_transaction(cur, conn, body):
    admin_id = body['admin_id']
    transaction_id = body['transaction_id']
    
    cur.execute("SELECT is_admin FROM users WHERE telegram_id = %s", (admin_id,))
    admin = cur.fetchone()
    
    if not admin or not admin['is_admin']:
        return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Forbidden'}), 'isBase64Encoded': False}
    
    cur.execute("SELECT * FROM transactions WHERE id = %s", (transaction_id,))
    transaction = cur.fetchone()
    
    if not transaction:
        return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Transaction not found'}), 'isBase64Encoded': False}
    
    if transaction['type'] == 'deposit':
        cur.execute("""
            INSERT INTO deposits (user_id, amount, daily_rate)
            VALUES (%s, %s, 10.6)
        """, (transaction['user_id'], transaction['amount']))
        
        cur.execute("""
            UPDATE users SET balance = balance + %s WHERE telegram_id = %s
        """, (transaction['amount'], transaction['user_id']))
        
        cur.execute("SELECT referrer_id FROM users WHERE telegram_id = %s", (transaction['user_id'],))
        user = cur.fetchone()
        
        if user and user['referrer_id']:
            referral_bonus = transaction['amount'] * Decimal('0.25')
            
            cur.execute("""
                UPDATE users 
                SET balance = balance + %s, total_earned = total_earned + %s
                WHERE telegram_id = %s
            """, (referral_bonus, referral_bonus, user['referrer_id']))
            
            cur.execute("""
                UPDATE referrals 
                SET bonus_earned = bonus_earned + %s
                WHERE referrer_id = %s AND referred_id = %s
            """, (referral_bonus, user['referrer_id'], transaction['user_id']))
            
            cur.execute("""
                INSERT INTO transactions (user_id, type, amount, status, description)
                VALUES (%s, 'referral', %s, 'completed', 'Реферальный бонус 25%%')
            """, (user['referrer_id'], referral_bonus))
            
            cur.execute("""
                SELECT COUNT(*) as count FROM referrals WHERE referrer_id = %s
            """, (user['referrer_id'],))
            
            ref_count = cur.fetchone()['count']
            
            if ref_count >= 25:
                cur.execute("""
                    SELECT referral_bonus_claimed FROM users WHERE telegram_id = %s
                """, (user['referrer_id'],))
                
                referrer_data = cur.fetchone()
                
                if not referrer_data['referral_bonus_claimed']:
                    milestone_bonus = Decimal('2000.00')
                    
                    cur.execute("""
                        UPDATE users 
                        SET balance = balance + %s, 
                            total_earned = total_earned + %s,
                            referral_bonus_claimed = TRUE
                        WHERE telegram_id = %s
                    """, (milestone_bonus, milestone_bonus, user['referrer_id']))
                    
                    cur.execute("""
                        INSERT INTO transactions (user_id, type, amount, status, description)
                        VALUES (%s, 'bonus', %s, 'completed', 'Бонус за 25 рефералов')
                    """, (user['referrer_id'], milestone_bonus))
    
    cur.execute("""
        UPDATE transactions 
        SET status = 'completed', processed_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (transaction_id,))
    
    conn.commit()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

def admin_reject_transaction(cur, conn, body):
    admin_id = body['admin_id']
    transaction_id = body['transaction_id']
    
    cur.execute("SELECT is_admin FROM users WHERE telegram_id = %s", (admin_id,))
    admin = cur.fetchone()
    
    if not admin or not admin['is_admin']:
        return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Forbidden'}), 'isBase64Encoded': False}
    
    cur.execute("SELECT * FROM transactions WHERE id = %s", (transaction_id,))
    transaction = cur.fetchone()
    
    if not transaction:
        return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Transaction not found'}), 'isBase64Encoded': False}
    
    if transaction['type'] == 'withdraw':
        cur.execute("""
            UPDATE users SET balance = balance + %s WHERE telegram_id = %s
        """, (transaction['amount'], transaction['user_id']))
    
    cur.execute("""
        UPDATE transactions 
        SET status = 'rejected', processed_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (transaction_id,))
    
    conn.commit()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

def accrue_profits(cur, conn):
    cur.execute("""
        SELECT d.id, d.user_id, d.amount, d.daily_rate, d.last_accrual
        FROM deposits d
        WHERE d.status = 'active' AND d.last_accrual < CURRENT_TIMESTAMP - INTERVAL '1 minute'
    """)
    
    deposits = cur.fetchall()
    total_accrued = 0
    
    for deposit in deposits:
        time_diff = datetime.now() - deposit['last_accrual']
        hours_passed = time_diff.total_seconds() / 3600
        
        hourly_rate = deposit['daily_rate'] / 24
        profit = deposit['amount'] * Decimal(str(hourly_rate)) / Decimal('100') * Decimal(str(hours_passed))
        
        cur.execute("""
            UPDATE deposits 
            SET total_earned = total_earned + %s, last_accrual = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (profit, deposit['id']))
        
        cur.execute("""
            UPDATE users 
            SET balance = balance + %s, total_earned = total_earned + %s
            WHERE telegram_id = %s
        """, (profit, profit, deposit['user_id']))
        
        cur.execute("""
            INSERT INTO transactions (user_id, type, amount, status, description)
            VALUES (%s, 'profit', %s, 'completed', 'Начисление по депозиту')
        """, (deposit['user_id'], profit))
        
        total_accrued += 1
    
    conn.commit()
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'accrued_count': total_accrued}), 'isBase64Encoded': False}
