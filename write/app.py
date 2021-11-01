import json
from pymongo import MongoClient
import boto3
import bcrypt
from datetime import datetime, timedelta
import jwt


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
    access_token = event['headers']['Authorization']

    if access_token != 'anonymous':
        try:
            payload = jwt.decode(access_token, secret, "HS256")
        except jwt.InvalidTokenError:
            return {
                "statusCode": 401,
            }

        if payload is None:
            return {
                "statusCode": 401,
            }

        user_id = payload["id"]
        user = db.user.find_one({"id": user_id})
    else:
        user = {'id': ''}
        print("access_token is empty")

    body = json.loads(event['body'])
    title = body['title']
    content = body['content']
    article_count = db.article.count()

    if article_count == 0:
        max_value = 1
    else:
        max_value = db.article.find_one(sort=[("idx", -1)])['idx'] + 1

    post = {
        'idx': max_value,
        'title': title,
        'content': content,
        'read_count': 0,
        'writer': user['id'],
        'reg_date': datetime.now()
    }
    db.article.insert_one(post)

    return {
        "statusCode": 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        },
        "body": json.dumps({
            "result": "success",
        }),
    }
