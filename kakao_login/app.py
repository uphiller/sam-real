import json
from pymongo import MongoClient
import boto3
import bcrypt
from datetime import datetime, timedelta
import jwt
import requests


def get_secret():
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name="ap-northeast-2"
    )
    get_secret_value_response = client.get_secret_value(
        SecretId='mongo-secret'
    )
    token = get_secret_value_response['SecretString']
    return eval(token)


def db_ops():
    secrets = get_secret()
    client = MongoClient("mongodb://{0}:{1}@{2}".format(secrets['user'], secrets['password'], secrets['host']))
    return client


def lambda_handler(event, context):
    client = db_ops()
    db = client.dbStock
    secret = "secrete"
    algorithm = "HS256"
    body = json.loads(event['body'])
    access_token = body['access_token']

    if event['httpMethod'] == 'OPTIONS':
        return {
            "statusCode": 200,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
        }

    headers = {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8', 'Authorization': 'Bearer {0}'.format(access_token)}
    response = requests.post('https://kapi.kakao.com/v2/user/me', headers=headers)
    kakao_user = response.json()
    print(kakao_user)
    id = str(kakao_user['id'])
    user = db.user.find_one({"id": id})

    if user is None:
        db.user.insert_one({"id": id, "pwd": bcrypt.hashpw(id.encode('UTF-8'), bcrypt.gensalt())})

    payload = {
        "id": id,
        "exp": datetime.utcnow() + timedelta(seconds=60 * 60 * 24)
    }
    token = jwt.encode(payload, secret, "HS256")

    return {
        "statusCode": 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        },
        "body": json.dumps({
            "result": "success",
            "token": token
        }),
    }