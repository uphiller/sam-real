import json
from pymongo import MongoClient
import boto3
import bcrypt

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
    user = db.user.find_one({"id": body['id']})

    if user is not None:
        return {
            "statusCode": 423,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
        }

    db.user.insert_one({"id": body['id'], "pwd": bcrypt.hashpw(body['pwd'].encode('UTF-8'), bcrypt.gensalt())})
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


