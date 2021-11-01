import json
from pymongo import MongoClient
import boto3
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
    access_token = event['headers']['Authorization']
    secret = "secrete"

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

    order = event['queryStringParameters']['order']
    per_page = event['queryStringParameters']['perPage']
    cur_page = event['queryStringParameters']['curPage']
    search_title = event['queryStringParameters']['searchTitle']
    type = event['pathParameters']['type']

    search_condition = {}
    if search_title is not None:
        search_condition = {"title": {"$regex": search_title}}

    if type == 'my':
        search_condition['writer'] = user['id']

    limit = int(per_page)
    skip = limit * (int(cur_page) - 1)
    total_count = db.article.count_documents(search_condition)
    total_page = int(total_count / limit) + (1 if total_count % limit > 0 else 0)

    if order == "desc":
        articles = list(db.article.find(search_condition, {'_id': False})
                        .sort([("read_count", -1)]).skip(skip).limit(limit))
    else:
        articles = list(db.article.find(search_condition, {'_id': False})
                        .sort([("reg_date", -1)]).skip(skip).limit(limit))

    for a in articles:
        a['reg_date'] = a['reg_date'].strftime('%Y.%m.%d %H:%M:%S')

    paging_info = {
        "totalCount": total_count,
        "totalPage": total_page,
        "perPage": per_page,
        "curPage": cur_page,
        "searchTitle": search_title
    }

    return {
        "statusCode": 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,GET'
        },
        "body": json.dumps({
            "result": "success",
            "articles": articles,
            "pagingInfo": paging_info
        }),
    }
